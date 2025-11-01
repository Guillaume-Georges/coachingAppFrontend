import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { z } from 'zod';
import { Block } from '../../api/models';
import { useApi } from '../../api';
import toast from 'react-hot-toast';

const BlocksSchema = z.array(Block);

export default function SessionBuilderPage() {
  const { id } = useParams();
  const api = useApi();
  const [json, setJson] = useState('[\n  { "type": "warmup", "items": [{ "name": "Air Squats", "reps": 10 }] }\n]');
  const [error, setError] = useState<string | null>(null);

  function validate() {
    try { BlocksSchema.parse(JSON.parse(json)); setError(null); return true; } catch (e: any) { setError(e.message); return false; }
  }

  async function save() {
    if (!validate()) return;
    await api.post(`/coach/programs/${id}/sessions`, { blocks: JSON.parse(json) });
    toast.success('Session saved');
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Session Builder (Program {id})</h1>
      <div className="card"><div className="card-body space-y-3">
        <textarea value={json} onChange={(e)=>setJson(e.target.value)} className="w-full h-64 font-mono text-sm rounded-lg border p-2" />
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="flex gap-2">
          <button className="btn-ghost px-3 py-2" onClick={validate}>Validate</button>
          <button className="btn-primary px-3 py-2" onClick={save}>Save Session</button>
        </div>
      </div></div>
    </div>
  );
}

