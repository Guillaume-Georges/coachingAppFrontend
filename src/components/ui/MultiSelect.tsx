import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';

type Option = { value: string; label: string };

export function MultiSelect({
  value,
  options,
  onChange,
  placeholder = 'Select',
}: {
  value: string[];
  options: Option[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const selectedSet = new Set(value);

  const display = value.length === 0
    ? placeholder
    : value.length <= 2
      ? options.filter(o => selectedSet.has(o.value)).map(o => o.label).join(', ')
      : `${value.length} selected`;

  return (
    <Listbox value={value} onChange={onChange} multiple>
      <div className="relative">
        <Listbox.Button className="w-full rounded-xl border border-gray-300 bg-white dark:bg-slate-900 px-3 py-2 pr-10 text-left text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 ring-brand-600">
          <span className="block truncate">{display}</span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </span>
        </Listbox.Button>
        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1 text-sm shadow-xl focus:outline-none">
            {options.map(opt => (
              <Listbox.Option
                key={opt.value}
                value={opt.value}
                as={Fragment}
              >
                {({ active, selected }) => (
                  <li className={`${active ? 'bg-gray-100 dark:bg-slate-800' : ''} cursor-default select-none relative px-3 py-2 flex items-center gap-2`}>
                    <span className={`flex-1 block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{opt.label}</span>
                    {selected ? (
                      <CheckIcon className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                    ) : null}
                  </li>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
}

