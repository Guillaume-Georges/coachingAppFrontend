import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
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

prepareMocks().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <AppAuthProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
          <Toaster position="top-right" />
        </QueryClientProvider>
      </AppAuthProvider>
    </React.StrictMode>
  );
});
