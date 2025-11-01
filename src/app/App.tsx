import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth, RequireRole } from '../auth/guards';
import { AppShell } from './Shell';
import React, { Suspense, lazy } from 'react';

const ExercisesPage = lazy(() => import('../features/exercises/ExercisesPage'));
const ExerciseDetailPage = lazy(() => import('../features/exercises/ExerciseDetailPage'));
const LoginPage = lazy(() => import('../features/auth/LoginPage'));
const SignUpPage = lazy(() => import('../features/auth/SignUpPage'));
const ProfilePage = lazy(() => import('../features/user/ProfilePage'));
const HomePage = lazy(() => import('../features/home/HomePage'));
const MembersPage = lazy(() => import('../features/admin/MembersPage'));

export default function App() {
  return (
    <AppShell>
      <Suspense fallback={<div className="text-sm text-gray-500">Loading…</div>}>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/exercises" element={<ExercisesPage />} />
        <Route path="/exercises/:id" element={<ExerciseDetailPage />} />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/admin/members" element={<RequireRole role="admin"><MembersPage /></RequireRole>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </AppShell>
  );
}
