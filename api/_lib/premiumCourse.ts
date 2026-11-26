import { SubscriptionTier } from '../../types';
import { getAuthenticatedProfile, type ProfileSessionEnvironment } from './profileSession';

const courses = new Map([
  ['curso-1-scratch-ninja', { tier: SubscriptionTier.STARTER, name: 'guia_completo_aulas_tecnologia_2025', prefix: 'guia_page-', pages: 4, digits: 1 }],
  ['curso-2-python-pro-mode', { tier: SubscriptionTier.PRO, name: 'trilha_tecnologia_computacao_2025', prefix: 'trilha_page-', pages: 41, digits: 2 }],
]);

const privateHeaders = {
  'Cache-Control': 'private, no-store',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Content-Type-Options': 'nosniff',
};

function fail(error: string, status: number) {
  return Response.json({ error }, { status, headers: privateHeaders });
}

export async function servePremiumCourse(
  request: Request,
  env: ProfileSessionEnvironment,
  loadAsset: (key: string) => Promise<BodyInit | null>,
): Promise<Response> {
  if (request.method !== 'GET') return fail('Method not allowed', 405);

  const params = new URL(request.url).searchParams;
  const course = courses.get(params.get('course') ?? '');
  const asset = params.get('asset') ?? '';
  const isPdf = asset === 'pdf';
  const page = /^[1-9][0-9]?$/.test(asset) ? Number(asset) : 0;
  if (!course || (!isPdf && (page < 2 || page > course.pages))) return fail('Course asset not found', 404);

  try {
    const profile = await getAuthenticatedProfile(request.headers.get('authorization') ?? undefined, env);
    if ('error' in profile) return fail(profile.error, profile.status);
    if (profile.subscription !== SubscriptionTier.PRO && profile.subscription !== course.tier) {
      return fail('Course access requires an eligible subscription', 403);
    }

    const filename = isPdf ? `${course.name}.pdf` : `${course.prefix}${String(page).padStart(course.digits, '0')}.png`;
    const key = isPdf ? `pdfs/${filename}` : `images/${course.name}/${filename}`;
    const body = await loadAsset(key);
    if (!body) return fail('Course asset unavailable', 503);
    return new Response(body, {
      headers: {
        ...privateHeaders,
        'Content-Type': isPdf ? 'application/pdf' : 'image/png',
        ...(isPdf && { 'Content-Disposition': `attachment; filename="${filename}"` }),
      },
    });
  } catch {
    return fail('Course asset unavailable', 503);
  }
}
