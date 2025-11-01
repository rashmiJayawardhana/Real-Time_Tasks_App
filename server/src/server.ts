// server/src/server.ts
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './db';
import { Message, CreateMessageRequest, CreateUserRequest, User } from './types';

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

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
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

// Create message
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
    
    // Broadcast to all connected clients
    io.emit('message:new', newMessage);
    
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
  });
}

export { app, httpServer, io };