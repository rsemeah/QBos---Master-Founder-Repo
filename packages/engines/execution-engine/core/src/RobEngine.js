"use strict";
/**
 * RobEngine™ - The QuietBuilder State Machine
 *
 * TRUTH: Rob is the user-facing mediator to the constitutional framework.
 * All state transitions emit receipts. Progress ≠ Readiness.
 *
 * Constitutional Compliance: Required
 * Intelligence Enforcement: MANDATORY
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RobEngine = void 0;
const ReceiptSystem_1 = require("./receipts/ReceiptSystem");
const TruthSerumValidator_1 = require("./receipts/TruthSerumValidator");
const IntelligenceGuard_1 = require("./intelligence/IntelligenceGuard");
const IdeaDecomposer_1 = require("./intelligence/IdeaDecomposer");
const PreviewGenerator_1 = require("./intelligence/PreviewGenerator");
class RobEngine {
    receiptSystem;
    truthSerum;
    ideaDecomposer;
    previewGenerator;
    persistence;
    constructor(persistence) {
        this.receiptSystem = new ReceiptSystem_1.ReceiptSystem();
        this.truthSerum = new TruthSerumValidator_1.TruthSerumValidator();
        this.ideaDecomposer = new IdeaDecomposer_1.IdeaDecomposer();
        this.previewGenerator = new PreviewGenerator_1.PreviewGenerator();
        this.persistence = persistence;
    }
    // ==========================================================================
    // SESSION MANAGEMENT
    // ==========================================================================
    /**
     * Create a new Rob session
     */
    async createSession(userId, templateId) {
        const session = {
            user_id: userId,
            template_id: templateId,
            progress_percent: 0,
            readiness_tier: 'draft',
            current_state: 'INIT',
            app_config: {},
        };
        let persistedSession;
        if (this.persistence) {
            persistedSession = await this.persistence.createSession(session);
        }
        else {
            // In-memory fallback
            persistedSession = {
                ...session,
                id: this.generateId(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
        }
        // Emit receipt
        const receipt = this.receiptSystem.emit({
            session_id: persistedSession.id,
            actor: 'rob',
            action_type: 'session.created',
            outcome: 'success',
            evidence_refs: [],
            truth_state: 'Verified',
            metadata: { user_id: userId, template_id: templateId },
        });
        if (this.persistence) {
            await this.persistence.addReceipt(receipt);
        }
        // Transition to WAITING
        await this.transitionState(persistedSession.id, 'WAITING', 'Session initialized');
        return persistedSession;
    }
    /**
     * Get session by ID
     */
    async getSession(sessionId) {
        if (!this.persistence) {
            throw new Error('Persistence layer required for getSession');
        }
        return this.persistence.getSession(sessionId);
    }
    // ==========================================================================
    // STATE MACHINE
    // ==========================================================================
    /**
     * Transition session state
     */
    async transitionState(sessionId, toState, reason, triggeredByMessageId) {
        const session = await this.getSession(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        const fromState = session.current_state;
        // Validate transition (basic validation)
        this.validateStateTransition(fromState, toState);
        // Update session
        if (this.persistence) {
            await this.persistence.updateSession(sessionId, {
                current_state: toState,
            });
        }
        // Record transition
        const transition = {
            from_state: fromState,
            to_state: toState,
            reason,
            triggered_by_message_id: triggeredByMessageId,
        };
        if (this.persistence) {
            await this.persistence.addStateTransition(sessionId, transition);
        }
        // Emit receipt
        const receipt = this.receiptSystem.emit({
            session_id: sessionId,
            actor: 'rob',
            action_type: 'state.transition',
            outcome: 'success',
            evidence_refs: [],
            truth_state: 'Verified',
            metadata: transition,
        });
        if (this.persistence) {
            await this.persistence.addReceipt(receipt);
        }
    }
    /**
     * Validate state transition (basic rules)
     */
    validateStateTransition(from, to) {
        // PUBLISHED is terminal (cannot transition out)
        if (from === 'PUBLISHED' && to !== 'PUBLISHED') {
            throw new Error('Cannot transition from PUBLISHED state');
        }
        // BLOCKED can go to any state (recovery)
        if (from === 'BLOCKED') {
            return;
        }
        // Add more validation rules as needed
    }
    // ==========================================================================
    // CONFIG MANAGEMENT
    // ==========================================================================
    /**
     * Update session configuration
     */
    async updateConfig(sessionId, key, value, changedByMessageId) {
        const session = await this.getSession(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        const oldValue = session.app_config[key];
        const newConfig = { ...session.app_config, [key]: value };
        // Update session
        if (this.persistence) {
            await this.persistence.updateSession(sessionId, {
                app_config: newConfig,
            });
        }
        // Record config change
        const change = {
            key,
            old_value: oldValue,
            new_value: value,
            changed_by_message_id: changedByMessageId,
        };
        if (this.persistence) {
            await this.persistence.addConfigChange(sessionId, change);
        }
        // Emit receipt
        const receipt = this.receiptSystem.emit({
            session_id: sessionId,
            actor: 'rob',
            action_type: 'config.updated',
            outcome: 'success',
            evidence_refs: [],
            truth_state: 'Verified',
            metadata: change,
        });
        if (this.persistence) {
            await this.persistence.addReceipt(receipt);
        }
    }
    // ==========================================================================
    // PROGRESS & READINESS
    // ==========================================================================
    /**
     * Compute progress percentage (0-100)
     * Based on completed steps, NOT readiness
     */
    async computeProgress(sessionId) {
        const session = await this.getSession(sessionId);
        if (!session)
            return 0;
        const receipts = this.persistence
            ? await this.persistence.getReceipts(sessionId)
            : this.receiptSystem.getReceiptsForSession(sessionId);
        // Define required steps and their weights
        const steps = [
            { type: 'session.created', weight: 5 },
            { type: 'template.selected', weight: 10 },
            { type: 'app.named', weight: 10 },
            { type: 'features.selected', weight: 15 },
            { type: 'theme.configured', weight: 10 },
            { type: 'build.started', weight: 10 },
            { type: 'build.passed', weight: 20 },
            { type: 'deploy.requested', weight: 10 },
            { type: 'vercel.deploy_success', weight: 10 },
        ];
        let progress = 0;
        for (const step of steps) {
            const completed = receipts.some((r) => r.action_type === step.type);
            if (completed) {
                progress += step.weight;
            }
        }
        return Math.min(progress, 100);
    }
    /**
     * Compute readiness tier based on gate receipts
     */
    async computeReadiness(sessionId) {
        const receipts = this.persistence
            ? await this.persistence.getReceipts(sessionId)
            : this.receiptSystem.getReceiptsForSession(sessionId);
        const hasReceipt = (type) => receipts.some((r) => r.action_type === type);
        // Published: Deployment confirmed
        if (hasReceipt('vercel.deploy_success') && hasReceipt('healthcheck.ok')) {
            return 'published';
        }
        // Ready: Ready to deploy
        if (hasReceipt('deploy.intent_confirmed') &&
            hasReceipt('build.passed') &&
            hasReceipt('safety.passed')) {
            return 'ready';
        }
        // Viable: Build works
        if (hasReceipt('build.passed') && hasReceipt('preview.rendered')) {
            return 'viable';
        }
        // Shaped: Features defined
        if (hasReceipt('features.selected') && hasReceipt('dependencies.resolved')) {
            return 'shaped';
        }
        // Draft: Just started
        return 'draft';
    }
    /**
     * Update progress and readiness for a session
     */
    async updateProgressAndReadiness(sessionId) {
        const progress = await this.computeProgress(sessionId);
        const readiness = await this.computeReadiness(sessionId);
        if (this.persistence) {
            await this.persistence.updateSession(sessionId, {
                progress_percent: progress,
                readiness_tier: readiness,
            });
        }
    }
    // ==========================================================================
    // UNDO SUPPORT
    // ==========================================================================
    /**
     * Push undo snapshot
     */
    async pushUndoSnapshot(sessionId, actionType, snapshot) {
        const undoSnapshot = {
            action_type: actionType,
            snapshot,
        };
        if (this.persistence) {
            await this.persistence.pushUndoSnapshot(sessionId, undoSnapshot);
        }
        // Emit receipt
        const receipt = this.receiptSystem.emit({
            session_id: sessionId,
            actor: 'rob',
            action_type: 'undo.snapshot_saved',
            outcome: 'success',
            evidence_refs: [],
            truth_state: 'Verified',
            metadata: { action_type: actionType },
        });
        if (this.persistence) {
            await this.persistence.addReceipt(receipt);
        }
    }
    /**
     * Undo last action
     */
    async undoLast(sessionId) {
        if (!this.persistence) {
            throw new Error('Persistence required for undo');
        }
        const snapshot = await this.persistence.popUndoSnapshot(sessionId);
        if (!snapshot) {
            return null;
        }
        // Restore snapshot to session
        await this.persistence.updateSession(sessionId, {
            app_config: snapshot.snapshot.app_config,
        });
        // Emit receipt
        const receipt = this.receiptSystem.emit({
            session_id: sessionId,
            actor: 'user',
            action_type: 'action.undone',
            outcome: 'success',
            evidence_refs: [],
            truth_state: 'Verified',
            metadata: { action_type: snapshot.action_type },
        });
        await this.persistence.addReceipt(receipt);
        return snapshot;
    }
    // ==========================================================================
    // TRUTHSERUM INTEGRATION
    // ==========================================================================
    /**
     * Validate session receipts with TruthSerum
     */
    async validateSession(sessionId) {
        const receipts = this.persistence
            ? await this.persistence.getReceipts(sessionId)
            : this.receiptSystem.getReceiptsForSession(sessionId);
        return this.truthSerum.validate(sessionId, receipts);
    }
    // ==========================================================================
    // INTELLIGENCE ENFORCEMENT (MECHANICAL LAW)
    // ==========================================================================
    /**
     * STEP 1: Decompose user prompt into intelligence receipts
     *
     * This is the FIRST step when processing any build request.
     * Generates the required intelligence receipts that prove Rob is thinking.
     */
    async decomposeIdea(sessionId, messageId, userPrompt) {
        const result = await this.ideaDecomposer.decompose(sessionId, messageId, userPrompt);
        // Store receipts
        if (this.persistence) {
            for (const receipt of result.receipts) {
                await this.persistence.addReceipt(receipt);
            }
        }
        // Emit progress update
        const progressReceipt = this.receiptSystem.emit({
            session_id: sessionId,
            actor: 'rob',
            action_type: 'intelligence.generated',
            outcome: 'success',
            evidence_refs: result.receipts.map((r) => r.type),
            truth_state: 'Verified',
            metadata: {
                receiptsGenerated: result.receipts.length,
                domain: result.summary.domain,
                recommendedPath: result.summary.recommendedPath,
            },
        });
        if (this.persistence) {
            await this.persistence.addReceipt(progressReceipt);
        }
        return result.receipts;
    }
    /**
     * STEP 1.5: Generate living preview (optional standalone call)
     */
    async generatePreview(sessionId, messageId, intelligenceReceipts) {
        return this.previewGenerator.generate(sessionId, messageId, intelligenceReceipts);
    }
    /**
     * STEP 2: Process Build Request (with intelligence receipts)
     *
     * MECHANICAL LAW: This operation REQUIRES intelligence receipts.
     * - idea.decomposed
     * - concept.inferred
     * - direction.recommended
     *
     * Failure to provide these receipts = BLOCKED state
     */
    async processBuildRequest(sessionId, userPrompt, intelligenceReceipts) {
        // GUARD: Enforce intelligence requirements
        const result = await IntelligenceGuard_1.IntelligenceGuard.guard({
            sessionId,
            operation: 'processBuildRequest',
            receipts: intelligenceReceipts,
        }, async () => {
            // Intelligence requirements met - proceed with build
            return this.executeBuild(sessionId, userPrompt, intelligenceReceipts);
        });
        if (!result.allowed) {
            // BLOCKED: Intelligence requirements not met
            await this.transitionState(sessionId, 'BLOCKED', `Intelligence violation: ${result.error?.message}`);
            // Emit violation receipt
            if (result.violationReceipt && this.persistence) {
                await this.persistence.addReceipt(result.violationReceipt);
            }
            return {
                success: false,
                message: result.error?.message || 'Intelligence requirements not met',
                state: 'BLOCKED',
            };
        }
        return {
            success: true,
            message: 'Build request processed with verified intelligence',
            state: result.data?.state || 'BUILDING',
            preview: result.data?.preview,
        };
    }
    /**
     * Execute build (internal - only called after intelligence guard passes)
     */
    async executeBuild(sessionId, userPrompt, intelligenceReceipts) {
        // Transition to BUILDING
        await this.transitionState(sessionId, 'BUILDING', 'Intelligence verified, building...');
        // Store intelligence receipts
        if (this.persistence) {
            for (const receipt of intelligenceReceipts) {
                await this.persistence.addReceipt(receipt);
            }
        }
        // Generate living preview (Phase 3)
        let previewResult;
        try {
            const messageId = `msg_${Date.now()}`;
            previewResult = await this.previewGenerator.generate(sessionId, messageId, intelligenceReceipts);
            // Store preview receipt
            if (this.persistence && previewResult.receipt) {
                await this.persistence.addReceipt(previewResult.receipt);
            }
            // Emit preview success
            this.receiptSystem.emit({
                session_id: sessionId,
                actor: 'rob',
                action_type: 'preview.ready',
                outcome: 'success',
                evidence_refs: [],
                truth_state: 'Verified',
                metadata: {
                    componentName: previewResult.componentName,
                    linesOfCode: previewResult.linesOfCode,
                    interactivityLevel: previewResult.interactivityLevel,
                },
            });
        }
        catch (error) {
            // Preview generation failed - emit failure receipt but continue
            this.receiptSystem.emit({
                session_id: sessionId,
                actor: 'rob',
                action_type: 'preview.failed',
                outcome: 'error',
                evidence_refs: [],
                truth_state: 'Unknown',
                metadata: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
            });
        }
        // Transition to VERIFYING
        await this.transitionState(sessionId, 'VERIFYING', 'Build complete, verifying...');
        return { state: 'VERIFYING', preview: previewResult };
    }
    /**
     * FORBIDDEN: Update session without intelligence
     *
     * Title-only updates are BLOCKED by mechanical law
     */
    async updateSessionMetadata(sessionId, updates, intelligenceReceipts) {
        // Check if this is a title-only update (FORBIDDEN)
        if (updates.app_name && !updates.template_id && intelligenceReceipts.length === 0) {
            IntelligenceGuard_1.IntelligenceGuard.blockTitleOnlyUpdate(sessionId, 'updateSessionMetadata');
        }
        // GUARD: Require intelligence if making structural changes
        const requiresIntelligence = Object.keys(updates).length > 0;
        if (requiresIntelligence) {
            await IntelligenceGuard_1.IntelligenceGuard.guard({
                sessionId,
                operation: 'updateSessionMetadata',
                receipts: intelligenceReceipts,
            }, async () => {
                // Update allowed
                if (this.persistence) {
                    await this.persistence.updateSession(sessionId, updates);
                }
            });
        }
        else {
            // No-op update
            if (this.persistence) {
                await this.persistence.updateSession(sessionId, updates);
            }
        }
    }
    // ==========================================================================
    // HELPERS
    // ==========================================================================
    generateId() {
        return `rob_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    /**
     * Get receipt system (for external access)
     */
    getReceiptSystem() {
        return this.receiptSystem;
    }
}
exports.RobEngine = RobEngine;
//# sourceMappingURL=RobEngine.js.map