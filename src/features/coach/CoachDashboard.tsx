import { Link } from 'react-router-dom';

export default function CoachDashboard() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Coach Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card"><div className="card-body">
          <h2 className="font-semibold">Analytics</h2>
          <p className="text-sm text-gray-600">Charts and KPIs for your programs.</p>
        </div></div>
        <div className="card"><div className="card-body">
          <h2 className="font-semibold">Programs</h2>
          <p className="text-sm text-gray-600">Create or update your training programs.</p>
          <Link to="/coach/programs" className="btn-primary inline-flex px-3 py-1.5 mt-3">Manage Programs</Link>
        </div></div>
      </div>
    </div>
  );
}
