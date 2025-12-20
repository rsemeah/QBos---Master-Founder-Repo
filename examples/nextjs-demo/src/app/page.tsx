'use client';

import { useState } from 'react';

export default function Home() {
  const [aiInput, setAiInput] = useState('');
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [tier, setTier] = useState<'A' | 'B' | 'C'>('A');
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validationLoading, setValidationLoading] = useState(false);

  const handleAiGenerate = async () => {
    setAiLoading(true);
    setAiResponse(null);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: aiInput }],
          maxCost: 0.001,
          maxLatency: 5000,
          preferredCapabilities: ['low_cost', 'fast_latency'],
        }),
      });

      const data = await res.json();
      setAiResponse(data.data);
    } catch (error) {
      console.error('Error:', error);
      setAiResponse({ error: 'Failed to generate response' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleValidation = async () => {
    setValidationLoading(true);
    setValidationResult(null);

    try {
      const res = await fetch('/api/sight/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetSpec: {
            resolutionWidth: 3840,
            resolutionHeight: 2160,
            cameraModel: 'ARRI Alexa 65',
            lensType: 'Prime 65mm',
            aperture: 2.8,
            colorSpace: 'ACEScg',
            bitDepth: 16,
            lightingStyle: 'Cinematic three-point',
            hasAIArtifacts: false,
            hasFlatLighting: false,
            hasOversaturation: false,
            hasUpscaleArtifacts: false,
          },
          assetType: 'hero-image',
          tier: tier,
        }),
      });

      const data = await res.json();
      setValidationResult(data.data);
    } catch (error) {
      console.error('Error:', error);
      setValidationResult({ error: 'Failed to validate asset' });
    } finally {
      setValidationLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            QuietBuild OS™
          </h1>
          <p className="text-xl text-gray-400">
            Precision Infrastructure for Trust-Based Products
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <span className="px-3 py-1 bg-blue-900/30 border border-blue-500/30 rounded-full text-sm">
              👁️ SightEngine™
            </span>
            <span className="px-3 py-1 bg-purple-900/30 border border-purple-500/30 rounded-full text-sm">
              🧠 SilentEngine™
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* SilentEngine Demo */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              🧠 SilentEngine™
              <span className="text-sm font-normal text-gray-400">AI Routing</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Ask anything
                </label>
                <textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Explain quantum computing..."
                  className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                  rows={4}
                />
              </div>

              <button
                onClick={handleAiGenerate}
                disabled={aiLoading || !aiInput.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed py-3 px-4 rounded-lg font-medium transition-colors"
              >
                {aiLoading ? 'Generating...' : 'Generate Response'}
              </button>

              {aiResponse && (
                <div className="mt-4 p-4 bg-gray-900 border border-gray-700 rounded-lg">
                  {aiResponse.error ? (
                    <p className="text-red-400">{aiResponse.error}</p>
                  ) : (
                    <>
                      <p className="text-sm text-gray-400 mb-2">
                        <strong>Provider:</strong> {aiResponse.provider} |{' '}
                        <strong>Model:</strong> {aiResponse.model}
                      </p>
                      <p className="text-sm text-gray-400 mb-2">
                        <strong>Cost:</strong> ${aiResponse.cost?.toFixed(6)} |{' '}
                        <strong>Latency:</strong> {aiResponse.latency}ms
                      </p>
                      <div className="pt-2 border-t border-gray-700">
                        <p className="text-white whitespace-pre-wrap">
                          {aiResponse.text}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SightEngine Demo */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              👁️ SightEngine™
              <span className="text-sm font-normal text-gray-400">Visual Quality</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Quality Tier
                </label>
                <div className="flex gap-2">
                  {(['A', 'B', 'C'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTier(t)}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        tier === t
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      Tier {t}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {tier === 'A' && 'Investor-grade (4K+, Cinema cameras)'}
                  {tier === 'B' && 'Product-grade (1080p+, Professional)'}
                  {tier === 'C' && 'Internal-grade (720p+, Standard)'}
                </p>
              </div>

              <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg text-sm">
                <p className="text-gray-400 mb-2">Sample Asset Specs:</p>
                <ul className="text-xs space-y-1">
                  <li>• 4K Resolution (3840×2160)</li>
                  <li>• ARRI Alexa 65</li>
                  <li>• Prime 65mm lens @ f/2.8</li>
                  <li>• ACEScg color space, 16-bit</li>
                  <li>• Cinematic three-point lighting</li>
                </ul>
              </div>

              <button
                onClick={handleValidation}
                disabled={validationLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed py-3 px-4 rounded-lg font-medium transition-colors"
              >
                {validationLoading ? 'Validating...' : 'Validate Asset'}
              </button>

              {validationResult && (
                <div className="mt-4 p-4 bg-gray-900 border border-gray-700 rounded-lg">
                  {validationResult.error ? (
                    <p className="text-red-400">{validationResult.error}</p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`text-lg font-semibold ${
                            validationResult.passed
                              ? 'text-green-400'
                              : 'text-red-400'
                          }`}
                        >
                          {validationResult.passed ? '✅ PASSED' : '❌ FAILED'}
                        </span>
                        <span className="text-2xl font-bold">
                          {validationResult.score}/100
                        </span>
                      </div>

                      {validationResult.issues &&
                        validationResult.issues.length > 0 && (
                          <div className="pt-3 border-t border-gray-700">
                            <p className="text-sm font-medium mb-2 text-gray-400">
                              Issues:
                            </p>
                            <ul className="text-sm space-y-1">
                              {validationResult.issues.map((issue: string, i: number) => (
                                <li key={i} className="text-yellow-400">
                                  • {issue}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">SilentEngine™</h3>
            <p className="text-sm text-gray-400">
              Intelligent AI routing with capability matching, cost optimization,
              circuit breakers, and complete observability.
            </p>
          </div>

          <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">SightEngine™</h3>
            <p className="text-sm text-gray-400">
              Visual quality enforcement across tier requirements with cinema-grade
              standards and AI artifact detection.
            </p>
          </div>

          <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Built for Trust</h3>
            <p className="text-sm text-gray-400">
              World-class infrastructure that makes your product inevitable, not
              average.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
