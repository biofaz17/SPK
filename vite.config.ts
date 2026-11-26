import path from 'path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { ApiRequest, ApiResponse } from './api/_lib/http';
import adminData from './api/admin-data';
import adminLogin from './api/admin-login';
import adminLogout from './api/admin-logout';
import explorerAuth from './api/explorer-auth';
import gemini from './api/gemini';
import premiumCourse from './api/premium-course';
import premiumLevels from './api/premium-levels';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const localRoutes = new Map<string, (request: ApiRequest, response: ApiResponse, env: Record<string, string>) => unknown>([
  ['/api/admin-data', adminData],
  ['/api/admin-login', adminLogin],
  ['/api/admin-logout', adminLogout],
  ['/api/explorer-auth', explorerAuth],
  ['/api/gemini', gemini],
  ['/api/premium-course', premiumCourse],
  ['/api/premium-levels', premiumLevels],
]);

export default defineConfig(({ mode }) => {
    return {
      server: {
        port: 3000,
        host: '127.0.0.1',
        fs: {
          deny: ['.env', '.env.*', '.dev.vars', '.dev.vars.*', '*.{crt,pem}', '**/.git/**', '**/.wrangler/**',
            '**/api/**', '**/private-course-assets/**', '**/dist/**', '**/changes_export/**', '**/changes_snapshot/**'],
        },
      },
      plugins: [
        react(),
        {
          name: 'sparky-local-apis',
          configureServer(server) {
            const env = loadEnv(mode, projectRoot, '');
            server.middlewares.use((req, res, next) => {
              const url = new URL(req.url ?? '/', 'http://localhost');
              const handler = localRoutes.get(url.pathname);
              if (!handler) return next();

              const apiResponse: ApiResponse = {
                status(code: number) {
                  res.statusCode = code;
                  return apiResponse;
                },
                setHeader: res.setHeader.bind(res),
                end(data?: Uint8Array) {
                  res.end(data);
                },
                json(data: unknown) {
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify(data));
                },
              };
              res.setHeader('Cache-Control', 'no-store');

              void (async () => {
                let body: unknown;
                if (req.method === 'POST') {
                  if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') {
                    return apiResponse.status(415).json({ error: 'Envie os dados em formato JSON.' });
                  }
                  const chunks: Buffer[] = [];
                  let size = 0;
                  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
                    size += chunk.length;
                    if (size > 4096) {
                      req.resume();
                      return apiResponse.status(413).json({ error: 'Dados de acesso muito longos.' });
                    }
                    chunks.push(chunk);
                  }
                  try {
                    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
                  } catch {
                    return apiResponse.status(400).json({ error: 'Dados de acesso inválidos.' });
                  }
                }
                const headers = { ...req.headers, 'x-forwarded-for': req.socket.remoteAddress };
                await handler({ method: req.method, url: req.url, headers, query: Object.fromEntries(url.searchParams), body }, apiResponse, env);
              })().catch(() => apiResponse.status(500).json({ error: 'Não foi possível acessar o serviço de contas.' }));
            });
          },
        },
      ],
      resolve: {
        alias: {
          '@': projectRoot,
        }
      }
    };
});
