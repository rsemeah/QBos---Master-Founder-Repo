"use strict";
/**
 * Tests for /api/jobs/process endpoint
 */
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("next/server");
const route_1 = require("@/app/api/jobs/process/route");
// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        from: jest.fn(),
    })),
}));
const mockFrom = jest.fn();
const mockUpdate = jest.fn();
const mockSelect = jest.fn();
describe('/api/jobs/process', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock chain
        mockFrom.mockReturnValue({
            select: mockSelect,
            update: mockUpdate,
        });
        mockSelect.mockReturnValue({
            eq: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        });
        mockUpdate.mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
        });
    });
    it('should return 0 when no jobs are pending', async () => {
        mockSelect.mockReturnValue({
            eq: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        });
        const request = new server_1.NextRequest('http://localhost:3000/api/jobs/process', {
            method: 'POST',
        });
        const response = await (0, route_1.POST)(request);
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.processed).toBe(0);
    });
    it('should process pending jobs', async () => {
        const mockJobs = [
            {
                id: 'job1',
                session_id: 'session123',
                job_type: 'generate_code',
                payload: { sessionId: 'session123' },
                status: 'pending',
                attempts: 0,
            },
        ];
        mockSelect.mockReturnValue({
            eq: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: mockJobs, error: null }),
        });
        const request = new server_1.NextRequest('http://localhost:3000/api/jobs/process', {
            method: 'POST',
        });
        const response = await (0, route_1.POST)(request);
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.processed).toBeGreaterThan(0);
        // Verify job status was updated
        expect(mockUpdate).toHaveBeenCalled();
    });
    it('should mark failed jobs after max retries', async () => {
        const mockJobs = [
            {
                id: 'job2',
                session_id: 'session456',
                job_type: 'deploy_vercel',
                payload: { sessionId: 'session456' },
                status: 'pending',
                attempts: 2, // Will be 3 after this attempt
            },
        ];
        mockSelect.mockReturnValue({
            eq: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: mockJobs, error: null }),
        });
        const request = new server_1.NextRequest('http://localhost:3000/api/jobs/process', {
            method: 'POST',
        });
        const response = await (0, route_1.POST)(request);
        const data = await response.json();
        expect(response.status).toBe(200);
        // Should update to 'failed' status after 3 attempts
        expect(mockUpdate).toHaveBeenCalled();
    });
    it('should handle database errors gracefully', async () => {
        mockSelect.mockReturnValue({
            eq: jest.fn().mockReturnThis(),
            lte: jest.fn().mockReturnThis(),
            lt: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockRejectedValue(new Error('Database connection failed')),
        });
        const request = new server_1.NextRequest('http://localhost:3000/api/jobs/process', {
            method: 'POST',
        });
        const response = await (0, route_1.POST)(request);
        const data = await response.json();
        expect(response.status).toBe(500);
        expect(data.error).toBeDefined();
    });
});
//# sourceMappingURL=process.test.js.map