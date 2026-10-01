import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const requests = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 20;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const address = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const current = requests.get(address);
  if (current && current.resetAt > now && current.count >= MAX_REQUESTS) return res.status(429).json({ error: 'Too many requests' });
  requests.set(address, current && current.resetAt > now
    ? { count: current.count + 1, resetAt: current.resetAt }
    : { count: 1, resetAt: now + WINDOW_MS });

  const prompt = req.body?.prompt;
  const apiKey = process.env.GEMINI_API_KEY;
  if (typeof prompt !== 'string' || prompt.length < 1 || prompt.length > 4000) return res.status(400).json({ error: 'Invalid prompt' });
  if (!apiKey) return res.status(503).json({ error: 'AI service is not configured' });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return res.status(200).json({ text: result.text || '' });
  } catch {
    return res.status(502).json({ error: 'Unable to generate response' });
  }
}