import React, { useState } from 'react';
import {
  Search,
  Image as ImageIcon,
  Copy,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ImageResult {
  id: string;
  title: string;
  imageUrl: string;
  originalUrl: string;
  sourceUrl: string;
  author: string;
  license: string;
  licenseUrl: string;
  attributionRequired: boolean;
  description: string;
}

export function AdminImageSources() {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState<ImageResult | null>(null);

  async function searchImages(event: React.FormEvent) {
    event.preventDefault();

    if (query.trim().length < 2) {
      setError('Escreva pelo menos 2 caracteres para pesquisar.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');
    setImages([]);
    setSelected(null);

    try {
      const token = localStorage.getItem('nexora_admin_token');
      const response = await fetch(
        `/api/admin/image-sources/wikimedia?q=${encodeURIComponent(query.trim())}`,
        {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {}
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Não foi possível pesquisar imagens.');
      }

      setImages(data.images || []);

      if (!data.images?.length) {
        setMessage('Não foram encontradas imagens. Tenta outras palavras-chave.');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Erro ao pesquisar imagens. Verifica a ligação ao servidor.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${label} copiado.`);
    } catch {
      setMessage(`Não foi possível copiar automaticamente. Seleciona e copia: ${value}`);
    }
  }

  function useImage(image: ImageResult) {
    setSelected(image);
    setMessage('Imagem selecionada. Copia o endereço e a atribuição antes de a utilizares numa notícia.');
  }

  return (
    <div className="space-y-6 text-slate-100">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black">Fontes de Imagens</h1>
        <p className="mt-2 text-sm text-slate-400">
          Pesquisa imagens para as notícias do NEXORA BRASIL.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
            <ImageIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-bold">Wikimedia Commons</h2>
            <p className="text-xs text-slate-400">
              Consulta a origem e a licença de cada imagem.
            </p>
          </div>
        </div>

        <form onSubmit={searchImages} className="flex flex-col gap-3 sm:flex-row">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ex.: notícias do Brasil, futebol, economia..."
            className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Pesquisar
          </button>
        </form>
      </div>

      {error && (
        <div className="flex gap-2 rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-slate-300">
          {message}
        </div>
      )}

      {selected && (
        <section className="rounded-2xl border border-emerald-700 bg-slate-900 p-5">
          <div className="mb-3 flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
            <h2 className="font-bold">Imagem selecionada</h2>
          </div>

          <p className="mb-3 break-words text-sm font-semibold">{selected.title}</p>

          <label className="mb-1 block text-xs text-slate-400">Endereço da imagem</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={selected.originalUrl}
              className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 p-2 text-xs"
            />
            <button
              onClick={() => copyText(selected.originalUrl, 'Endereço da imagem')}
              className="flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600"
            >
              <Copy className="h-4 w-4" /> Copiar
            </button>
          </div>

          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p><strong>Autor:</strong> {selected.author}</p>
            <p><strong>Licença:</strong> {selected.license}</p>
            {selected.attributionRequired && (
              <p className="text-amber-300">
                Esta imagem indica que a atribuição é necessária.
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() =>
                copyText(
                  `${selected.title} — ${selected.author} — ${selected.license}. Fonte: ${selected.sourceUrl}`,
                  'Atribuição'
                )
              }
              className="flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold hover:bg-emerald-600"
            >
              <Copy className="h-4 w-4" /> Copiar atribuição
            </button>

            <a
              href={selected.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
            >
              <ExternalLink className="h-4 w-4" /> Ver página original
            </a>

            {selected.licenseUrl && (
              <a
                href={selected.licenseUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
              >
                <ExternalLink className="h-4 w-4" /> Consultar licença
              </a>
            )}
          </div>
        </section>
      )}

      {images.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-bold">
            Resultados <span className="text-slate-400">({images.length})</span>
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {images.map((image) => (
              <article
                key={image.id}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
              >
                <div className="aspect-video bg-slate-950">
                  <img
                    src={image.imageUrl}
                    alt={image.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="space-y-3 p-4">
                  <h3 className="line-clamp-2 text-sm font-bold">{image.title}</h3>
                  <p className="text-xs text-slate-400">
                    Autor: {image.author}
                  </p>
                  <p className="text-xs text-slate-400">
                    Licença: {image.license}
                  </p>

                  <div className="flex gap-2">
                    <button
                      onClick={() => useImage(image)}
                      className="flex-1 rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold hover:bg-emerald-600"
                    >
                      Selecionar
                    </button>
                    <a
                      href={image.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Ver página original"
                      className="rounded-lg border border-slate-700 p-2 hover:bg-slate-800"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {!loading && images.length === 0 && !error && !message && (
        <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center">
          <ImageIcon className="mx-auto mb-3 h-10 w-10 text-slate-600" />
          <p className="font-semibold text-slate-300">Pesquisa imagens para as tuas notícias</p>
          <p className="mt-2 text-sm text-slate-500">
            Os resultados mostrarão a imagem, a origem e a licença disponível.
          </p>
        </div>
      )}

      <p className="text-xs leading-relaxed text-slate-500">
        Antes de publicar, confirma as condições específicas de reutilização da imagem.
        A presença de uma imagem no Wikimedia Commons não significa que todas as utilizações
        estejam automaticamente autorizadas.
      </p>
    </div>
  );
}
