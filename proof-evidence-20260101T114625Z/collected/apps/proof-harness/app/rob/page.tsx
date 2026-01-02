/**
 * Rob Builder - Main build interface
 * Left: Chat | Right: Preview + TruthSerum status
 */

'use client';

import { useState, useEffect } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { GuidedSetupPanel } from './components/GuidedSetupPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { TruthStatusPanel } from './components/TruthStatusPanel';
import { ReceiptsViewer } from './components/ReceiptsViewer';

export default function RobBuilderPage() {
  const [sessionId, setSessionId] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [truthState, setTruthState] = useState<any>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedPaletteId, setSelectedPaletteId] = useState<string | null>(null);

  useEffect(() => {
    createSession();

    const interval = setInterval(() => {
      if (sessionId) {
        fetchReceipts();
        evaluateTruth();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const promptOptions = [
    {
      id: 'sports',
      label: 'Pickup basketball in cities',
      message:
        'I want an app that helps people schedule pickup basketball games in major US cities.',
    },
    {
      id: 'booking',
      label: 'Book appointments',
      message: 'I want an app for booking appointments with local professionals.',
    },
    {
      id: 'community',
      label: 'Neighborhood community',
      message: 'I want a community app for neighbors to share updates and events.',
    },
  ];

  const templateOptions = [
    {
      id: 'saas-starter',
      name: 'SaaS Starter',
      description: 'Best for dashboards and subscriptions.',
    },
    {
      id: 'booking',
      name: 'Booking & Scheduling',
      description: 'Calendars, slots, and reservations.',
    },
    {
      id: 'marketplace',
      name: 'Marketplace',
      description: 'Listings, search, and checkout.',
    },
    {
      id: 'community',
      name: 'Community',
      description: 'Profiles, posts, and messages.',
    },
  ];

  const paletteOptions = [
    {
      id: 'ocean',
      name: 'Ocean',
      swatches: ['#0F172A', '#2563EB', '#38BDF8', '#F8FAFC'],
    },
    {
      id: 'sunset',
      name: 'Sunset',
      swatches: ['#7C2D12', '#EA580C', '#FDBA74', '#FFF7ED'],
    },
    {
      id: 'forest',
      name: 'Forest',
      swatches: ['#14532D', '#16A34A', '#4ADE80', '#F0FDF4'],
    },
  ];

  async function createSession() {
    try {
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'demo-user',
          templateId: 'saas-starter',
          appName: 'My App',
        }),
      });
      const data = await response.json();
      setSessionId(data.sessionId);

      await writeReceipt({
        sessionId: data.sessionId,
        type: 'identity.authenticated',
        details: { userId: 'demo-user', method: 'demo' },
      });

      await writeReceipt({
        sessionId: data.sessionId,
        type: 'billing.active',
        details: { plan: 'demo', status: 'active' },
      });

      await writeReceipt({
        sessionId: data.sessionId,
        type: 'billing.cap_not_exceeded',
        details: { usage: 0, limit: 100 },
      });

      setSelectedTemplateId('saas-starter');
      setSelectedPaletteId('ocean');
    } catch (error) {
      console.error('Session creation failed:', error);
    }
  }

  async function writeReceipt(receipt: any) {
    try {
      await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receipt),
      });
    } catch (error) {
      console.error('Receipt write failed:', error);
    }
  }

  async function fetchReceipts() {
    try {
      const response = await fetch(`/api/receipts?sessionId=${sessionId}`);
      const data = await response.json();
      setReceipts(data.receipts || []);
    } catch (error) {
      console.error('Receipt fetch failed:', error);
    }
  }

  async function evaluateTruth() {
    try {
      const response = await fetch('/api/truth/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intentId: 'session.ready',
          sessionId,
        }),
      });
      const data = await response.json();
      setTruthState(data.evaluation);
    } catch (error) {
      console.error('Truth evaluation failed:', error);
    }
  }

  async function sendMessage(content: string) {
    try {
      setMessages((prev) => [...prev, { role: 'user', content }]);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          sessionId,
          userId: 'demo-user',
        }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.message,
          state: data.state,
          missingProofs: data.missingProofs,
        },
      ]);

      fetchReceipts();
    } catch (error) {
      console.error('Chat failed:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Status unknown - connection failed',
          state: 'Unknown',
        },
      ]);
    }
  }

  async function handleTemplateSelect(templateId: string) {
    setSelectedTemplateId(templateId);
    if (!sessionId) return;
    await writeReceipt({
      sessionId,
      type: 'template.selected',
      details: { templateId },
    });
  }

  async function handlePaletteSelect(paletteId: string) {
    setSelectedPaletteId(paletteId);
    if (!sessionId) return;
    await writeReceipt({
      sessionId,
      type: 'palette.selected',
      details: { paletteId },
    });
  }

  async function handlePromptSend(message: string) {
    await sendMessage(message);
    if (!sessionId) return;
    await writeReceipt({
      sessionId,
      type: 'idea.captured',
      details: { message },
    });
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rob the QuietBuilder</h1>
            <p className="text-sm text-gray-600">
              Session: {sessionId ? sessionId.slice(0, 20) + '...' : 'Loading...'}
            </p>
          </div>
          {truthState && (
            <div
              className={`px-4 py-2 rounded-lg font-semibold ${
                truthState.state === 'Verified'
                  ? 'bg-green-100 text-green-800'
                  : truthState.state === 'Blocked'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {truthState.state}
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 border-r border-gray-200 flex flex-col">
          <GuidedSetupPanel
            prompts={promptOptions}
            templates={templateOptions}
            palettes={paletteOptions}
            selectedTemplateId={selectedTemplateId}
            selectedPaletteId={selectedPaletteId}
            onSelectTemplate={handleTemplateSelect}
            onSelectPalette={handlePaletteSelect}
            onSendPrompt={handlePromptSend}
          />
          <ChatPanel
            messages={messages}
            onSendMessage={sendMessage}
            disabled={!sessionId}
          />
        </div>

        <div className="w-1/2 flex flex-col">
          <PreviewPanel receipts={receipts} />
          <div className="border-t border-gray-200">
            <TruthStatusPanel truthState={truthState} />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white">
        <ReceiptsViewer receipts={receipts} />
      </div>
    </div>
  );
}
