import clsx from 'clsx';

export function Tag({
  children,
  tone = 'neutral',
  title,
  className,
  ariaLabel,
}: {
  children: React.ReactNode;
  tone?: 'neutral'|'info'|'success'|'warning';
  title?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const styles = {
    neutral: 'border-gray-200 bg-gray-50 text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
    info: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-300',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-500/10 dark:text-emerald-300',
    warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400 dark:bg-amber-500/10 dark:text-amber-300',
  }[tone];
  return (
    <span
      className={clsx('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', styles, className)}
      title={title}
      aria-label={ariaLabel}
    >
      {children}
    </span>
  );
}
