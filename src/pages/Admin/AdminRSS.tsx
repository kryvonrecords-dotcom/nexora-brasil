import React, { useCallback, useEffect, useState } from 'react';
import {
  Rss, Plus, RefreshCw, Trash2, Download,
  CheckCircle, AlertCircle, Loader2, ExternalLink
} from 'lucide-react';

interface RSSSource {
  id: string;
  name: string;
  url: string;
  categoryId: string;
  enabled: boolean;
  createdAt: string;
  lastCheckedAt?: string;
  lastError?: string;
}

interface Category {
  id: string;
  name: string;
  title?: string;
}

interface RSSStatus {
  sourcesCount: number;
  enabledSources: number;
  importedItemsTracked: number;
  parserAvailable: boolean;
}

interface TestResult {
  title: string;
  description: string;
  feedUrl: string;
  itemsFound: number;
  examples?: Array<{ title: string; link: string }>;
}

async function rssRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('nexora_admin_token');

  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || `Erro HTTP ${response.status}`);
  }

  return data as T;
}

export function AdminRSS() {
  const [sources, setSources] = useState<RSSSource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState<RSSStatus | null>(null);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState('');

  const loadData = useCallback(async () => {
    setError('');

    try {
      const [sourceData, statusData, categoryData] = await Promise.all([
        rssRequest<{ sources: RSSSource[] }>('/api/admin/rss/sources'),
        rssRequest<RSSStatus>('/api/admin/rss/status'),
        fetch('/api/categories').then(async response => {
          if (!response.ok) throw new Error('Não foi possível carregar categorias.');
          return response.json();
        })
      ]);

      setSources(sourceData.sources || []);
      setStatus(statusData);

      const categoryList: Category[] = Array.isArray(categoryData)
        ? categoryData
        : categoryData.categories || [];

      setCategories(categoryList);

      if (!categoryId && categoryList.length) {
        setCategoryId(categoryList[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar os dados RSS.');
    }
  }, [categoryId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const testFeed = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    setTestResult(null);

    try {
      const result = await rssRequest<TestResult>('/api/admin/rss/test', {
        method: 'POST',
        body: JSON.stringify({ url: url.trim() })
      });

      setTestResult(result);
      setMessage(`Fonte testada: ${result.itemsFound} notícias encontradas.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível testar a fonte.');
    } finally {
      setBusy(false);
    }
  };

  const addSource = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');

    try {
      await rssRequest('/api/admin/rss/sources', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          url: url.trim(),
          categoryId
        })
      });

      setName('');
      setUrl('');
      setTestResult(null);
      setMessage('Fonte RSS adicionada com sucesso.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível adicionar a fonte.');
    } finally {
      setBusy(false);
    }
  };

  const importSource = async (source: RSSSource) => {
    if (!window.confirm(`Importar notícias de "${source.name}" como rascunhos?`)) return;

    setBusyId(source.id);
    setError('');
    setMessage('');

    try {
      const result = await rssRequest<{
        imported?: number;
        skipped?: number;
        message?: string;
      }>('/api/admin/rss/import', {
        method: 'POST',
        body: JSON.stringify({ sourceId: source.id })
      });

      setMessage(
        result.message ||
        `Importação concluída. Novas notícias: ${result.imported ?? 0}; ignoradas: ${result.skipped ?? 0}.`
      );

      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na importação.');
    } finally {
      setBusyId('');
    }
  };

  const deleteSource = async (source: RSSSource) => {
    if (!window.confirm(`Eliminar a fonte "${source.name}"?`)) return;

    setBusyId(source.id);
    setError('');
    setMessage('');

    try {
      await rssRequest(`/api/admin/rss/sources/${encodeURIComponent(source.id)}`, {
        method: 'DELETE'
      });

      setMessage('Fonte eliminada.');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível eliminar a fonte.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-blue-100 p-3 text-blue-800">
              <Rss size={27} />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Fontes RSS</h1>
              <p className="text-sm text-slate-500">
                Gere fontes e importe notícias para revisão editorial.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
        >
          <RefreshCw size={16} /> Atualizar
        </button>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div role="status" className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle size={18} className="mt-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Fontes registadas</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{status?.sourcesCount ?? '—'}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Fontes ativas</p>
          <p className="mt-2 text-3xl font-bold text-green-700">{status?.enabledSources ?? '—'}</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Artigos acompanhados</p>
          <p className="mt-2 text-3xl font-bold text-blue-700">{status?.importedItemsTracked ?? '—'}</p>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Adicionar uma fonte RSS</h2>

        <form onSubmit={addSource} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Nome da fonte
              <input
                required
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder="Ex.: Agência de notícias"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Endereço RSS (URL)
              <input
                required
                type="url"
                value={url}
                onChange={event => setUrl(event.target.value)}
                placeholder="https://exemplo.com/feed/"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Categoria das notícias
            <select
              required
              value={categoryId}
              onChange={event => setCategoryId(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
            >
              <option value="">Selecionar categoria</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name || category.title || category.id}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy || !url.trim()}
              onClick={() => void testFeed()}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-700 px-4 py-2.5 font-semibold text-blue-800 hover:bg-blue-50 disabled:opacity-50"
            >
              {busy && !name ? <Loader2 size={17} className="animate-spin" /> : <RefreshCw size={17} />}
              Testar fonte
            </button>

            <button
              type="submit"
              disabled={busy || !name.trim() || !url.trim() || !categoryId}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-800 px-4 py-2.5 font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
            >
              <Plus size={18} /> Guardar fonte
            </button>
          </div>
        </form>

        {testResult && (
          <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h3 className="font-bold text-blue-950">{testResult.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{testResult.description}</p>
            <p className="mt-2 text-sm font-semibold text-blue-800">
              {testResult.itemsFound} notícias encontradas
            </p>
            <a
              href={testResult.feedUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 break-all text-sm text-blue-800 underline"
            >
              Abrir endereço do feed <ExternalLink size={14} />
            </a>
            {testResult.examples?.slice(0, 3).map((item, index) => (
              <p key={`${item.link}-${index}`} className="mt-2 text-sm text-slate-700">
                • {item.title}
              </p>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-lg font-bold text-slate-900">Fontes registadas</h2>
          <p className="mt-1 text-sm text-slate-500">
            A importação cria rascunhos; não publica notícias automaticamente.
          </p>
        </div>

        {sources.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Ainda não existem fontes RSS registadas.
          </div>
        ) : (
          <div className="divide-y">
            {sources.map(source => (
              <article key={source.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-900">{source.name}</h3>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${source.enabled ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                      {source.enabled ? 'Ativa' : 'Desativada'}
                    </span>
                  </div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block break-all text-sm text-blue-700 hover:underline"
                  >
                    {source.url}
                  </a>
                  {source.lastCheckedAt && (
                    <p className="mt-1 text-xs text-slate-500">
                      Última verificação: {new Date(source.lastCheckedAt).toLocaleString('pt-PT')}
                    </p>
                  )}
                  {source.lastError && (
                    <p className="mt-1 text-sm text-red-700">{source.lastError}</p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busyId === source.id || !source.enabled}
                    onClick={() => void importSource(source)}
                    className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                  >
                    {busyId === source.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    Importar rascunhos
                  </button>

                  <button
                    type="button"
                    disabled={busyId === source.id}
                    onClick={() => void deleteSource(source)}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-slate-500">
        Importa apenas fontes em que confias e revê todos os rascunhos antes da publicação.
        A disponibilidade do feed depende do servidor de origem.
      </p>
    </div>
  );
}
