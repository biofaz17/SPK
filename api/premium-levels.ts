import type { ApiRequest, ApiResponse } from './_lib/http';
import { SubscriptionTier } from '../types';
import { ALGORITHM_WORKSHOP_LEVELS } from './_lib/levels/algorithmWorkshopLevels';
import { FINAL_PROJECT_LEVELS } from './_lib/levels/finalProjectLevels';
import { PRO_LEGACY_LEVELS } from './_lib/levels/proLegacyLevels';
import { SPARKY_OBSERVATORY_LEVELS } from './_lib/levels/sparkyObservatoryLevels';
import { getAuthenticatedProfile, type ProfileSessionEnvironment } from './_lib/profileSession';

const puzzleLevels = new Map(
  [...PRO_LEGACY_LEVELS, ...ALGORITHM_WORKSHOP_LEVELS, ...SPARKY_OBSERVATORY_LEVELS].map(level => [level.id, level]),
);
const finalProjectLevels = new Map(FINAL_PROJECT_LEVELS.map(level => [level.id, level]));

export default async function handler(
  req: ApiRequest,
  res: ApiResponse,
  env?: ProfileSessionEnvironment,
) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const id = req.query.id;
  if (typeof id !== 'string' || !/^[1-9][0-9]?$/.test(id)) return res.status(400).json({ error: 'Invalid level' });

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env ?? process.env;
  const profile = await getAuthenticatedProfile(req.headers.authorization, { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY });
  if ('error' in profile) return res.status(profile.status).json({ error: profile.error });
  if (profile.subscription !== SubscriptionTier.PRO) {
    return res.status(403).json({ error: 'Level access requires a Pro subscription' });
  }

  const puzzle = puzzleLevels.get(Number(id));
  if (puzzle) return res.status(200).json({ kind: 'puzzle', level: puzzle });
  const project = finalProjectLevels.get(Number(id));
  if (project) return res.status(200).json({ kind: 'final-project', level: project });
  return res.status(404).json({ error: 'Level not found' });
}
