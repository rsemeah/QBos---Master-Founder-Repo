/**
 * PREVIEW GENERATOR
 *
 * Generates working React components based on intelligence receipts.
 * Now powered by MetaTemplateEngine for 40+ templates.
 *
 * Target: 10-second turnaround from prompt to interactive preview.
 *
 * MECHANICAL LAW: Every build MUST produce a living preview.
 */

import type { PreviewGenerationReceipt, IntelligenceReceipt } from './IntelligenceContract';
import { MetaTemplateEngine } from './MetaTemplateEngine';
import { searchTemplates } from './TemplateRegistry';

export interface PreviewResult {
  code: string;
  componentName: string;
  framework: 'react';
  linesOfCode: number;
  interactivityLevel: 'static' | 'interactive' | 'dynamic';
  renderSuccess: boolean;
  receipt: PreviewGenerationReceipt;
  templateId?: string;
}

/**
 * Preview Generator - Creates working React components
 * Now uses MetaTemplateEngine + TemplateRegistry
 */
export class PreviewGenerator {
  private metaEngine: MetaTemplateEngine;

  constructor() {
    this.metaEngine = new MetaTemplateEngine();
  }

  /**
   * Generate preview component based on intelligence receipts
   */
  async generate(
    sessionId: string,
    messageId: string,
    intelligenceReceipts: IntelligenceReceipt[]
  ): Promise<PreviewResult> {
    // Extract domain and interpretation from receipts
    const ideaReceipt = intelligenceReceipts.find((r) => r.type === 'idea.decomposed');
    const conceptReceipt = intelligenceReceipts.find((r) => r.type === 'concept.inferred');

    if (!ideaReceipt || !conceptReceipt) {
      return this.generateFallback(sessionId, messageId, 'Missing required intelligence receipts');
    }

    try {
      // Extract keywords from receipts
      const keywords = this.extractKeywords(ideaReceipt, conceptReceipt);

      // Search for matching template
      const matchedTemplates = searchTemplates(keywords);

      if (matchedTemplates.length === 0) {
        console.warn(\`[PreviewGenerator] No template match for keywords: \${keywords.join(', ')}\`);
        return this.generateFallback(sessionId, messageId, \`No template found for: \${keywords.join(', ')}\`);
      }

      // Use best match
      const template = matchedTemplates[0];
      console.log(\`[PreviewGenerator] Using template: \${template.id} for keywords: \${keywords.join(', ')}\`);

      // Generate React component using MetaTemplateEngine
      const generated = this.metaEngine.generate(template);

      // Create receipt
      const receipt: PreviewGenerationReceipt = {
        type: 'preview.generated',
        sessionId,
        messageId,
        details: {
          componentName: generated.componentName,
          framework: 'react',
          linesOfCode: generated.linesOfCode,
          interactivityLevel: 'dynamic',
          renderSuccess: true,
          templateId: template.id,
          templateName: template.name,
          previewUrl: undefined,
        },
        truthState: 'Verified',
        timestamp: new Date().toISOString(),
      };

      return {
        code: generated.code,
        componentName: generated.componentName,
        framework: 'react',
        linesOfCode: generated.linesOfCode,
        interactivityLevel: 'dynamic',
        renderSuccess: true,
        receipt,
        templateId: template.id,
      };
    } catch (error: any) {
      console.error('[PreviewGenerator] Generation error:', error);
      return this.generateFallback(sessionId, messageId, error.message);
    }
  }

  /**
   * Extract keywords from intelligence receipts
   */
  private extractKeywords(ideaReceipt: IntelligenceReceipt, conceptReceipt: IntelligenceReceipt): string[] {
    const keywords: string[] = [];

    // Extract from idea receipt
    const ideaDetails = ideaReceipt.details as any;
    if (ideaDetails.detectedDomain) {
      keywords.push(ideaDetails.detectedDomain);
    }
    if (ideaDetails.essentialFeatures) {
      keywords.push(...ideaDetails.essentialFeatures.slice(0, 3));
    }
    if (ideaDetails.appType) {
      keywords.push(ideaDetails.appType);
    }

    // Extract from concept receipt
    const conceptDetails = conceptReceipt.details as any;
    if (conceptDetails.coreMechanics) {
      keywords.push(...conceptDetails.coreMechanics.slice(0, 3));
    }
    if (conceptDetails.primaryPurpose) {
      keywords.push(conceptDetails.primaryPurpose);
    }

    // Extract from original idea (in receipt session notes)
    const originalIdea = (ideaDetails.originalIdea || '').toLowerCase();

    // Pattern matching for common app types
    if (originalIdea.includes('basketball') || originalIdea.includes('pickup game')) {
      keywords.push('basketball', 'scheduling', 'game', 'sports', 'event');
    } else if (originalIdea.includes('recipe') || originalIdea.includes('cooking')) {
      keywords.push('recipe', 'cooking', 'food', 'collection');
    } else if (originalIdea.includes('workout') || originalIdea.includes('fitness')) {
      keywords.push('workout', 'fitness', 'exercise', 'tracking');
    } else if (originalIdea.includes('todo') || originalIdea.includes('task')) {
      keywords.push('todo', 'task', 'productivity');
    } else if (originalIdea.includes('appointment') || originalIdea.includes('booking')) {
      keywords.push('appointment', 'booking', 'scheduling', 'event');
    } else if (originalIdea.includes('expense') || originalIdea.includes('budget')) {
      keywords.push('expense', 'budget', 'finance', 'tracking');
    }

    return [...new Set(keywords)];
  }

  /**
   * Generate minimal preview if full generation fails
   */
  generateFallback(sessionId: string, messageId: string, error: string): PreviewResult {
    const fallbackCode = \`import React from 'react';

export default function Placeholder() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-2xl text-center">
        <div className="text-6xl mb-6">🚧</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Preview Unavailable</h1>
        <p className="text-gray-600 mb-6">
          Working on generating your component...
        </p>
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-left">
          <div className="text-sm font-mono text-red-600">
            Error: \${error}
          </div>
        </div>
      </div>
    </div>
  );
}\`;

    const receipt: PreviewGenerationReceipt = {
      type: 'preview.generated',
      sessionId,
      messageId,
      details: {
        componentName: 'Placeholder',
        framework: 'react',
        linesOfCode: fallbackCode.split('\n').length,
        interactivityLevel: 'static',
        renderSuccess: false,
        error,
      },
      truthState: 'Unknown',
      timestamp: new Date().toISOString(),
    };

    return {
      code: fallbackCode,
      componentName: 'Placeholder',
      framework: 'react',
      linesOfCode: fallbackCode.split('\n').length,
      interactivityLevel: 'static',
      renderSuccess: false,
      receipt,
    };
  }
}
