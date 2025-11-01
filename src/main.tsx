import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import './index.css';
import { AppAuthProvider } from './auth/AuthProvider';
import App from './app/App';

async function prepareMocks() {
  if (import.meta.env.VITE_MOCK_API === 'true') {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}

function showSigninToast(message = 'You need to sign in') {
  toast.custom((t) => (
    <div className="card px-3 py-2 flex items-center gap-3">
      <span className="text-sm text-gray-800">{message}</span>
      <button
        className="btn-primary px-3 py-1.5 rounded-md text-sm"
        onClick={() => {
          window.dispatchEvent(new CustomEvent('app-auth-login'));
          toast.dismiss(t.id);
        }}
      >
        Sign in
      </button>
    </div>
  ));
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (e: any) => {
      if (e?.status === 401) { showSigninToast('Session required'); return; }
      toast.error(e?.message || 'Request failed');
    },
  }),
  mutationCache: new MutationCache({
    onError: (e: any) => {
      if (e?.status === 401) { showSigninToast('Please sign in to continue'); return; }
      toast.error(e?.message || 'Action failed');
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      refetchOnWindowFocus: false,
    },
  },
});

// Persist the query cache in localStorage for offline/longer persistence.
// Note: We intentionally exclude some sensitive/fast-changing queries
// (e.g. 'user:profile') from persistence below to avoid stale identity data.
const PERSIST_KEY = 'APP_RQ_CACHE';
const persister = createSyncStoragePersister({ storage: window.localStorage, key: PERSIST_KEY });
const CACHE_MAX_AGE = 1000 * 60 * 60 * 24; // 24h
const CACHE_BUSTER = (import.meta.env.VITE_CACHE_BUSTER as string | undefined) ?? 'v1';

prepareMocks().finally(() => {
  // Clear in-memory React Query cache on logout events to avoid cross-account leakage.
  try {
    window.addEventListener('app-cache-clear', () => {
      queryClient.clear();
    });
  } catch {}

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <AppAuthProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister,
            maxAge: CACHE_MAX_AGE,
            buster: CACHE_BUSTER,
            // Do not persist identity-sensitive queries like 'user:profile'
            dehydrateOptions: {
              // Avoid persisting identity and fast-evolving metadata (muscle map)
              shouldDehydrateQuery: (q) => !['user:profile','exercises:muscle-map'].includes(String(q.queryKey?.[0])) ,
            },
          }}
        >
          <BrowserRouter>
            <App />
          </BrowserRouter>
          <Toaster position="top-right" />
        </PersistQueryClientProvider>
      </AppAuthProvider>
    </React.StrictMode>
  );
});
