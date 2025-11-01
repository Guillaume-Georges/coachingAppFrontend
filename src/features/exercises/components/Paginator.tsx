import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export function Paginator({ page, limit, total }: { page: number; limit: number; total: number }) {
  const [params, setParams] = useSearchParams();
  const pages = Math.max(1, Math.ceil(total / limit));
  const items = useMemo(() => {
    const start = Math.max(1, page - 2);
    const end = Math.min(pages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, pages]);
  function goto(p: number) {
    const q = new URLSearchParams(params);
    q.set('page', String(p));
    setParams(q, { replace: true });
  }
  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      <button className="btn-ghost px-3 py-2 text-base sm:text-sm" disabled={page <= 1} onClick={() => goto(page - 1)} aria-label="Previous">‹</button>
      {items.map(p => (
        <button key={p} className={`px-4 py-2 rounded-md text-base sm:text-sm ${p===page? 'bg-gray-900 text-white':'text-gray-700 hover:bg-gray-100'}`} onClick={() => goto(p)} aria-current={p===page? 'page':undefined}>{p}</button>
      ))}
      <button className="btn-ghost px-3 py-2 text-base sm:text-sm" disabled={page >= pages} onClick={() => goto(page + 1)} aria-label="Next">›</button>
    </nav>
  );
}

