import path from 'path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import explorerAuth from './api/explorer-auth';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        {
          name: 'sparky-explorer-auth',
          configureServer(server) {
            const env = loadEnv(mode, projectRoot, '');
            server.middlewares.use((req, res, next) => {
              if (req.url?.split('?')[0] !== '/api/explorer-auth') return next();

              const apiResponse = {
                status(code: number) {
                  res.statusCode = code;
                  return apiResponse;
                },
                setHeader: res.setHeader.bind(res),
                json(data: unknown) {
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify(data));
                },
              };
              res.setHeader('Cache-Control', 'no-store');

              void (async () => {
                let body: unknown;
                if (req.method === 'POST') {
                  if (req.headers['content-type']?.split(';')[0].trim() !== 'application/json') {
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
                await explorerAuth({ method: req.method, headers: req.headers, body } as VercelRequest,
                  apiResponse as VercelResponse, env);
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
