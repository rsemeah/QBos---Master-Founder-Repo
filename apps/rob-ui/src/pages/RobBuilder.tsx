import { CheckCircle, Loader2, Send, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { robClient, RobMessage, RobSession } from '../lib/rob-client';

export default function RobBuilder() {
  const [session, setSession] = useState<RobSession | null>(null);
  const [messages, setMessages] = useState<RobMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState('minimal-vertical-slice');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await robClient.initSession(template);
      setSession(data.session);
      setMessages(data.messages || []);
      await robClient.writeReceipt({
        sessionId: data.session.id,
        type: 'session.created',
        details: { template },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !session || loading) return;
    const userMsg: RobMessage = { role: 'user', content: input, timestamp: new Date().toISOString() };
    setMessages((p) => [...p, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const data = await robClient.sendMessage(session.id, input);
      setSession(data.session);
      const assistant: RobMessage = { role: 'assistant', content: data.response, timestamp: new Date().toISOString() };
      setMessages((p) => [...p, assistant]);

      // receipts
      await robClient.writeReceipt({ sessionId: session.id, type: 'chat.message', details: { role: 'user', content: userMsg.content } });
      await robClient.writeReceipt({ sessionId: session.id, type: 'chat.response', details: { role: 'assistant', content: data.response } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Rob Builder</h1>
          <p className="text-sm text-gray-600">Create a session and interact with Rob</p>
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto w-full">
        <div className="mb-4 flex items-center gap-4">
          <label className="text-sm text-gray-700">Template</label>
          <select value={template} onChange={(e) => setTemplate(e.target.value)} className="px-3 py-2 border rounded">
            <option value="minimal-vertical-slice">minimal-vertical-slice</option>
            <option value="feature-rich-starter">feature-rich-starter</option>
            <option value="bugfix-assistant">bugfix-assistant</option>
          </select>
          <button onClick={startSession} disabled={loading} className="ml-auto px-4 py-2 bg-blue-600 text-white rounded">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start Session'}
          </button>
        </div>

        <div className="bg-white border rounded p-4 mb-4">
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`p-3 rounded ${m.role === 'user' ? 'bg-blue-50 ml-12' : m.role === 'system' ? 'bg-yellow-50' : 'bg-gray-50 mr-12'}`}>
                <div className="text-xs text-gray-500 mb-1">{m.role} • {new Date(m.timestamp).toLocaleTimeString()}</div>
                <div className="text-gray-900 whitespace-pre-wrap">{m.content}</div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} className="flex-1 px-4 py-2 border rounded" placeholder={session ? 'Message Rob...' : 'Start a session first'} disabled={!session} />
          <button onClick={handleSend} disabled={!session || !input.trim() || loading} className="px-4 py-2 bg-blue-600 text-white rounded">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded p-3 text-red-900">{error}</div>
        )}
      </div>
    </div>
  );
}
