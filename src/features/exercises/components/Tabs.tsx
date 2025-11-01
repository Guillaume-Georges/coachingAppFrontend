import { useState } from 'react';

export function Tabs({ tabs }: { tabs: { id: string; label: string; content: React.ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  return (
    <div>
      <div
        role="tablist"
        aria-label="Sections"
        className="inline-flex rounded-2xl p-1 bg-gray-100 dark:bg-slate-800"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={active === t.id}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
              active === t.id
                ? 'bg-brand-600 text-white'
                : 'bg-transparent text-gray-700 hover:bg-gray-200 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tabs.map((t) => (
          <div key={t.id} role="tabpanel" hidden={active !== t.id}>
            {t.content}
          </div>
        ))}
      </div>
    </div>
  );
}
