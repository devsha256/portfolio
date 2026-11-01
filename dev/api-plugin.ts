import { readFileSync, readdirSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { join, relative } from 'node:path';
import { loadEnv, type Plugin, type ViteDevServer } from 'vite';
import { z } from 'zod';
import { applyRewrites, resolveRoute } from './routes';

const VercelConfig = z.object({ rewrites: z.array(z.object({ source: z.string(), destination: z.string() })) });
const FunctionModule = z.record(z.string(), z.unknown());
type WebHandler = (request: Request) => Promise<Response>;

function functionFiles(apiDir: string): string[] {
  return readdirSync(apiDir, { recursive: true, encoding: 'utf8' })
    .map((file) => relative(apiDir, join(apiDir, file)).replaceAll('\\', '/'))
    .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'));
}

async function toWebRequest(req: IncomingMessage): Promise<Request> {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const method = req.method ?? 'GET';
  const body = method === 'GET' || method === 'HEAD' ? undefined : Buffer.concat(chunks);
  return new Request(`http://${req.headers.host ?? 'localhost'}${req.url ?? '/'}`, { method, headers, body });
}

async function sendWebResponse(res: ServerResponse, response: Response): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    if (key !== 'set-cookie') res.setHeader(key, value);
  });
  const cookies = response.headers.getSetCookie();
  if (cookies.length > 0) res.setHeader('set-cookie', cookies);
  res.end(Buffer.from(await response.arrayBuffer()));
}

async function loadHandler(server: ViteDevServer, file: string, method: string): Promise<WebHandler | null> {
  const loaded = FunctionModule.parse(await server.ssrLoadModule(`/api/${file}`));
  const handler = loaded[method];
  return typeof handler === 'function' ? (request) => Promise.resolve(handler(request)) : null;
}

/** Serves `/api/**` from the Vercel function files during `npm run dev`, so no Vercel CLI or account is needed. */
export function apiPlugin(): Plugin {
  return {
    name: 'portfolio-api',
    apply: 'serve',
    configureServer(server) {
      Object.assign(process.env, loadEnv(server.config.mode, server.config.root, ''));
      const root = server.config.root;
      const { rewrites } = VercelConfig.parse(JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8')));
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        const file = resolveRoute(applyRewrites(url.pathname, rewrites), functionFiles(join(root, 'api')));
        if (!file) return next();
        req.url = applyRewrites(url.pathname, rewrites) + url.search;
        void (async () => {
          const handler = await loadHandler(server, file, req.method ?? 'GET');
          if (!handler) return sendWebResponse(res, new Response('Method not allowed', { status: 405 }));
          await sendWebResponse(res, await handler(await toWebRequest(req)));
        })().catch(next);
      });
    },
  };
}
