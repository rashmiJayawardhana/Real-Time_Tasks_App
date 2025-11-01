// server/src/server.ts 
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './db';
import { CreateMessageRequest, CreateUserRequest, ExpoPushResult } from './types';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Helper function to send push notifications
async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data: any = {}
) {
  const message = {
    to: token,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high' as const,
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = (await response.json()) as ExpoPushResult;

    if (result.data?.status === 'error') {
      console.error('Push notification error:', result.data);

      // Remove invalid tokens
      if (result.data.details?.error === 'DeviceNotRegistered') {
        await db.query('DELETE FROM push_tokens WHERE token = ?', [token]);
        console.log(`Removed invalid token: ${token}`);
      }
    }

    return result;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return null;
  }
}

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Register push token
app.post('/api/push-tokens', async (req: Request, res: Response) => {
  try {
    const { user_id, token, platform } = req.body;

    if (!user_id || !token || !platform) {
      return res.status(400).json({
        error: 'user_id, token, and platform are required'
      });
    }

    // Insert or update token
    await db.query(
      `INSERT INTO push_tokens (user_id, token, platform)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
       last_used = CURRENT_TIMESTAMP`,
      [user_id, token, platform]
    );

    console.log(`Registered push token for user ${user_id}`);
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error registering push token:', error);
    res.status(500).json({ error: 'Failed to register push token' });
  }
});

// Delete push token (on logout)
app.delete('/api/push-tokens/:token', async (req: Request, res: Response) => {
  try {
    const token = req.params.token;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    await db.query('DELETE FROM push_tokens WHERE token = ?', [token]);

    console.log(`Deleted push token: ${token}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting push token:', error);
    res.status(500).json({ error: 'Failed to delete push token' });
  }
});

// Get all users
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const [users] = await db.query<any[]>(
      `SELECT
        u.id,
        u.name,
        u.created_at,
        COUNT(m.id) as messageCount,
        MAX(m.created_at) as lastMessageTime
       FROM users u
       LEFT JOIN messages m ON u.id = m.user_id
       GROUP BY u.id, u.name, u.created_at
       ORDER BY u.created_at DESC`
    );

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const [users] = await db.query<any[]>(
      `SELECT
        u.id,
        u.name,
        u.created_at,
        COUNT(m.id) as messageCount
       FROM users u
       LEFT JOIN messages m ON u.id = m.user_id
       WHERE u.id = ?
       GROUP BY u.id, u.name, u.created_at`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get messages by user ID
app.get('/api/users/:id/messages', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const limit = parseInt(req.query.limit as string) || 50;

    const [messages] = await db.query<any[]>(
      `SELECT m.id, m.user_id, m.text, m.created_at, u.name as user_name
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.user_id = ?
       ORDER BY m.created_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    res.json(messages);
  } catch (error) {
    console.error('Error fetching user messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get messages
app.get('/api/messages', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const [rows] = await db.query<any[]>(
      `SELECT m.id, m.user_id, m.text, m.created_at, u.name as user_name
       FROM messages m
       JOIN users u ON m.user_id = u.id
       ORDER BY m.created_at DESC
       LIMIT ?`,
      [limit]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Create message - WITH PUSH NOTIFICATIONS 
app.post('/api/messages', async (req: Request, res: Response) => {
  try {
    const { user_id, text }: CreateMessageRequest = req.body;

    // Validation
    if (!user_id || !text || text.trim().length === 0) {
      return res.status(400).json({ error: 'user_id and text are required' });
    }

    if (text.length > 1000) {
      return res.status(400).json({ error: 'Text too long (max 1000 chars)' });
    }

    // Insert message
    const [result] = await db.query<any>(
      'INSERT INTO messages (user_id, text) VALUES (?, ?)',
      [user_id, text.trim()]
    );

    // Fetch the created message with user info
    const [messages] = await db.query<any[]>(
      `SELECT m.id, m.user_id, m.text, m.created_at, u.name as user_name
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.id = ?`,
      [result.insertId]
    );

    const newMessage = messages[0];

    // Broadcast to all connected clients via WebSocket
    io.emit('message:new', newMessage);

    // Send push notifications to all users EXCEPT the sender
    try {
      const [tokens] = await db.query<any[]>(
        `SELECT DISTINCT token
         FROM push_tokens
         WHERE user_id != ?`,
        [user_id]
      );

      console.log(`Sending ${tokens.length} push notifications for message ${newMessage.id}`);

      // Send notifications asynchronously (don't block response)
      const notifications = tokens.map(({ token }) =>
        sendPushNotification(
          token,
          `💬 ${newMessage.user_name}`,
          text.trim().substring(0, 100), // Truncate long messages
          {
            messageId: newMessage.id,
            message: newMessage,
          }
        )
      );

      // Fire and forget (don't wait)
      Promise.all(notifications).catch(err =>
        console.error('Error sending push notifications:', err)
      );
    } catch (pushError) {
      console.error('Error in push notification logic:', pushError);
      // Don't fail the request if push notifications fail
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

// Create or get user
app.post('/api/users', async (req: Request, res: Response) => {
  try {
    const { name }: CreateUserRequest = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required' });
    }

    // Try to find existing user
    const [existingUsers] = await db.query<any[]>(
      'SELECT * FROM users WHERE name = ?',
      [name.trim()]
    );

    if (existingUsers.length > 0) {
      return res.json(existingUsers[0]);
    }

    // Create new user
    const [result] = await db.query<any>(
      'INSERT INTO users (name) VALUES (?)',
      [name.trim()]
    );

    const [newUsers] = await db.query<any[]>(
      'SELECT * FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newUsers[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('client:join', (data) => {
    console.log('User joined:', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Push notifications enabled');
  });
}

export { app, httpServer, io };