import { useState, useEffect, useRef } from 'react';
import { robClient, RobSession, RobMessage } from '../lib/rob-client';
import { Send, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function RobPage() {
  const [session, setSession] = useState<RobSession | null>(null);
  const [messages, setMessages] = useState<RobMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeSession();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await robClient.initSession();
      setSession(data.session);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !session || loading) return;

    const userMessage: RobMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const data = await robClient.sendMessage(session.id, input);
      
      setSession(data.session);

      const assistantMessage: RobMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (data.system_message) {
        const systemMessage: RobMessage = {
          role: 'system',
          content: data.system_message,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, systemMessage]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (error && !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">Error</h1>
          </div>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={initializeSession}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Rob the QuietBuilder</h1>
          <p className="text-sm text-gray-600">Constitutional AI Assistant</p>
        </div>
      </header>

      {/* Status Bar */}
      {session && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">State:</span>
                <span className="font-semibold text-blue-900">{session.state}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Progress:</span>
                <span className="font-semibold text-blue-900">{session.progress}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Readiness:</span>
                <span className="font-semibold text-blue-900">{session.readiness}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Consent:</span>
                {session.consent_granted ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-yellow-600" />
                )}
                <span
                  className={`font-semibold ${
                    session.consent_granted ? 'text-green-600' : 'text-yellow-600'
                  }`}
                >
                  {session.consent_granted ? 'Granted' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-100 ml-12'
                  : msg.role === 'system'
                  ? 'bg-yellow-50 border border-yellow-200'
                  : 'bg-white border border-gray-200 mr-12'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-600 uppercase">
                  {msg.role}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-gray-900 whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))}

          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-900 text-sm">{error}</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
            placeholder={
              session?.consent_granted
                ? 'Type your message...'
                : 'Type "I consent" to continue...'
            }
            disabled={loading || !session}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim() || !session}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
