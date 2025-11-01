export class ApiError extends Error {
  status: number; code?: string; details?: unknown;
  constructor(status: number, body: any) {
    super(body?.error?.message || 'API Error');
    this.status = status;
    this.code = body?.error?.code;
    this.details = body?.error?.details;
  }
}

export function createApi(getToken: () => Promise<string | undefined>) {
  const base = (import.meta.env.VITE_MOCK_API === 'true') ? '' : ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '');
  // Simple in-memory ETag cache for GETs
  const etagCache = new Map<string, { etag?: string; body: any }>();

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const url = `${base}${path}`;
    const isGet = !init.method || init.method === 'GET';
    const cached = etagCache.get(url);

    async function doFetch(tok?: string) {
      const headers: Record<string, string> = {
        'content-type': 'application/json',
        ...(tok ? { authorization: `Bearer ${tok}` } : {}),
        ...(init.headers as any || {}),
      };
      // If we have an ETag for this URL, send it to leverage 304
      if (isGet && cached?.etag && !headers['If-None-Match'] && !headers['if-none-match']) {
        headers['If-None-Match'] = cached.etag;
      }
      return fetch(url, {
        ...init,
        credentials: 'include',
        headers,
      });
    }
    let token = await getToken();
    let res = await doFetch(token);
    if (res.status === 304 && isGet && cached) {
      // Serve from local cache when not modified
      return cached.body as T;
    }
    if (res.status === 401) {
      token = await getToken();
      res = await doFetch(token);
    }
    if (res.status === 304 && isGet && cached) {
      return cached.body as T;
    }
    const text = await res.text();
    const body = text ? JSON.parse(text) : {};
    if (!res.ok) throw new ApiError(res.status, body);
    const data = (body?.data ?? body) as T;
    if (isGet) {
      const etag = res.headers.get('ETag') || res.headers.get('etag') || undefined;
      if (etag) etagCache.set(url, { etag, body: data });
    }
    return data;
  }

  return {
    get: <T>(p: string) => request<T>(p),
    post: <T>(p: string, b?: any) => request<T>(p, { method: 'POST', body: JSON.stringify(b) }),
    put:  <T>(p: string, b?: any) => request<T>(p, { method: 'PUT',  body: JSON.stringify(b) }),
    patch:<T>(p: string, b?: any) => request<T>(p, { method: 'PATCH', body: JSON.stringify(b) }),
    del:  <T>(p: string) => request<T>(p, { method: 'DELETE' }),
  };
}
