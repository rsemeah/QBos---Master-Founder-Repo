'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface SessionStatus {
  state: string;
  progress: number;
  readiness: string;
}

export default function RobBuildPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<SessionStatus>({
    state: 'INIT',
    progress: 0,
    readiness: 'draft',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize session on mount
  useEffect(() => {
    initSession();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function initSession() {
    try {
      const res = await fetch('/api/rob/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: 'saas-starter' }),
      });

      const data = await res.json();
      if (data.ok) {
        setSessionId(data.session.id);
        setStatus({
          state: data.session.state,
          progress: data.session.progress,
          readiness: data.session.readiness,
        });

        setMessages([
          {
            role: 'assistant',
            content:
              "Hey! I'm Rob. I'll help you build your app. What would you like to create today?",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to init session:', error);
    }
  }

  async function sendMessage() {
    if (!input.trim() || !sessionId || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/rob/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: input,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        if (data.metadata?.session) {
          setStatus({
            state: data.metadata.session.state,
            progress: data.metadata.session.progress,
            readiness: data.metadata.session.readiness,
          });
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'system',
            content: `Error: ${data.error}`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: 'Failed to send message. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function getReadinessBadgeColor(tier: string) {
    switch (tier) {
      case 'published':
        return '#10b981';
      case 'ready':
        return '#3b82f6';
      case 'viable':
        return '#8b5cf6';
      case 'shaped':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  }

  function getStateBadgeColor(state: string) {
    if (state === 'BLOCKED') return '#ef4444';
    if (state === 'UNKNOWN') return '#f59e0b';
    if (state === 'VIEW_ONLY') return '#8b5cf6';
    if (state === 'PUBLISHED') return '#10b981';
    return '#3b82f6';
  }

  return (
    <main style={{ height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui' }}>
      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid #e5e7eb',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <Link href="/" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            ← Dashboard
          </Link>
          <h1 style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem' }}>Rob the QuietBuilder</h1>
        </div>

        {/* Status Bar */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>State: </span>
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 'bold',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: getStateBadgeColor(status.state),
                color: 'white',
              }}
            >
              {status.state}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Progress: </span>
            <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>{status.progress}%</span>
          </div>

          <div>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Readiness: </span>
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 'bold',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: getReadinessBadgeColor(status.readiness),
                color: 'white',
                textTransform: 'capitalize',
              }}
            >
              {status.readiness}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2rem',
          backgroundColor: '#f9fafb',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundColor: msg.role === 'user' ? '#3b82f6' : msg.role === 'system' ? '#ef4444' : 'white',
                  color: msg.role === 'user' || msg.role === 'system' ? 'white' : '#1f2937',
                  border: msg.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
                }}
              >
                {msg.role === 'assistant' && (
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>Rob</div>
                )}
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ textAlign: 'center', color: '#6b7280' }}>
              <span>Rob is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div
        style={{
          borderTop: '1px solid #e5e7eb',
          padding: '1rem 2rem',
          backgroundColor: 'white',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Tell Rob what you want to build..."
            disabled={!sessionId || loading}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!sessionId || loading || !input.trim()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: !sessionId || loading || !input.trim() ? '#d1d5db' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: !sessionId || loading || !input.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
