import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { getPersona } from '@/lib/personas';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT_BASE = `You are roleplaying as an Ontario homeowner during an in-home energy assessment visit from a NestZero representative.

YOUR SETUP (fixed):
- Detached home in Orangeville, ON, built ~1995
- Honeywell classic thermostat (non-smart)
- Natural gas furnace, white PVC venting
- 40-gallon rented water heater from Reliance, ~$45/month
- Average gas bill: $180/mo winter, $60/mo summer
- Average hydro bill: $140/mo

YOUR PERSONALITY:
[PERSONALITY]

RULES:
1. You are NOT a salesperson. Do not help the rep pitch — let them work for it.
2. Do not volunteer information. Answer only what is asked.
3. If the rep seems to pause or hesitate, stay quiet. Do not fill silence.
4. Speak like a real person — short sentences, occasional "um" or "I guess".
5. Throw objections appropriate to your personality — not robotic, not repetitive.
6. If the rep does NOT ask for your driver's license by the end, do not offer it.
7. NEVER break character. Never explain or acknowledge you are an AI.
8. Keep replies to 1-3 sentences unless asked a direct open question that requires more.
9. React naturally to what the rep says. If they make a good point, acknowledge it. If they're pushy, push back.
10. This is a training simulation — be realistic, not easy. Make the rep earn every step.`;

export async function POST(req: NextRequest) {
  try {
    const { personaId, messages } = await req.json();

    const persona = getPersona(personaId);
    if (!persona) {
      return new Response(JSON.stringify({ error: 'Unknown persona' }), { status: 400 });
    }

    const systemPrompt = SYSTEM_PROMPT_BASE.replace('[PERSONALITY]', persona.personality);

    const stream = await client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: systemPrompt,
      messages: messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
