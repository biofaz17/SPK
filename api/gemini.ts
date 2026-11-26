import type { ApiRequest, ApiResponse } from './_lib/http';
import { GoogleGenAI } from '@google/genai';
import { BLOCK_DEFINITIONS, type BlockType } from '../types';
import { getAuthenticatedProfile, type ProfileSessionEnvironment } from './_lib/profileSession';
import { consumeRateLimit } from './_lib/serverSecurity';

export interface GeminiEnvironment extends ProfileSessionEnvironment {
  GEMINI_API_KEY?: string;
}

function isGridValue(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100;
}

function buildPrompt(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return;
  const fields = body as Record<string, unknown>;
  if (fields.task === 'explain-logic') {
    const { blocks } = fields;
    if (!Array.isArray(blocks) || blocks.length === 0 || blocks.length > 80
      || !blocks.every(block => typeof block === 'string' && Object.hasOwn(BLOCK_DEFINITIONS, block))) return;
    const labels = blocks.map(block => BLOCK_DEFINITIONS[block as BlockType].label).join(', ');
    return `Você é o Sparky, robô tutor. Explique a sequência de blocos [${labels}] de forma lúdica e encorajadora para uma criança de 7 anos. Use emojis e no máximo dois parágrafos.`;
  }

  if (fields.task === 'create-mission') {
    const { startX, startY, goalX, goalY, obstacleCount } = fields;
    if (![startX, startY, goalX, goalY, obstacleCount].every(isGridValue)) return;
    return `Crie uma missão lúdica para uma criança de 7 anos. Um robô parte de (${startX}, ${startY}) com destino a (${goalX}, ${goalY}), com ${obstacleCount} obstáculos. Invente um contexto divertido. Use emojis e no máximo duas frases.`;
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse, env?: GeminiEnvironment) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const prompt = buildPrompt(req.body);
  if (!prompt) return res.status(400).json({ error: 'Invalid activity data' });

  const config = env ?? process.env;
  const profile = await getAuthenticatedProfile(req.headers.authorization, config);
  if ('status' in profile) return res.status(profile.status).json({ error: profile.error });
  const apiKey = config.GEMINI_API_KEY?.trim();
  if (!apiKey) return res.status(503).json({ error: 'AI service is not configured' });

  try {
    const quota = await consumeRateLimit(config, 'gemini-profile', profile.id, 20, 60);
    if (!quota.allowed) {
      res.setHeader('Retry-After', String(quota.retryAfter));
      return res.status(429).json({ error: 'Too many requests' });
    }
  } catch {
    return res.status(503).json({ error: 'AI service temporarily unavailable' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt, config: { maxOutputTokens: 512 } });
    return res.status(200).json({ text: result.text || '' });
  } catch {
    return res.status(502).json({ error: 'Unable to generate response' });
  }
}
