// app/src/services/offlineQueue.ts
// Stores messages when offline and automatically sends them when back online.
 
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const QUEUE_KEY = '@message_queue';

export interface QueuedMessage {
  id: string; 
  userId: number;
  text: string;
  timestamp: number;
  retryCount: number;
}

class OfflineQueue {
  private queue: QueuedMessage[] = [];
  private isOnline: boolean = true;
  private listeners: Array<(queue: QueuedMessage[]) => void> = [];

  async initialize() {
    // Load queued messages from storage
    await this.loadQueue();

    // Listen to network status
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // If we just came back online, process queue
      if (wasOffline && this.isOnline) {
        console.log('Back online! Processing queued messages...');
        this.processQueue();
      }
    });
  }

  private async loadQueue() {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to load message queue:', error);
    }
  }

  private async saveQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save message queue:', error);
    }
  }

  // Add a message to the queue
  async enqueue(userId: number, text: string): Promise<string> {
    const message: QueuedMessage = {
      id: `temp_${Date.now()}_${Math.random()}`,
      userId,
      text,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(message);
    await this.saveQueue();
    this.notifyListeners();

    return message.id;
  }

  //Remove a message from the queue
  async dequeue(id: string) {
    this.queue = this.queue.filter((msg) => msg.id !== id);
    await this.saveQueue();
    this.notifyListeners();
  }

  //Get all queued messages
  getQueue(): QueuedMessage[] {
    return [...this.queue];
  }

  //Check if there are pending messages
  hasPendingMessages(): boolean {
    return this.queue.length > 0;
  }

  //Process all queued messages (send them to server)
  async processQueue() {
    if (this.queue.length === 0) return;

    console.log(`Processing ${this.queue.length} queued messages...`);

    // Create a copy to iterate over
    const messages = [...this.queue];

    for (const message of messages) {
      try {
        // Import api here to avoid circular dependency
        const { api } = await import('./api');
        
        await api.createMessage(message.userId, message.text);
        
        // Success! Remove from queue
        await this.dequeue(message.id);
        console.log(`Successfully sent queued message: ${message.id}`);
      } catch (error) {
        console.error(`Failed to send queued message ${message.id}:`, error);
        
        // Increment retry count
        const index = this.queue.findIndex((m) => m.id === message.id);
        if (index !== -1) {
          this.queue[index].retryCount++;
          
          // Remove if retried too many times (prevent infinite loop)
          if (this.queue[index].retryCount >= 3) {
            console.log(`Removing message ${message.id} after 3 failed retries`);
            await this.dequeue(message.id);
          } else {
            await this.saveQueue();
          }
        }
      }
    }

    this.notifyListeners();
  }

  //Subscribe to queue changes
  subscribe(listener: (queue: QueuedMessage[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.getQueue()));
  }

  //Clear all queued messages (use with caution)
  async clear() {
    this.queue = [];
    await AsyncStorage.removeItem(QUEUE_KEY);
    this.notifyListeners();
  }
}

export const offlineQueue = new OfflineQueue();

// Auto-initialize
offlineQueue.initialize().catch(console.error);