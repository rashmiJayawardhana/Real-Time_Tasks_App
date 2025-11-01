// server/src/server.test.ts
import request from 'supertest';
import { app, httpServer } from './server';
import db from './db';

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

// Mock database for tests
jest.mock('./db');

const mockDb = db as jest.Mocked<typeof db>;

// API ENDPOINT TESTS
describe('API Endpoint Tests', () => {
  // SETUP - Runs before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // HEALTH CHECK ENDPOINT
  describe('GET /health', () => {
    it('should return ok status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  // GET MESSAGES ENDPOINT
  describe('GET /api/messages', () => {
    it('should return messages successfully', async () => {
      const mockDate = new Date('2025-10-31T07:24:45.120Z');
      const mockMessages = [
        {
          id: 1,
          user_id: 1,
          text: 'Test message',
          created_at: mockDate, // Database returns Date objects
          user_name: 'Test User',
        },
      ];

      mockDb.query.mockResolvedValueOnce([mockMessages as any, [] as any]);

      const response = await request(app).get('/api/messages?limit=50');

      expect(response.status).toBe(200);
      
      // API serializes dates to ISO strings
      expect(response.body).toEqual([
        {
          id: 1,
          user_id: 1,
          text: 'Test message',
          created_at: mockDate.toISOString(), // Compare with ISO string
          user_name: 'Test User',
        },
      ]);
      
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [50]
      );
    });

    it('should handle database errors', async () => {
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app).get('/api/messages');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Failed to fetch messages' });
    });

    it('should use default limit of 50 if not provided', async () => {
      mockDb.query.mockResolvedValueOnce([[], []]);

      await request(app).get('/api/messages');

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.any(String),
        [50]
      );
    });
  });

  // CREATE MESSAGE ENDPOINT
  describe('POST /api/messages', () => {
    it('should create a message successfully', async () => {
      const mockDate = new Date('2025-10-31T07:24:45.154Z');
      const mockInsertResult = { insertId: 1 } as any;
      const mockCreatedMessage = {
        id: 1,
        user_id: 1,
        text: 'New message',
        created_at: mockDate, // Database returns Date
        user_name: 'Test User',
      };

      mockDb.query
        .mockResolvedValueOnce([mockInsertResult, [] as any])
        .mockResolvedValueOnce([[mockCreatedMessage] as any, [] as any]);

      const response = await request(app)
        .post('/api/messages')
        .send({ user_id: 1, text: 'New message' });

      expect(response.status).toBe(201);
      
      // API serializes to ISO string
      expect(response.body).toEqual({
        id: 1,
        user_id: 1,
        text: 'New message',
        created_at: mockDate.toISOString(),
        user_name: 'Test User',
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/messages')
        .send({ text: 'Missing user_id' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'user_id and text are required',
      });
    });

    it('should reject empty text', async () => {
      const response = await request(app)
        .post('/api/messages')
        .send({ user_id: 1, text: '   ' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'user_id and text are required',
      });
    });

    it('should reject text longer than 1000 characters', async () => {
      const longText = 'a'.repeat(1001);

      const response = await request(app)
        .post('/api/messages')
        .send({ user_id: 1, text: longText });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Text too long (max 1000 chars)',
      });
    });

    it('should trim whitespace from text', async () => {
      const mockDate = new Date();
      const mockInsertResult = { insertId: 1 } as any;
      const mockCreatedMessage = {
        id: 1,
        user_id: 1,
        text: 'Trimmed message',
        created_at: mockDate,
        user_name: 'Test User',
      };

      mockDb.query
        .mockResolvedValueOnce([mockInsertResult, [] as any])
        .mockResolvedValueOnce([[mockCreatedMessage] as any, [] as any]);

      await request(app)
        .post('/api/messages')
        .send({ user_id: 1, text: '  Trimmed message  ' });

      expect(mockDb.query).toHaveBeenCalledWith(
        'INSERT INTO messages (user_id, text) VALUES (?, ?)',
        [1, 'Trimmed message']
      );
    });
  });

  // CREATE USER ENDPOINT
  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const mockDate = new Date('2025-10-31T07:24:45.200Z');
      const mockUser = {
        id: 1,
        name: 'New User',
        created_at: mockDate, // Database returns Date
      };

      mockDb.query
        .mockResolvedValueOnce([[] as any, [] as any]) // No existing user
        .mockResolvedValueOnce([{ insertId: 1 } as any, [] as any])
        .mockResolvedValueOnce([[mockUser] as any, [] as any]);

      const response = await request(app)
        .post('/api/users')
        .send({ name: 'New User' });

      expect(response.status).toBe(201);
      
      // API serializes to ISO string
      expect(response.body).toEqual({
        id: 1,
        name: 'New User',
        created_at: mockDate.toISOString(),
      });
    });

    it('should return existing user if name already exists', async () => {
      const mockDate = new Date('2025-10-31T07:24:45.204Z');
      const existingUser = {
        id: 1,
        name: 'Existing User',
        created_at: mockDate, // Database returns Date
      };

      mockDb.query.mockResolvedValueOnce([[existingUser] as any, [] as any]);

      const response = await request(app)
        .post('/api/users')
        .send({ name: 'Existing User' });

      expect(response.status).toBe(200);
      
      // API serializes to ISO string
      expect(response.body).toEqual({
        id: 1,
        name: 'Existing User',
        created_at: mockDate.toISOString(),
      });
    });

    it('should validate name is required', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ name: '' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'name is required' });
    });

    it('should trim whitespace from name', async () => {
      mockDb.query
        .mockResolvedValueOnce([[] as any, [] as any])
        .mockResolvedValueOnce([{ insertId: 1 } as any, [] as any])
        .mockResolvedValueOnce([[{ id: 1, name: 'User', created_at: new Date() }] as any, [] as any]);

      await request(app)
        .post('/api/users')
        .send({ name: '  User  ' });

      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE name = ?',
        ['User']
      );
    });
  });

  // INPUT VALIDATION & SECURITY
  describe('Input Validation', () => {
    it('should reject malformed JSON', async () => {
      const response = await request(app)
        .post('/api/messages')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });

    it('should handle SQL injection attempts safely', async () => {
      const sqlInjection = "'; DROP TABLE messages; --";

      mockDb.query.mockResolvedValueOnce([[], []]);

      const response = await request(app)
        .post('/api/users')
        .send({ name: sqlInjection });

      // Should not throw error, parameterized queries prevent injection
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.any(String),
        [sqlInjection]
      );
    });
  });

  // CORS CONFIGURATION
  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:19000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});

// DATABASE CONNECTION TESTS
describe('Database Connection', () => {
  it('should export a valid pool object', () => {
    expect(db).toBeDefined();
    expect(typeof db.query).toBe('function');
  });
});

// ERROR HANDLING TESTS
describe('Error Handling', () => {
  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/api/unknown');
    expect(response.status).toBe(404);
  });

  it('should handle internal server errors gracefully', async () => {
    mockDb.query.mockRejectedValueOnce(new Error('Unexpected error'));

    const response = await request(app).get('/api/messages');

    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
  });

});

// CLEANUP - Runs after all tests
afterAll(async () => {
  await httpServer.close(); // closes the Express HTTP server
});