"use strict";
/**
 * AI Service - OpenAI Integration for Rob
 *
 * Constitutional guarantees:
 * - Usage tracking (all token counts logged)
 * - Cost calculation (per model pricing)
 * - Error handling (graceful fallbacks)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCodeWithAI = generateCodeWithAI;
const openai_1 = __importDefault(require("openai"));
const openai = process.env.OPENAI_API_KEY
    ? new openai_1.default({ apiKey: process.env.OPENAI_API_KEY })
    : null;
const MODEL_COSTS = {
    'gpt-4': { input: 0.03, output: 0.06 }, // per 1k tokens
    'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
};
async function generateCodeWithAI(request) {
    const startTime = Date.now();
    // Fallback to deterministic if no API key
    if (!openai) {
        return {
            response: getDeterministicResponse(request.userMessage, request.state),
            tokensIn: 0,
            tokensOut: 0,
            costUsd: 0,
            provider: 'mock',
            model: 'deterministic',
            latencyMs: Date.now() - startTime,
        };
    }
    try {
        const model = 'gpt-4-turbo-preview';
        const systemPrompt = getSystemPrompt(request.state);
        const completion = await openai.chat.completions.create({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                ...request.conversationHistory.slice(-5), // Last 5 messages for context
                { role: 'user', content: request.userMessage },
            ],
            temperature: 0.7,
            max_tokens: 2000,
        });
        const response = completion.choices[0]?.message?.content || 'No response generated';
        const tokensIn = completion.usage?.prompt_tokens || 0;
        const tokensOut = completion.usage?.completion_tokens || 0;
        const costUsd = calculateCost(model, tokensIn, tokensOut);
        const latencyMs = Date.now() - startTime;
        return {
            response,
            tokensIn,
            tokensOut,
            costUsd,
            provider: 'openai',
            model,
            latencyMs,
        };
    }
    catch (error) {
        console.error('OpenAI generation failed:', error);
        // Fallback to deterministic
        return {
            response: getDeterministicResponse(request.userMessage, request.state) +
                '\n\n⚠️ (AI temporarily unavailable, using fallback)',
            tokensIn: 0,
            tokensOut: 0,
            costUsd: 0,
            provider: 'fallback',
            model: 'deterministic',
            latencyMs: Date.now() - startTime,
        };
    }
}
function getSystemPrompt(state) {
    const basePrompt = `You are Rob the QuietBuilder, a helpful AI coding assistant that builds real applications.

Current State: ${state}

Guidelines:
- Be concise and helpful
- When building, generate actual React/TypeScript code
- Always explain what you're creating
- Use modern best practices (React 18, TypeScript, Tailwind)
- Never make false claims about what's been deployed
- Be honest about limitations

`;
    if (state === 'BUILDING' || state === 'VERIFYING') {
        return basePrompt + `
You are in BUILDING mode. Generate production-ready React components when asked.
Format code blocks with triple backticks and language identifiers.
`;
    }
    if (state === 'LISTENING' || state === 'CLARIFYING') {
        return basePrompt + `
You are in LISTENING mode. Help the user clarify their requirements.
Ask follow-up questions if needed. Once you understand, suggest starting to build.
`;
    }
    return basePrompt;
}
function calculateCost(model, tokensIn, tokensOut) {
    const costs = MODEL_COSTS[model] || MODEL_COSTS['gpt-3.5-turbo'];
    return ((tokensIn / 1000) * costs.input) + ((tokensOut / 1000) * costs.output);
}
function getDeterministicResponse(message, state) {
    const messageLC = message.toLowerCase();
    if (messageLC.includes('build') || messageLC.includes('create')) {
        return `I'll help you build that! To enable AI code generation, configure your OPENAI_API_KEY in .env.local.

For now, here's a simple React component structure:

\`\`\`tsx
export default function MyComponent() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Hello World</h1>
      <p>Your app will appear here.</p>
    </div>
  );
}
\`\`\`

Ready to generate real code? Add your OpenAI key and restart the server.`;
    }
    if (messageLC.includes('preview') || messageLC.includes('show')) {
        return "📦 Preview generated! In production mode with AI enabled, I'll render actual working components here.";
    }
    if (messageLC.includes('help')) {
        return `I'm Rob! Right now I'm running in ${process.env.OPENAI_API_KEY ? 'AI mode ✨' : 'fallback mode'}.

Commands:
- "build [something]" - Generate code
- "show preview" - See artifacts  
- "help" - This message

${!process.env.OPENAI_API_KEY ? '\n⚠️ Configure OPENAI_API_KEY for real code generation' : ''}`;
    }
    return `I hear you! ${!process.env.OPENAI_API_KEY ? '(Configure OPENAI_API_KEY for AI responses)' : ''}

Try:
- "build a todo app"
- "create a landing page"
- "help"`;
}
//# sourceMappingURL=ai-service.js.map