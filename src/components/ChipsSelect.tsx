import { Fragment, useEffect, useRef, useState } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { useFacetOptions, useCreateFacet } from '../features/exercises/api';

type Facet = 'categories'|'modalities'|'tags';

type ChipsSelectProps = {
  facet: Facet;
  mode: 'single'|'multi';
  value: string | string[];
  onChange: (v: string | string[]) => void;
  placeholder?: string;
  createEnabled?: boolean;
};

export function ChipsSelect({ facet, mode, value, onChange, placeholder = 'Select', createEnabled = true }: ChipsSelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useFacetOptions(facet, query);
  const { mutate: createFacet, isPending: isCreating } = useCreateFacet();

  const options = data ?? [];
  const values = (mode === 'multi' ? (value as string[]) : [value as string]).filter(Boolean);
  const selectedSet = new Set(values);
  const lowerOptions = new Set(options.map(o => o.value.toLowerCase()));
  const canCreate = createEnabled && !!query.trim() && !lowerOptions.has(query.trim().toLowerCase());

  function remove(val: string) {
    if (mode === 'multi') onChange((values as string[]).filter(v => v !== val));
    else onChange('');
  }

  function toggle(val: string) {
    if (mode === 'multi') {
      const set = new Set(values as string[]);
      if (set.has(val)) set.delete(val); else set.add(val);
      onChange(Array.from(set));
    } else {
      onChange(val);
      setOpen(false);
    }
  }

  function handleCreate() {
    const label = query.trim(); if (!label) return;
    createFacet({ facet, value: label }, { onSuccess: () => {
      if (mode === 'multi') onChange([...(values as string[]), label]); else onChange(label);
      setQuery(''); setOpen(false);
    }});
  }

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Selected chips / input trigger */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-gray-300 bg-white dark:bg-slate-900 px-2 py-1.5 text-gray-900 dark:text-slate-100">
        {values.map(v => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-2 py-0.5 text-xs">
            {v}
            <button type="button" className="text-gray-500 hover:text-gray-700" onClick={() => remove(v)} aria-label={`Remove ${v}`}>×</button>
          </span>
        ))}
        <Combobox value={values} onChange={(val: any) => { /* handled manually via toggle */ }}>
          <div className="flex-1 min-w-[8rem]">
            <Combobox.Input
              value={query}
              className="w-full bg-transparent outline-none text-sm px-1 select-text text-gray-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
              placeholder={values.length === 0 ? placeholder : ''}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); setOpen(false); } }}
            />
          </div>
          {open && (
            <button type="button" aria-label="Close" className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600" onClick={() => setOpen(false)}>×</button>
          )}
          <Transition as={Fragment} show={open} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <Combobox.Options static className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1 text-sm shadow-lg">
              {isLoading ? (
                <div className="px-3 py-2 text-gray-500">Loading…</div>
              ) : (
                <>
                  {options.length === 0 && !canCreate && (
                    <div className="px-3 py-2 text-gray-500">No results</div>
                  )}
                  {options.map(opt => (
                    <Combobox.Option key={opt.value} value={opt.value} as={Fragment}>
                      {({ active }) => (
                        <button type="button" onClick={() => toggle(opt.value)} className={`w-full px-3 py-2 flex items-center justify-between ${active ? 'bg-gray-100 dark:bg-slate-800' : ''}`}>
                          <span className="truncate">{opt.value}</span>
                          <span className="text-xs text-gray-500">{opt.count}</span>
                        </button>
                      )}
                    </Combobox.Option>
                  ))}
                  {canCreate && (
                    <div className="border-t border-gray-100 dark:border-slate-800 mt-1 pt-1">
                      <button type="button" disabled={isCreating} onClick={handleCreate} className="w-full text-left px-3 py-2 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
                        + Create "{query.trim()}"
                      </button>
                    </div>
                  )}
                </>
              )}
            </Combobox.Options>
          </Transition>
        </Combobox>
      </div>
    </div>
  );
}
