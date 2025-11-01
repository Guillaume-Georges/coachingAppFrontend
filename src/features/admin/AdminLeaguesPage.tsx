import { useEffect, useState } from 'react';
import { useApi } from '../../api';

export default function AdminLeaguesPage() {
  const api = useApi();
  const [members, setMembers] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);

  useEffect(() => {
    api.get<any>('/admin/leagues/members').then(setMembers);
    api.get<any>('/admin/leagues/coaches').then(setCoaches);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Admin • Leagues</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card"><div className="card-body">
          <h2 className="font-semibold mb-2">Member Leagues</h2>
          <ul className="text-sm">
            {members.map((l: any) => (
              <li key={l.id} className="flex justify-between border-t py-2"><span>{l.name}</span><span>{l.min_points}–{l.max_points}</span></li>
            ))}
          </ul>
        </div></div>
        <div className="card"><div className="card-body">
          <h2 className="font-semibold mb-2">Coach Leagues</h2>
          <ul className="text-sm">
            {coaches.map((l: any) => (
              <li key={l.id} className="flex justify-between border-t py-2"><span>{l.name}</span><span>{l.min_points}–{l.max_points}</span></li>
            ))}
          </ul>
        </div></div>
      </div>
    </div>
  );
}
