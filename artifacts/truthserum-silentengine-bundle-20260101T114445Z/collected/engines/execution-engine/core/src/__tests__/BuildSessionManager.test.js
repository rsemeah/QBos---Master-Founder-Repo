"use strict";
/**
 * Tests for BuildSessionManager (ExecutionEngine)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const BuildSessionManager_1 = require("../BuildSessionManager");
// Mock Supabase
const mockFrom = jest.fn();
const mockInsert = jest.fn();
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({
        from: mockFrom,
    })),
}));
describe('BuildSessionManager (ExecutionEngine)', () => {
    let buildSession;
    beforeEach(() => {
        jest.clearAllMocks();
        // Setup default mock chain
        mockFrom.mockReturnValue({
            insert: mockInsert,
            select: mockSelect,
            update: mockUpdate,
        });
        mockInsert.mockReturnValue({
            select: mockSelect,
        });
        mockSelect.mockReturnValue({
            eq: mockEq,
            single: mockSingle,
        });
        mockEq.mockReturnValue({
            single: mockSingle,
        });
        mockUpdate.mockReturnValue({
            eq: mockEq,
        });
        buildSession = new BuildSessionManager_1.BuildSession('https://test.supabase.co', 'test-key');
    });
    describe('create', () => {
        it('should create new build session', async () => {
            const mockSession = {
                id: 'session123',
                user_id: 'user123',
                idea_description: 'A todo app',
                current_state: 'IDEA_CAPTURE',
                readiness_tier: 'DRAFT',
                created_at: new Date().toISOString(),
            };
            mockSingle.mockResolvedValueOnce({ data: mockSession, error: null });
            mockInsert.mockReturnValueOnce({ select: mockSelect }); // For receipt insert
            const result = await buildSession.create('user123', 'A todo app');
            expect(result).toEqual(mockSession);
            expect(mockFrom).toHaveBeenCalledWith('build_sessions');
            expect(mockInsert).toHaveBeenCalledWith({
                user_id: 'user123',
                idea_description: 'A todo app',
                current_state: 'IDEA_CAPTURE',
                readiness_tier: 'DRAFT',
            });
        });
        it('should emit idea.captured receipt', async () => {
            const mockSession = {
                id: 'session123',
                user_id: 'user123',
                idea_description: 'A todo app',
                current_state: 'IDEA_CAPTURE',
                readiness_tier: 'DRAFT',
            };
            mockSingle.mockResolvedValueOnce({ data: mockSession, error: null });
            const mockReceiptInsert = jest.fn().mockReturnValue({ select: mockSelect });
            mockFrom.mockReturnValueOnce({ insert: mockInsert, select: mockSelect })
                .mockReturnValueOnce({ insert: mockReceiptInsert });
            mockInsert.mockReturnValue({ select: mockSelect });
            mockSelect.mockReturnValue({ single: mockSingle });
            await buildSession.create('user123', 'A todo app');
            // Verify receipt was inserted
            expect(mockFrom).toHaveBeenCalledWith('build_receipts');
            expect(mockReceiptInsert).toHaveBeenCalledWith({
                session_id: 'session123',
                type: 'idea.captured',
                details: expect.objectContaining({
                    ideaDescription: 'A todo app',
                }),
            });
        });
        it('should throw error on database failure', async () => {
            mockSingle.mockResolvedValue({ data: null, error: new Error('Database error') });
            await expect(buildSession.create('user123', 'A todo app')).rejects.toThrow('Database error');
        });
    });
    describe('matchTemplate', () => {
        it('should match template by keywords', async () => {
            const mockSession = {
                id: 'session123',
                idea_description: 'I want to build an authentication system',
                user_id: 'user123',
            };
            const mockTemplates = [
                {
                    id: 'auth-starter',
                    name: 'Auth Starter',
                    keywords: ['auth', 'authentication', 'login'],
                    is_active: true,
                },
                {
                    id: 'ecommerce',
                    name: 'E-commerce',
                    keywords: ['shop', 'store', 'ecommerce'],
                    is_active: true,
                },
            ];
            // First call: get session
            mockSingle.mockResolvedValueOnce({ data: mockSession, error: null });
            // Second call: get templates
            mockSelect.mockResolvedValueOnce({ data: mockTemplates, error: null });
            const result = await buildSession.matchTemplate('session123');
            expect(result.template.id).toBe('auth-starter');
            expect(result.confidence).toBe('high');
        });
        it('should default to auth-starter when no keyword match', async () => {
            const mockSession = {
                id: 'session123',
                idea_description: 'Build something random',
                user_id: 'user123',
            };
            const mockTemplates = [
                {
                    id: 'auth-starter',
                    name: 'Auth Starter',
                    keywords: ['auth', 'authentication'],
                    is_active: true,
                },
                {
                    id: 'other',
                    name: 'Other',
                    keywords: ['xyz'],
                    is_active: true,
                },
            ];
            mockSingle.mockResolvedValueOnce({ data: mockSession, error: null });
            mockSelect.mockResolvedValueOnce({ data: mockTemplates, error: null });
            const result = await buildSession.matchTemplate('session123');
            expect(result.template.id).toBe('auth-starter');
            expect(result.confidence).toBe('default');
        });
        it('should update session with matched template', async () => {
            const mockSession = {
                id: 'session123',
                idea_description: 'auth app',
                user_id: 'user123',
            };
            const mockTemplates = [
                {
                    id: 'auth-starter',
                    name: 'Auth Starter',
                    keywords: ['auth'],
                    is_active: true,
                },
            ];
            mockSingle.mockResolvedValueOnce({ data: mockSession, error: null });
            mockSelect.mockResolvedValueOnce({ data: mockTemplates, error: null });
            mockEq.mockResolvedValue({ data: {}, error: null });
            await buildSession.matchTemplate('session123');
            expect(mockUpdate).toHaveBeenCalledWith({
                template_id: 'auth-starter',
                current_state: 'TEMPLATE_MATCH',
            });
        });
        it('should emit template.matched receipt', async () => {
            const mockSession = {
                id: 'session123',
                idea_description: 'auth app',
                user_id: 'user123',
            };
            const mockTemplates = [
                {
                    id: 'auth-starter',
                    name: 'Auth Starter',
                    keywords: ['auth'],
                    is_active: true,
                },
            ];
            mockSingle.mockResolvedValueOnce({ data: mockSession, error: null });
            mockSelect.mockResolvedValueOnce({ data: mockTemplates, error: null });
            const mockReceiptInsert = jest.fn();
            mockFrom.mockReturnValue({
                select: mockSelect,
                update: mockUpdate,
                insert: mockReceiptInsert,
            });
            await buildSession.matchTemplate('session123');
            expect(mockReceiptInsert).toHaveBeenCalledWith({
                session_id: 'session123',
                type: 'template.matched',
                details: expect.objectContaining({
                    templateId: 'auth-starter',
                    templateName: 'Auth Starter',
                }),
            });
        });
        it('should throw error when no templates available', async () => {
            const mockSession = {
                id: 'session123',
                idea_description: 'test',
                user_id: 'user123',
            };
            mockSingle.mockResolvedValueOnce({ data: mockSession, error: null });
            mockSelect.mockResolvedValueOnce({ data: [], error: null }); // No templates
            await expect(buildSession.matchTemplate('session123')).rejects.toThrow('No templates available');
        });
        it('should throw error on session not found', async () => {
            mockSingle.mockResolvedValue({ data: null, error: new Error('Session not found') });
            await expect(buildSession.matchTemplate('fake-id')).rejects.toThrow('Session not found');
        });
    });
});
//# sourceMappingURL=BuildSessionManager.test.js.map