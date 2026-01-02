/**
 * BuildSessionManager - Manages build sessions with Supabase
 * Used by API routes to create and manage build sessions
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class BuildSession {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Create a new build session
   */
  async create(userId: string, ideaDescription: string) {
    const { data, error } = await this.supabase
      .from('build_sessions')
      .insert({
        user_id: userId,
        idea_description: ideaDescription,
        current_state: 'IDEA_CAPTURE',
        readiness_tier: 'DRAFT'
      })
      .select()
      .single();

    if (error) throw error;

    // Emit idea.captured receipt
    await this.supabase
      .from('build_receipts')
      .insert({
        session_id: data.id,
        type: 'idea.captured',
        details: {
          ideaDescription,
          capturedAt: new Date().toISOString()
        }
      });

    return data;
  }

  /**
   * Match a template based on the idea description
   */
  async matchTemplate(sessionId: string) {
    // Get session
    const { data: session, error: sessionError } = await this.supabase
      .from('build_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;

    // Get all active templates
    const { data: templates, error: templatesError } = await this.supabase
      .from('templates')
      .select('*')
      .eq('is_active', true);

    if (templatesError) throw templatesError;

    // Simple keyword matching
    const ideaLower = session.idea_description.toLowerCase();
    const matches = templates.filter(template =>
      template.keywords.some((keyword: string) =>
        ideaLower.includes(keyword.toLowerCase())
      )
    );

    // Pick first match (or default to auth-starter)
    const matchedTemplate = matches[0] || templates.find(t => t.id === 'auth-starter');

    if (!matchedTemplate) {
      throw new Error('No templates available');
    }

    // Update session with matched template
    await this.supabase
      .from('build_sessions')
      .update({
        template_id: matchedTemplate.id,
        current_state: 'TEMPLATE_MATCH'
      })
      .eq('id', sessionId);

    // Emit template.matched receipt
    await this.supabase
      .from('build_receipts')
      .insert({
        session_id: sessionId,
        type: 'template.matched',
        details: {
          templateId: matchedTemplate.id,
          templateName: matchedTemplate.name,
          confidence: matches.length > 0 ? 'high' : 'default'
        }
      });

    return {
      template: matchedTemplate,
      confidence: matches.length > 0 ? 'high' : 'default'
    };
  }
}
