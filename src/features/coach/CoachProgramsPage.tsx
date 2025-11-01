import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../api';

export default function CoachProgramsPage() {
  const api = useApi();
  const [programs, setPrograms] = useState<any[]>([]);
  const [title, setTitle] = useState('');

  useEffect(() => {
    api.get<any>('/coach/me/programs').then(setPrograms);
  }, []);

  async function createProgram() {
    if (!title) return;
    const created = await api.post<any>('/coach/programs', { title });
    setPrograms((s) => [...s, created]);
    setTitle('');
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Your Programs</h1>
      <div className="card"><div className="card-body space-y-3">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium">Title</label>
            <input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full rounded-lg border p-2 text-sm" />
          </div>
          <button className="btn-primary px-3 py-2" onClick={createProgram}>Create</button>
        </div>
      </div></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {programs.map((p) => (
          <div key={p.id} className="card"><div className="card-body">
            <div className="font-medium">{p.title}</div>
            <Link to={`/coach/programs/${p.id}/sessions/new`} className="btn-ghost inline-flex px-3 py-1.5 mt-2">Add Session</Link>
          </div></div>
        ))}
      </div>
    </div>
  );
}
