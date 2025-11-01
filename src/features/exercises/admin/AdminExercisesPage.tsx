import { useSearchParams } from 'react-router-dom';
import { useExercisesQuery } from '../api';
import { useState } from 'react';
import { AdminFormExercise } from './AdminFormExercise';
import { useAdminExerciseMutations } from '../api';

export default function AdminExercisesPage() {
  const [params] = useSearchParams(new URLSearchParams({ page: '1', limit: '20' }));
  const { data, isLoading } = useExercisesQuery(params);
  const [open, setOpen] = useState(false);
  const { del } = useAdminExerciseMutations();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin · Exercises</h1>
        <button className="btn-primary px-4 py-2 rounded-xl" onClick={() => setOpen(true)}>New Exercise</button>
      </div>
      {isLoading ? <div>Loading…</div> : (
        <table className="min-w-full bg-white rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-gray-50 text-left text-sm text-gray-500">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Modality</th>
              <th className="px-4 py-2">Updated</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {data?.items.map(it => (
              <tr key={it.id} className="border-t">
                <td className="px-4 py-2">{it.name}</td>
                <td className="px-4 py-2">{it.modality}</td>
                <td className="px-4 py-2 text-sm text-gray-500">{new Date(it.updatedAt).toLocaleString()}</td>
                <td className="px-4 py-2 text-right">
                  <button className="btn-ghost px-2" onClick={() => del.mutate(it.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Create Exercise</h2>
            <AdminFormExercise onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

