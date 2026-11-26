import type { IncomingHttpHeaders } from 'node:http';

export interface ApiRequest {
  method?: string;
  url?: string;
  headers: IncomingHttpHeaders;
  query: Record<string, string | string[] | undefined>;
  body?: any;
}

export interface ApiResponse {
  status(code: number): ApiResponse;
  setHeader(name: string, value: string): void;
  json(data: unknown): void;
  end(data?: Uint8Array): void;
}
