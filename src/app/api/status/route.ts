import { NextResponse } from 'next/server';

export async function GET() {
  const provider = process.env.LLM_PROVIDER || 'ollama';
  const model = process.env.LLM_MODEL || (provider === 'ollama' ? 'qwen3' : 'gpt-4o');
  const baseUrl = provider === 'ollama'
    ? (process.env.LLM_BASE_URL || 'http://localhost:11434/v1')
    : 'https://api.openai.com/v1';

  let connected = false;
  let models: string[] = [];

  try {
    const res = await fetch(`${baseUrl}/models`, {
      headers: provider !== 'ollama' && process.env.OPENAI_API_KEY
        ? { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
        : {},
    });
    if (res.ok) {
      connected = true;
      const data = await res.json();
      models = (data.data || []).map((m: { id: string }) => m.id).slice(0, 10);
    }
  } catch {
    connected = false;
  }

  return NextResponse.json({
    provider,
    model,
    baseUrl,
    connected,
    availableModels: models,
  });
}
