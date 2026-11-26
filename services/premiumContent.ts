import type { FinalProjectLevel } from '../finalProjectTypes';
import type { LevelConfig } from '../types';
import { dataService } from './DataService';

export type PremiumLevel =
  | { kind: 'puzzle'; level: LevelConfig }
  | { kind: 'final-project'; level: FinalProjectLevel };

async function fetchPremium(path: string, params: Record<string, string>, signal?: AbortSignal) {
  const token = await dataService.getAccessToken();
  if (!token) throw new Error('Entre novamente para acessar este conteúdo.');

  const response = await fetch(`/api/${path}?${new URLSearchParams(params)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
    signal,
  });
  if (response.status === 401) throw new Error('Entre novamente para acessar este conteúdo.');
  if (response.status === 403) throw new Error('Seu plano atual não inclui este conteúdo.');
  if (!response.ok) throw new Error('Não foi possível carregar o conteúdo. Tente novamente.');
  return response;
}

export async function fetchPremiumLevel(id: number, signal?: AbortSignal): Promise<PremiumLevel> {
  const response = await fetchPremium('premium-levels', { id: String(id) }, signal);
  return response.json();
}

export async function fetchCoursePage(course: string, page: number, signal?: AbortSignal) {
  const response = await fetchPremium('premium-course', { course, asset: String(page) }, signal);
  return response.blob();
}

export async function downloadCoursePdf(course: string) {
  const response = await fetchPremium('premium-course', { course, asset: 'pdf' });
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  const filename = response.headers.get('Content-Disposition')?.match(/filename="([a-z0-9_.-]+)"/i)?.[1];
  link.href = url;
  link.download = filename ?? `${course}.pdf`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
