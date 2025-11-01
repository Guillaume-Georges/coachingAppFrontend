import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export function SearchBar() {
  const [params, setParams] = useSearchParams();
  const [value, setValue] = useState<string>(() => params.get('search') || '');
  const timer = useRef<number | undefined>();

  useEffect(() => setValue(params.get('search') || ''), [params]);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value; setValue(v);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const p = new URLSearchParams(params);
      if (v) p.set('search', v); else p.delete('search');
      p.set('page', '1');
      setParams(p, { replace: true });
    }, 300);
  }

  const id = useMemo(() => 'search-input', []);

  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-xs font-semibold tracking-wider uppercase text-slate-400">Search by name</label>
      <div className="mt-1 relative">
        <input
          id={id}
          type="text"
          value={value}
          onChange={onChange}
          placeholder="Search exercises"
          className="w-full rounded-2xl border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-brand-600 focus:ring-brand-600 pl-10 pr-3 py-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400"
        />
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" aria-hidden />
      </div>
    </div>
  );
}



