/**
 * Tests for /api/build/start endpoint
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/build/start/route';

// Mock Supabase
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
    },
  })),
}));

// Mock BuildSession
jest.mock('@/../../../packages/engines/execution-engine/core/src/BuildSessionManager', () => ({
  BuildSession: jest.fn(() => ({
    create: jest.fn(),
    matchTemplate: jest.fn(),
  })),
}));

describe('/api/build/start', () => {
  it('should return 401 when user is not authenticated', async () => {
    const { createRouteHandlerClient } = require('@supabase/auth-helpers-nextjs');
    createRouteHandlerClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Not authenticated'),
        }),
      },
    });

    const request = new NextRequest('http://localhost:3000/api/build/start', {
      method: 'POST',
      body: JSON.stringify({ ideaDescription: 'Test app' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Unauthorized');
  });

  it('should create build session when authenticated', async () => {
    const mockUser = { id: 'user123', email: 'test@example.com' };
    const mockSession = {
      id: 'session123',
      user_id: 'user123',
      idea_description: 'Test app',
      current_state: 'IDEA_CAPTURE',
    };
    const mockTemplate = {
      id: 'auth-starter',
      name: 'Auth Starter',
      confidence: 'high',
    };

    const { createRouteHandlerClient } = require('@supabase/auth-helpers-nextjs');
    const { BuildSession } = require('@/../../../packages/engines/execution-engine/core/src/BuildSessionManager');

    const mockCreate = jest.fn().mockResolvedValue(mockSession);
    const mockMatchTemplate = jest.fn().mockResolvedValue({ template: mockTemplate, confidence: 'high' });

    createRouteHandlerClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    });

    BuildSession.mockImplementation(() => ({
      create: mockCreate,
      matchTemplate: mockMatchTemplate,
    }));

    const request = new NextRequest('http://localhost:3000/api/build/start', {
      method: 'POST',
      body: JSON.stringify({ ideaDescription: 'Test app' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.session).toEqual(mockSession);
    expect(mockCreate).toHaveBeenCalledWith('user123', 'Test app');
    expect(mockMatchTemplate).toHaveBeenCalledWith('session123');
  });

  it('should return 500 on internal error', async () => {
    const mockUser = { id: 'user123', email: 'test@example.com' };

    const { createRouteHandlerClient } = require('@supabase/auth-helpers-nextjs');
    const { BuildSession } = require('@/../../../packages/engines/execution-engine/core/src/BuildSessionManager');

    createRouteHandlerClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    });

    BuildSession.mockImplementation(() => ({
      create: jest.fn().mockRejectedValue(new Error('Database error')),
      matchTemplate: jest.fn(),
    }));

    const request = new NextRequest('http://localhost:3000/api/build/start', {
      method: 'POST',
      body: JSON.stringify({ ideaDescription: 'Test app' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed to start build session');
  });
});
