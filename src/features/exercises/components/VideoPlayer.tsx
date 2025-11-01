import { useEffect, useRef, useState } from 'react';

export function VideoPlayer({ url, poster }: { url?: string; poster?: string }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [loading, setLoading] = useState<boolean>(!!url);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const v = ref.current; if (!v) return;
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => setLoading(false);
    const onLoaded = () => setLoading(false);
    const onError = () => setError('Failed to load video');
    v.addEventListener('waiting', onWaiting);
    v.addEventListener('canplay', onCanPlay);
    v.addEventListener('loadeddata', onLoaded);
    v.addEventListener('error', onError);
    return () => {
      v.removeEventListener('waiting', onWaiting);
      v.removeEventListener('canplay', onCanPlay);
      v.removeEventListener('loadeddata', onLoaded);
      v.removeEventListener('error', onError);
    };
  }, [url]);

  if (!url) return <div className="aspect-video w-full bg-gray-100 rounded-xl" />;
  return (
    <div className="relative w-full">
      <video
        ref={ref}
        controls
        playsInline
        preload="metadata"
        poster={poster}
        className="w-full rounded-xl bg-black"
        style={{ aspectRatio: '16/9' }}
      >
        <source src={url} />
      </video>
      {loading && !error && (
        <div className="absolute inset-0 grid place-items-center bg-black/20">
          <div className="h-10 w-10 rounded-full border-4 border-white/60 border-t-transparent animate-spin" aria-label="Loading video" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 grid place-items-center text-sm text-red-200 bg-black/40">
          {error}
        </div>
      )}
    </div>
  );
}
