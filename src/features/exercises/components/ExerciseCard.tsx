import { Link } from 'react-router-dom';
import { TExercise } from '../types';
import { Tag } from './Tag';

type ExerciseListItem = { id: string; name?: string; thumbnailUrl?: string; modality?: string; bodyPartFocus?: string; tags?: string[]; };

export function ExerciseCard({ item, onEdit }: { item: ExerciseListItem; onEdit?: (it: any) => void }) {
  return (
    <li className="card overflow-hidden transition-shadow ring-1 ring-transparent hover:ring-gray-200 dark:hover:ring-slate-800 hover:shadow-md">
      <div className="flex items-center gap-4 p-3 sm:p-4">
        <Link to={`/exercises/${item.id}`} className="flex items-center gap-4 flex-1 min-w-0">
          {item.thumbnailUrl ? (
            <img src={item.thumbnailUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-gray-100" aria-hidden />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100 truncate">{item.name || 'Exercise'}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.bodyPartFocus && <Tag tone="success">{item.bodyPartFocus}</Tag>}
              {item.modality && <Tag tone="info">{item.modality}</Tag>}
              {item.tags?.slice(0,2).map((t) => <Tag key={t}>{t}</Tag>)}
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



