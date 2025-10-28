// server/src/server.test.ts
import request from 'supertest';
import { app } from './server';

describe('API Tests', () => {
  it('GET /health should return ok', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
  
  it('POST /api/messages should validate input', async () => {
    const response = await request(app)
      .post('/api/messages')
      .send({ text: 'Test' });
    
    expect(response.status).toBe(400);
  });
});