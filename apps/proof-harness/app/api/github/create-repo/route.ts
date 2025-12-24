/**
 * GitHub Integration for Rob
 * 
 * POST /api/github/create-repo
 * 
 * Creates a GitHub repository with generated code
 * 
 * Constitutional guarantees:
 * - Auth required (NextAuth session)
 * - Receipt generation
 * - Error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Octokit } from '@octokit/rest';
import { authOptions } from '../../../../lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: 'GitHub authentication required. Sign in first.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { session_id, repo_name, description, files } = body;

    if (!session_id || !repo_name || !files) {
      return NextResponse.json(
        { error: 'session_id, repo_name, and files required' },
        { status: 400 }
      );
    }

    // Initialize Octokit with user's access token
    const octokit = new Octokit({
      auth: session.accessToken,
    });

    // Get authenticated user
    const { data: user } = await octokit.users.getAuthenticated();

    // Create repository
    const { data: repo } = await octokit.repos.createForAuthenticatedUser({
      name: repo_name,
      description: description || 'Created by Rob the QuietBuilder',
      private: false,
      auto_init: true,
    });

    // Upload files
    for (const file of files) {
      await octokit.repos.createOrUpdateFileContents({
        owner: user.login,
        repo: repo_name,
        path: file.path,
        message: `Add ${file.path}`,
        content: Buffer.from(file.content).toString('base64'),
      });
    }

    // Update session with repo URL
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from('rob_sessions')
        .update({
          app_config: {
            github_repo_url: repo.html_url,
            github_clone_url: repo.clone_url,
          },
        })
        .eq('id', session_id);

      // Emit receipt
      await supabase.from('rob_receipts').insert({
        session_id,
        type: 'github.repo_created',
        details: {
          repo_url: repo.html_url,
          repo_name,
          owner: user.login,
          files_count: files.length,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      repo: {
        name: repo.name,
        url: repo.html_url,
        clone_url: repo.clone_url,
        owner: user.login,
      },
    });
  } catch (error: any) {
    console.error('GitHub repo creation failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create repository',
        details: error.message,
        hint: 'Make sure you have granted repo permissions to the OAuth app'
      },
      { status: 500 }
    );
  }
}
