import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ApiRequest, ApiResponse } from './_lib/http';
import { servePremiumCourse } from './_lib/premiumCourse';
import type { ProfileSessionEnvironment } from './_lib/profileSession';

export default async function handler(
  req: ApiRequest,
  res: ApiResponse,
  env?: ProfileSessionEnvironment,
) {
  const request = new Request(new URL(req.url ?? '/', 'http://localhost'), {
    method: req.method,
    headers: typeof req.headers.authorization === 'string' ? { authorization: req.headers.authorization } : {},
  });
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = env ?? process.env;
  const response = await servePremiumCourse(request, { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY }, async key => {
    return Uint8Array.from(await readFile(join(process.cwd(), 'private-course-assets', key)));
  });
  response.headers.forEach((value, name) => res.setHeader(name, value));
  res.status(response.status).end(Buffer.from(await response.arrayBuffer()));
}
