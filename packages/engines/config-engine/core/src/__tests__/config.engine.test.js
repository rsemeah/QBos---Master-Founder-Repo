"use strict";
/**
 * Tests for ConfigEngine
 */
Object.defineProperty(exports, "__esModule", { value: true });
const config_engine_1 = require("../config.engine");
describe('ConfigEngine', () => {
    let engine;
    beforeEach(() => {
        engine = new config_engine_1.ConfigEngine();
    });
    describe('setFlag', () => {
        it('should create new flag', async () => {
            const flag = await engine.setFlag('feature-x', 'enabled', {
                description: 'New feature X',
            });
            expect(flag.key).toBe('feature-x');
            expect(flag.status).toBe('enabled');
            expect(flag.description).toBe('New feature X');
            expect(flag.createdAt).toBeDefined();
        });
        it('should update existing flag', async () => {
            await engine.setFlag('feature-y', 'disabled');
            const updated = await engine.setFlag('feature-y', 'enabled');
            expect(updated.status).toBe('enabled');
            expect(updated.updatedAt).toBeDefined();
        });
    });
    describe('isEnabled', () => {
        it('should return false for non-existent flag', async () => {
            const result = await engine.isEnabled('non-existent');
            expect(result.enabled).toBe(false);
            expect(result.reason).toContain('not found');
        });
        it('should return false for disabled flag', async () => {
            await engine.setFlag('feature-disabled', 'disabled');
            const result = await engine.isEnabled('feature-disabled');
            expect(result.enabled).toBe(false);
            expect(result.reason).toContain('disabled');
        });
        it('should return true for enabled flag', async () => {
            await engine.setFlag('feature-enabled', 'enabled');
            const result = await engine.isEnabled('feature-enabled');
            expect(result.enabled).toBe(true);
            expect(result.reason).toContain('globally enabled');
        });
        it('should evaluate conditional flags', async () => {
            await engine.setFlag('feature-conditional', 'conditional', {
                conditions: [
                    {
                        type: 'user',
                        operator: 'equals',
                        value: 'user123',
                    },
                ],
            });
            const resultMatch = await engine.isEnabled('feature-conditional', {
                userId: 'user123',
            });
            expect(resultMatch.enabled).toBe(true);
            expect(resultMatch.matchedCondition).toBeDefined();
            const resultNoMatch = await engine.isEnabled('feature-conditional', {
                userId: 'user456',
            });
            expect(resultNoMatch.enabled).toBe(false);
        });
        it('should handle "in" operator for conditional flags', async () => {
            await engine.setFlag('beta-feature', 'conditional', {
                conditions: [
                    {
                        type: 'user',
                        operator: 'in',
                        value: ['user1', 'user2', 'user3'],
                    },
                ],
            });
            const resultIn = await engine.isEnabled('beta-feature', {
                userId: 'user2',
            });
            expect(resultIn.enabled).toBe(true);
            const resultOut = await engine.isEnabled('beta-feature', {
                userId: 'user99',
            });
            expect(resultOut.enabled).toBe(false);
        });
    });
    describe('setConfig', () => {
        it('should set global config', async () => {
            const config = await engine.setConfig('max-uploads', 10);
            expect(config.key).toBe('max-uploads');
            expect(config.value).toBe(10);
            expect(config.scope).toBe('global');
        });
        it('should set scoped config', async () => {
            const config = await engine.setConfig('theme', 'dark', {
                scope: 'user',
                scopeId: 'user123',
            });
            expect(config.key).toBe('theme');
            expect(config.value).toBe('dark');
            expect(config.scope).toBe('user');
            expect(config.scopeId).toBe('user123');
        });
    });
    describe('getConfig', () => {
        it('should get global config', async () => {
            await engine.setConfig('app-name', 'QuietBuild OS');
            const value = await engine.getConfig('app-name');
            expect(value).toBe('QuietBuild OS');
        });
        it('should return default when config not found', async () => {
            const value = await engine.getConfig('missing-config', {
                defaultValue: 'default',
            });
            expect(value).toBe('default');
        });
        it('should get scoped config and fall back to global', async () => {
            await engine.setConfig('timeout', 5000); // Global
            await engine.setConfig('timeout', 10000, {
                scope: 'user',
                scopeId: 'user123',
            }); // User-specific
            const userValue = await engine.getConfig('timeout', {
                scope: 'user',
                scopeId: 'user123',
            });
            expect(userValue).toBe(10000);
            const otherUserValue = await engine.getConfig('timeout', {
                scope: 'user',
                scopeId: 'user456',
            });
            expect(otherUserValue).toBe(5000); // Falls back to global
        });
    });
    describe('listFlags', () => {
        it('should return all flags', async () => {
            await engine.setFlag('flag1', 'enabled');
            await engine.setFlag('flag2', 'disabled');
            const flags = await engine.listFlags();
            expect(flags).toHaveLength(2);
            expect(flags.map(f => f.key)).toContain('flag1');
            expect(flags.map(f => f.key)).toContain('flag2');
        });
    });
    describe('deleteFlag', () => {
        it('should delete flag', async () => {
            await engine.setFlag('temp-flag', 'enabled');
            const deleted = await engine.deleteFlag('temp-flag');
            expect(deleted).toBe(true);
            const flag = await engine.getFlag('temp-flag');
            expect(flag).toBeNull();
        });
        it('should return false when flag does not exist', async () => {
            const deleted = await engine.deleteFlag('non-existent');
            expect(deleted).toBe(false);
        });
    });
});
//# sourceMappingURL=config.engine.test.js.map