import request from 'supertest';
import { app } from '../app.js';
import { User } from '../models/user.model.js';
import { createTestUser } from './helpers.js';

describe('Auth Routes', () => {
    describe('POST /api/v1/auth/register', () => {
        it('should register a new user', async () => {
            const userData = {
                username: 'newuser',
                email: 'new@example.com',
                password: 'password123',
                fullName: 'New User'
            };

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body.data).toHaveProperty('user');
            expect(response.body.data.user).toHaveProperty('username', userData.username);
        });

        it('should not register user with existing email', async () => {
            const { user } = await createTestUser();

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    username: 'anotheruser',
                    email: user.email,
                    password: 'password123',
                    fullName: 'Another User'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/v1/auth/login', () => {
        it('should login existing user', async () => {
            const { user } = await createTestUser();

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: user.email,
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('accessToken');
        });

        it('should not login with wrong password', async () => {
            const { user } = await createTestUser();

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: user.email,
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/v1/auth/logout', () => {
        it('should logout user', async () => {
            const { accessToken } = await createTestUser();

            const response = await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
        });
    });
}); 
import { app } from '../app.js';
import { User } from '../models/user.model.js';
import { createTestUser } from './helpers.js';

describe('Auth Routes', () => {
    describe('POST /api/v1/auth/register', () => {
        it('should register a new user', async () => {
            const userData = {
                username: 'newuser',
                email: 'new@example.com',
                password: 'password123',
                fullName: 'New User'
            };

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body.data).toHaveProperty('user');
            expect(response.body.data.user).toHaveProperty('username', userData.username);
        });

        it('should not register user with existing email', async () => {
            const { user } = await createTestUser();

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    username: 'anotheruser',
                    email: user.email,
                    password: 'password123',
                    fullName: 'Another User'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/v1/auth/login', () => {
        it('should login existing user', async () => {
            const { user } = await createTestUser();

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: user.email,
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('accessToken');
        });

        it('should not login with wrong password', async () => {
            const { user } = await createTestUser();

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: user.email,
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/v1/auth/logout', () => {
        it('should logout user', async () => {
            const { accessToken } = await createTestUser();

            const response = await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
        });
    });
}); 