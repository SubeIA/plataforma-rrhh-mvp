import request from 'supertest';
import app from '../src/app.js';

describe('Health Check API', () => {
    it('should return 200 OK and status information', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('status', 'OK');
        expect(res.body).toHaveProperty('database');
    });

    it('should return 404 for unknown routes', async () => {
        const res = await request(app).get('/api/unknown-route');
        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty('error', true);
    });
});
