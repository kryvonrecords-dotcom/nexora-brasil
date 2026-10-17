import React, { useEffect, useState } from 'react';
import { Loader2, ArrowLeft, Filter } from 'lucide-react';
import { Category, NewsItem } from '../types';
import { api } from '../services/api';
import { NewsCard } from '../components/NewsCard';

interface Props {
  slug: string;
  onNavigate: (path: string) => void;
}

export function CategoryPage({ slug, onNavigate }: Props) {
  const [data, setData] = useState<{ category: Category; news: NewsItem[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setLoading(true);
    setError(null);

    api.getCategoryBySlug(slug)
      .then(res => {
        setData(res);
        document.title = `${res.category.name} | Notícias de ${res.category.name} | Nexora Brasil`;
      })
      .catch(err => {
        setError(err.message || 'Categoria não encontrada');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-[#00843D] mb-3" />
        <p className="text-sm font-medium">A carregar notícias da categoria...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 font-serif">Categoria Não Encontrada</h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">A categoria solicitada não existe ou foi removida.</p>
          <button
            onClick={() => onNavigate('/')}
            className="px-6 py-2.5 bg-[#00843D] hover:bg-[#007033] text-white font-bold text-sm rounded-xl transition-colors inline-flex items-center gap-2 cursor-pointer shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  const { category, news } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Category Hero Banner */}
      <div className="bg-[#071526] text-white rounded-2xl p-6 sm:p-10 mb-10 shadow-lg relative overflow-hidden border border-emerald-950/50">
        <div 
          className="absolute top-0 left-0 bottom-0 w-3 shadow-md" 
          style={{ backgroundColor: category.color || '#00843D' }}
        ></div>
        <div className="max-w-3xl">
          <span className="text-xs font-black uppercase tracking-widest text-[#FFB800] block mb-2">
            Editoria
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-serif tracking-tight">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed">
              {category.description}
            </p>
          )}
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-slate-400">
            <span>{news.length} {news.length === 1 ? 'artigo publicado' : 'artigos publicados'}</span>
          </div>
        </div>
      </div>

      {/* News List */}
      {news.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <p className="text-slate-700 font-semibold text-lg">Nenhuma notícia publicada nesta categoria ainda.</p>
          <p className="text-slate-400 text-sm mt-1">Volte em breve para novos artigos da redação.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map(item => (
            <NewsCard key={item.id} news={item} variant="standard" onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}
