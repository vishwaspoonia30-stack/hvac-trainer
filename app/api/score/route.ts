import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { SCORE_PROMPT } from '@/lib/rubric';
import { getPersona } from '@/lib/personas';
import { TranscriptEntry } from '@/lib/types';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { transcript, personaId } = await req.json() as {
      transcript: TranscriptEntry[];
      personaId: string;
    };

    const persona = getPersona(personaId);
    if (!persona) {
      return new Response(JSON.stringify({ error: 'Unknown persona' }), { status: 400 });
    }

    const transcriptText = transcript
      .map((entry) => `${entry.role === 'user' ? 'REP' : 'HOMEOWNER'}: ${entry.text}`)
      .join('\n');

    const prompt = SCORE_PROMPT(transcriptText, persona.name, persona.difficulty);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse JSON from response
    let scoreData;
    try {
      // Strip any markdown fences if present
      const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      scoreData = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse score JSON:', rawText);
      return new Response(JSON.stringify({ error: 'Failed to parse score' }), { status: 500 });
    }

    return new Response(JSON.stringify(scoreData), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Score API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
