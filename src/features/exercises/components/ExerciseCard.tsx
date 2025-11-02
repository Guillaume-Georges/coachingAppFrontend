import { Link } from 'react-router-dom';
import { Tag } from './Tag';

type ExerciseListItem = { id: string; name?: string; thumbnailUrl?: string; modality?: string; bodyPartFocus?: string; category?: string; tags?: string[]; };

export function ExerciseCard({ item, onEdit, onHover }: { item: ExerciseListItem; onEdit?: (it: any) => void; onHover?: () => void }) {
  const pills: { key: string; label: string; tone?: 'neutral'|'info'|'success'|'warning' }[] = [];
  if (item.bodyPartFocus) pills.push({ key: 'bpf', label: item.bodyPartFocus, tone: 'success' });
  if (item.modality) pills.push({ key: 'mod', label: item.modality, tone: 'info' });
  if (item.category) pills.push({ key: 'cat', label: item.category, tone: 'warning' });
  (item.tags || []).forEach((t, i) => pills.push({ key: `tag-${i}-${t}`, label: t, tone: 'neutral' }));
  const MAX = 4;
  const visible = pills.slice(0, MAX);
  const hidden = pills.slice(MAX);
  return (
    <li className="card overflow-hidden transition-shadow ring-1 ring-transparent hover:ring-gray-200 dark:hover:ring-slate-800 hover:shadow-md">
      <div className="flex items-center gap-4 p-3 sm:p-4">
        <Link to={`/exercises/${item.id}`} className="flex items-center gap-4 flex-1 min-w-0" onMouseEnter={onHover}>
          {item.thumbnailUrl ? (
            <img src={item.thumbnailUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-gray-100" aria-hidden />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100 truncate">{item.name || 'Exercise'}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {visible.map((p) => (
                <Tag key={p.key} tone={p.tone}>{p.label}</Tag>
              ))}
              {hidden.length > 0 && (
                <Tag
                  tone="neutral"
                  className="cursor-default"
                  title={hidden.map((p) => p.label).join(', ')}
                  ariaLabel={`+${hidden.length} more: ${hidden.map((p) => p.label).join(', ')}`}
                >
                  +{hidden.length}
                </Tag>
              )}
            </div>
          </div>
        </Link>
        {onEdit ? (
          <button className="btn-ghost px-2 py-1.5 text-sm" onClick={() => onEdit(item as any)}>Edit</button>
        ) : (
          <span aria-hidden className="text-slate-500">›</span>
        )}
      </div>
    </li>
  );
}



