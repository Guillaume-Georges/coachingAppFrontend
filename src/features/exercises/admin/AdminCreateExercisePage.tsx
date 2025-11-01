import { AdminFormExercise } from './AdminFormExercise';

export default function AdminCreateExercisePage() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create Exercise</h1>
      <div className="card p-6">
        <AdminFormExercise />
      </div>
    </div>
  );
}

