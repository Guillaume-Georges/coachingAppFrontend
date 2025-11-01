import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useFilters, useFacetOptions } from '../api';
import { useSearchParams } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

function Chip({ label, active, onClick, count }: { label: string; active?: boolean; onClick: () => void; count?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!!active}
      className={`px-3 py-1.5 rounded-xl text-sm transition-colors ring-1 ring-inset flex items-center gap-2 ${active ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-gray-700 ring-gray-300 hover:bg-gray-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600 dark:hover:bg-slate-700'}`}
    >
      <span>{label}</span>
      {typeof count === 'number' && (
        <span className={`px-1.5 py-0.5 rounded-md text-[10px] leading-none ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-200'}`}>{count}</span>
      )}
    </button>
  );
}

export function FilterPanel({ open, onClose, staticMode = false }: { open: boolean; onClose: () => void; staticMode?: boolean }) {
  const { data } = useFilters();
  const [params, setParams] = useSearchParams();
  // Show global facet counts independent of current search
  const { data: mFacets } = useFacetOptions('modalities', '');
  const { data: cFacets } = useFacetOptions('categories', '');
  const { data: eFacets } = useFacetOptions('equipment', '');
  const { data: bpfFacets } = useFacetOptions('bodyPartFocus', '');

  function reset() {
    const p = new URLSearchParams();
    setParams(p, { replace: true });
  }

  function setSingle(key: string, value?: string) {
    const p = new URLSearchParams(params);
    if (value) p.set(key, value); else p.delete(key);
    p.set('page', '1');
    setParams(p, { replace: true });
  }
  function toggleMulti(key: string, value: string) {
    const p = new URLSearchParams(params);
    const current = new Set(p.getAll(key));
    if (current.has(value)) current.delete(value); else current.add(value);
    p.delete(key);
    current.forEach(v => p.append(key, v));
    p.set('page', '1');
    setParams(p, { replace: true });
  }

  const body = (
    <div className="w-80 shrink-0 h-full overflow-y-auto bg-white dark:bg-slate-900">
      <div className="sticky top-0 z-10 px-4 sm:px-6 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">Filter exercises</h3>
          <button className="text-sm text-gray-700 hover:underline dark:text-slate-200" onClick={reset}>Reset</button>
        </div>
        <button aria-label="Close filters" className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800" onClick={onClose}><XMarkIcon className="h-5 w-5 text-gray-700 dark:text-slate-200" /></button>
      </div>
      <div className="p-4 sm:p-6 space-y-6">
        <section>
          <h4 className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-2">Modality</h4>
          <div className="flex flex-wrap gap-2">
            {(mFacets || []).map(({ value, count }) => (
              <Chip key={value} label={value} count={count} active={params.get('modality') === value} onClick={() => setSingle('modality', params.get('modality') === value ? undefined : value)} />
            ))}
          </div>
        </section>
        <div className="border-t border-gray-200 dark:border-slate-800" />
        <section>
          <h4 className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-2">Category</h4>
          <div className="flex flex-wrap gap-2">
            {(cFacets || []).map(({ value, count }) => (
              <Chip key={value} label={value} count={count} active={params.get('category') === value} onClick={() => setSingle('category', params.get('category') === value ? undefined : value)} />
            ))}
          </div>
        </section>
        <div className="border-t border-gray-200 dark:border-slate-800" />
        <section>
          <h4 className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-2">Equipment</h4>
          <div className="flex flex-wrap gap-2">
            {(eFacets || data?.equipment?.map(e=>({ value: e, count: 0 })) || []).map(({ value, count }) => (
              <Chip key={value} label={value} count={count} active={params.getAll('equipment').includes(value)} onClick={() => toggleMulti('equipment', value)} />
            ))}
          </div>
        </section>
        <div className="border-t border-gray-200 dark:border-slate-800" />
        <section>
          <h4 className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-2">Body Part Focus</h4>
          <div className="flex flex-wrap gap-2">
            {(bpfFacets || data?.bodyPartFocus?.map(b=>({ value: b, count: 0 })) || []).map(({ value, count }) => (
              <Chip key={value} label={value} count={count} active={params.get('bodyPartFocus') === value} onClick={() => setSingle('bodyPartFocus', params.get('bodyPartFocus') === value ? undefined : value)} />
            ))}
          </div>
        </section>
        <div className="border-t border-gray-200 dark:border-slate-800" />
        <section>
          <h4 className="text-xs font-semibold tracking-wider uppercase text-slate-400 mb-2">Stimulus (muscles)</h4>
          <div className="flex flex-wrap gap-2">
            {data?.muscles?.slice(0, 30).map(m => (
              <Chip key={m} label={m} active={params.getAll('musclesPrimary').includes(m) || params.getAll('musclesSecondary').includes(m)} onClick={() => toggleMulti('musclesPrimary', m)} />
            ))}
          </div>
        </section>
        <div className="pb-6" />
      </div>
    </div>
  );

  if (staticMode) return body;

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>
        <div className="fixed inset-0 flex justify-end">
          <Transition.Child as={Fragment} enter="transform transition ease-out duration-200" enterFrom="translate-x-full" enterTo="translate-x-0" leave="transform transition ease-in duration-150" leaveFrom="translate-x-0" leaveTo="translate-x-full">
            <Dialog.Panel className="bg-white dark:bg-slate-900 h-full shadow-xl">
              {body}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
