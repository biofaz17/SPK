import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  Activity, ArrowRight, ChevronLeft, ChevronRight, CreditCard, ExternalLink, LayoutDashboard,
  LogOut, RefreshCw, Search, ShieldCheck, UserPlus, Users, Wallet,
} from 'lucide-react';
import type { AdminAccount, AdminAccounts, AdminPayments, AdminPaymentStatus, AdminPlan } from '../adminTypes';
import './admin.css';

interface AdminDashboardProps {
  token: string;
  onExit: () => void;
  onSessionExpired: () => void;
}

const sections = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard, description: 'Acompanhe os cadastros, a atividade e os planos do Sparky.' },
  { id: 'accounts', label: 'Contas', icon: Users, description: 'Consulte os perfis e acompanhe os novos cadastros.' },
  { id: 'payments', label: 'Financeiro', icon: Wallet, description: 'Acompanhe as cobranças do Sparky e acesse o saldo da conta Mercado Pago.' },
] as const;

type Section = typeof sections[number]['id'];
type AccountView = 'all' | 'new' | 'legacy';
const planNames: Record<AdminPlan, string> = { FREE: 'Gratuito', STARTER: 'Starter', PRO: 'Pro' };
const paymentStatusNames: Record<AdminPaymentStatus, string> = {
  approved: 'Aprovado', pending: 'Pendente', refunded: 'Reembolso', rejected: 'Recusado',
  cancelled: 'Cancelado', disputed: 'Em disputa', other: 'Outro',
};

const numberFormat = new Intl.NumberFormat('pt-BR');
const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' });
const currencyFormat = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fetchError = 'Não foi possível consultar os dados. Tente atualizar.';

function dateLabel(date: string | null, fallback = 'Sem registro') {
  const time = date ? Date.parse(date) : NaN;
  return Number.isFinite(time) ? dateFormat.format(time) : fallback;
}

type Resource<T> = { url: string; refresh: number; data?: T; error?: string; updatedAt?: string };

function useAdminResource<T>(url: string | null, token: string, refresh: number, onSessionExpired: () => void) {
  const [resource, setResource] = useState<Resource<T>>();

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]);
    void (async () => {
      try {
        const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal });
        if (controller.signal.aborted) return;
        if (response.status === 401) return onSessionExpired();
        if (!response.ok) {
          const result = await response.json().catch(() => null);
          const error = result?.code === 'ADMIN_ACCOUNTS_SETUP'
            ? 'Aplique supabase-admin.sql no Supabase para habilitar a consulta de contas.' : fetchError;
          if (!controller.signal.aborted) setResource({ url, refresh, error });
          return;
        }
        const data: T = await response.json();
        if (!controller.signal.aborted) setResource({ url, refresh, data, updatedAt: new Date().toISOString() });
      } catch {
        if (!controller.signal.aborted) setResource({ url, refresh, error: fetchError });
      }
    })();
    return () => controller.abort();
  }, [url, token, refresh, onSessionExpired]);

  const current = resource?.url === url && resource.refresh === refresh ? resource : undefined;
  return { data: current?.data, error: current?.error, updatedAt: current?.updatedAt, loading: Boolean(url && !current) };
}

export function AdminDashboard({ token, onExit, onSessionExpired }: AdminDashboardProps) {
  const [section, setSection] = useState<Section>('overview');
  const [view, setView] = useState<AccountView>('all');
  const [plan, setPlan] = useState<AdminPlan | ''>('');
  const [term, setTerm] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const accountParams = new URLSearchParams({
    view: section === 'overview' ? 'new' : view,
    page: section === 'overview' ? '1' : String(page),
  });
  if (section === 'accounts' && plan) accountParams.set('plan', plan);
  if (section === 'accounts' && query) accountParams.set('q', query);

  const accounts = useAdminResource<AdminAccounts>(
    section === 'payments' ? null : `/api/admin-data?${accountParams}`, token, refresh, onSessionExpired,
  );
  const payments = useAdminResource<AdminPayments>(
    section === 'payments' ? '/api/admin-data?section=payments' : null, token, refresh, onSessionExpired,
  );
  const active = sections.find(item => item.id === section)!;
  const resource = section === 'payments' ? payments : accounts;

  const showNewAccounts = () => {
    setView('new');
    setPlan('');
    setTerm('');
    setQuery('');
    setPage(1);
    setSection('accounts');
  };

  const searchAccounts = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuery(term.trim());
    setPage(1);
  };

  return (
    <div className="sparky-admin admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-icon"><ShieldCheck size={23} aria-hidden="true" /></span>
          <div><strong>Sparky</strong><span>Administração</span></div>
        </div>
        <nav className="admin-nav" aria-label="Seções administrativas">
          {sections.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" aria-current={section === id ? 'page' : undefined} onClick={() => setSection(id)}>
              <Icon size={19} aria-hidden="true" />{label}
            </button>
          ))}
        </nav>
        <button type="button" className="admin-logout" onClick={onExit}>
          <LogOut size={18} aria-hidden="true" /> Sair do painel
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-page-heading">
          <div><h1>{active.label}</h1><p>{active.description}</p></div>
          <div className="admin-refresh">
            <button type="button" className="admin-button" disabled={resource.loading} onClick={() => setRefresh(value => value + 1)}>
              <RefreshCw size={16} className={resource.loading ? 'admin-spin' : undefined} aria-hidden="true" /> Atualizar
            </button>
            {resource.updatedAt && <small>Consulta em {dateLabel(resource.updatedAt)}</small>}
          </div>
        </header>

        {section === 'payments' && <BalancePanel />}
        {resource.loading && <p className="admin-feedback" role="status"><RefreshCw size={18} className="admin-spin" aria-hidden="true" /> Carregando dados…</p>}
        {resource.error && <p className="admin-feedback admin-feedback-warning" role="alert">{resource.error}</p>}

        {section === 'overview' && accounts.data && <Overview data={accounts.data} onShowNew={showNewAccounts} />}
        {section === 'accounts' && (
          <section className="admin-panel" aria-labelledby="accounts-heading" aria-busy={accounts.loading}>
            <div className="admin-panel-heading">
              <div><h2 id="accounts-heading">Perfis cadastrados</h2>{accounts.data && <p>{numberFormat.format(accounts.data.filteredTotal)} perfis encontrados</p>}</div>
            </div>
            <form className="admin-filters" onSubmit={searchAccounts}>
              <label className="admin-search">
                <span>Nome ou ID da conta</span>
                <span><Search size={16} aria-hidden="true" /><input type="search" value={term} onChange={event => setTerm(event.target.value)} placeholder="Buscar perfil" maxLength={100} /></span>
              </label>
              <label>Cadastro
                <select value={view} onChange={event => { setView(event.target.value as AccountView); setPage(1); }}>
                  <option value="all">Todos os cadastros</option>
                  <option value="new">Últimos 7 dias</option>
                  <option value="legacy">Sem data registrada</option>
                </select>
              </label>
              <label>Plano
                <select value={plan} onChange={event => { setPlan(event.target.value as AdminPlan | ''); setPage(1); }}>
                  <option value="">Todos os planos</option>
                  {Object.entries(planNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <button className="admin-button admin-button-primary" type="submit">Buscar</button>
            </form>
            {accounts.data && (
              <>
                <AccountsTable profiles={accounts.data.profiles} empty="Nenhum perfil corresponde aos filtros." />
                <Pagination page={accounts.data.page} pageSize={accounts.data.pageSize} total={accounts.data.filteredTotal} onPage={setPage} />
              </>
            )}
          </section>
        )}
        {section === 'payments' && payments.data && <PaymentsPanel data={payments.data} />}
      </main>
    </div>
  );
}

function Metric({ label, value, icon, detail }: { label: string; value: ReactNode; icon: ReactNode; detail: string }) {
  return (
    <div className="admin-metric">
      <span className="admin-metric-icon" aria-hidden="true">{icon}</span>
      <div><div className="admin-metric-label">{label}</div><strong>{value}</strong><small>{detail}</small></div>
    </div>
  );
}

function Overview({ data, onShowNew }: { data: AdminAccounts; onShowNew: () => void }) {
  const summary = data.summary;
  const breakdown = { FREE: summary.free, STARTER: summary.starter, PRO: summary.pro };
  return (
    <>
      <section className="admin-metrics" aria-label="Indicadores de contas">
        <Metric label="Total de contas" value={numberFormat.format(summary.total)} icon={<Users size={19} />} detail="Perfis cadastrados" />
        <Metric label="Novos cadastros" value={numberFormat.format(summary.newLast7Days)} icon={<UserPlus size={19} />} detail="Nos últimos 7 dias" />
        <Metric label="Ativos hoje" value={numberFormat.format(summary.activeToday)} icon={<Activity size={19} />} detail="Horário de Brasília" />
        <Metric label="Contas com plano pago" value={numberFormat.format(summary.starter + summary.pro)} icon={<CreditCard size={19} />} detail="Starter e Pro" />
      </section>
      <div className="admin-overview-grid">
        <section className="admin-panel" aria-labelledby="recent-heading">
          <div className="admin-panel-heading">
            <div><h2 id="recent-heading">Cadastros recentes</h2><p>Contas criadas nos últimos 7 dias</p></div>
            <button type="button" className="admin-text-button" onClick={onShowNew}>Ver cadastros <ArrowRight size={16} aria-hidden="true" /></button>
          </div>
          <AccountsTable profiles={data.profiles.slice(0, 6)} empty="Nenhum cadastro registrado nos últimos 7 dias." compact />
        </section>
        <section className="admin-panel admin-breakdown" aria-labelledby="plans-heading">
          <h2 id="plans-heading">Contas por plano</h2>
          {Object.entries(breakdown).map(([plan, total]) => (
            <div className="admin-plan-bar" key={plan}>
              <div><span>{planNames[plan as AdminPlan]}</span><strong>{numberFormat.format(total)}</strong></div>
              <div className="admin-track" aria-hidden="true"><span data-plan={plan} style={{ width: `${summary.total ? (total / summary.total) * 100 : 0}%` }} /></div>
            </div>
          ))}
          <dl className="admin-account-details">
            <div><dt>Termos aceitos</dt><dd>{numberFormat.format(summary.withTerms)}</dd></div>
            <div><dt>Sem data de cadastro</dt><dd>{numberFormat.format(summary.withoutRegistrationDate)}</dd></div>
          </dl>
        </section>
      </div>
    </>
  );
}

function AccountsTable({ profiles, empty, compact = false }: { profiles: AdminAccount[]; empty: string; compact?: boolean }) {
  if (!profiles.length) return <p className="admin-empty">{empty}</p>;
  return (
    <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Tabela de contas">
      <table className="admin-table">
        <thead><tr><th scope="col">Conta</th><th scope="col">Plano</th><th scope="col">Cadastro</th>
          {!compact && <><th scope="col">Última atividade</th><th scope="col">Progresso</th><th scope="col">Termos</th></>}
        </tr></thead>
        <tbody>
          {profiles.map(profile => (
            <tr key={profile.id}>
              <th scope="row">
                <div className="admin-user"><span className="admin-avatar" aria-hidden="true">{[...profile.name.trim()][0]?.toLocaleUpperCase('pt-BR') || '?'}</span>
                  <span><strong>{profile.name || 'Sem nome'}</strong>{!compact && <small>{profile.id}</small>}</span></div>
              </th>
              <td><span className="admin-pill" data-kind={profile.plan}>{planNames[profile.plan]}</span></td>
              <td>{dateLabel(profile.createdAt, 'Sem data registrada')}</td>
              {!compact && <>
                <td>{dateLabel(profile.lastActive)}</td>
                <td>{typeof profile.unlockedLevels === 'number' && profile.unlockedLevels > 0 && Number.isSafeInteger(profile.unlockedLevels)
                  ? `Nível ${numberFormat.format(profile.unlockedLevels)}` : '—'}
                  {typeof profile.stars === 'number' && profile.stars >= 0 && Number.isSafeInteger(profile.stars)
                    && <small>{numberFormat.format(profile.stars)} {profile.stars === 1 ? 'estrela' : 'estrelas'}</small>}
                </td>
                <td>{profile.termsAccepted ? 'Aceitos' : 'Pendente'}</td>
              </>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BalancePanel() {
  return (
    <section className="admin-panel admin-balance" aria-labelledby="balance-heading">
      <span className="admin-balance-icon"><Wallet size={24} aria-hidden="true" /></span>
      <div><h2 id="balance-heading">Saldo disponível</h2><p>Consulte o saldo liberado e o extrato em <strong>Seu dinheiro</strong>, no Mercado Pago.</p></div>
      <a href="https://www.mercadopago.com.br/" target="_blank" rel="noopener noreferrer" className="admin-button admin-button-primary">
        Abrir Mercado Pago <ExternalLink size={16} aria-hidden="true" />
      </a>
    </section>
  );
}

function PaymentsPanel({ data }: { data: AdminPayments }) {
  const [status, setStatus] = useState<AdminPaymentStatus | ''>('');
  const [page, setPage] = useState(1);
  const { status: coverage, entries, periodDays } = data;
  if (coverage === 'unconfigured' || coverage === 'unavailable') {
    return <p className="admin-feedback admin-feedback-warning" role="status">{coverage === 'unconfigured'
      ? 'Configure MP_ACCESS_TOKEN no servidor para consultar as cobranças.'
      : 'O Mercado Pago está indisponível para consulta. Tente atualizar.'}</p>;
  }

  const approved = entries.filter(entry => entry.status === 'approved');
  const pending = entries.filter(entry => entry.status === 'pending');
  const gross = approved.reduce((sum, entry) => sum + entry.amountCents, 0);
  const filtered = status ? entries.filter(entry => entry.status === status) : entries;
  const pageSize = 15;
  const currentPage = Math.min(page, Math.max(1, Math.ceil(filtered.length / pageSize)));
  const start = (currentPage - 1) * pageSize;

  return (
    <>
      {coverage === 'partial' && <p className="admin-feedback admin-feedback-warning" role="status">Consulta parcial. Os indicadores consideram as cobranças retornadas pelo Mercado Pago.</p>}
      <section className="admin-metrics admin-metrics-payments" aria-label="Indicadores financeiros">
        <Metric label="Valor bruto aprovado" value={currencyFormat.format(gross / 100)} detail="Antes de taxas e liberações" icon={<Wallet size={19} />} />
        <Metric label="Cobranças aprovadas" value={numberFormat.format(approved.length)} detail={`Criadas nos últimos ${periodDays} dias`} icon={<CreditCard size={19} />} />
        <Metric label="Cobranças pendentes" value={numberFormat.format(pending.length)} detail={`Criadas nos últimos ${periodDays} dias`} icon={<Activity size={19} />} />
      </section>
      <section className="admin-panel" aria-labelledby="payments-heading">
        <div className="admin-panel-heading admin-payments-heading">
          <div><h2 id="payments-heading">Histórico de cobranças</h2><p>Data de criação · últimos {periodDays} dias</p></div>
          <label>Situação
            <select value={status} onChange={event => { setStatus(event.target.value as AdminPaymentStatus | ''); setPage(1); }}>
              <option value="">Todas as situações</option>
              {Object.entries(paymentStatusNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>
        {filtered.length === 0 ? <p className="admin-empty">Nenhuma cobrança encontrada.</p> : (
          <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Tabela de cobranças">
            <table className="admin-table">
              <thead><tr><th scope="col">Referência</th><th scope="col">Conta</th><th scope="col">Plano</th><th scope="col">Situação</th><th scope="col">Valor</th><th scope="col">Criada em</th></tr></thead>
              <tbody>{filtered.slice(start, start + pageSize).map(entry => (
                <tr key={`${entry.source}:${entry.id}`}>
                  <th scope="row"><strong>{entry.source === 'order' ? 'Pedido' : 'Pagamento'}</strong><small>{entry.id}</small></th>
                  <td>{entry.profileId}</td><td>{planNames[entry.tier]}</td>
                  <td><span className="admin-pill" data-kind={entry.status}>{paymentStatusNames[entry.status]}</span></td>
                  <td className="admin-amount">{currencyFormat.format(entry.amountCents / 100)}</td><td>{dateLabel(entry.createdAt)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <Pagination page={currentPage} pageSize={pageSize} total={filtered.length} onPage={setPage} />
      </section>
    </>
  );
}

function Pagination({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (page: number) => void }) {
  const lastPage = Math.ceil(total / pageSize);
  if (lastPage <= 1) return null;
  return (
    <div className="admin-pagination" aria-label="Paginação">
      <span>Página {numberFormat.format(page)} de {numberFormat.format(lastPage)}</span>
      <button type="button" className="admin-button" onClick={() => onPage(page - 1)} disabled={page <= 1}><ChevronLeft size={16} aria-hidden="true" /> Anterior</button>
      <button type="button" className="admin-button" onClick={() => onPage(page + 1)} disabled={page >= lastPage}>Próxima <ChevronRight size={16} aria-hidden="true" /></button>
    </div>
  );
}
