import { useEffect, useState } from 'react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';

declare global { interface Window { cloudinary?: any } }

export function CloudinaryUploadButton({ label = 'Upload', onUploaded, className, variant = 'button' }: { label?: string; onUploaded: (url: string, info?: any) => void; className?: string; variant?: 'button'|'icon' }) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;
  const enabled = !!cloudName && !!uploadPreset;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    if (window.cloudinary) return;
    const s = document.createElement('script'); s.src = 'https://widget.cloudinary.com/v2.0/global/all.js'; s.async = true;
    s.onload = () => setLoading(false); s.onerror = () => setLoading(false);
    setLoading(true);
    document.body.appendChild(s);
    return () => { document.body.removeChild(s); };
  }, [enabled]);

  function openWidget() {
    if (!enabled || !window.cloudinary) return;
    const widget = window.cloudinary.createUploadWidget({ cloudName, uploadPreset, sources: ['local','url','camera'] }, (error: any, result: any) => {
      if (!error && result && result.event === 'success') {
        onUploaded(result.info.secure_url, result.info);
      }
    });
    widget.open();
  }

  if (!enabled) return null;

  if (variant === 'icon') {
    return (
      <button type="button" aria-label={label} className={className || 'rounded-full bg-white/90 text-gray-700 hover:bg-white p-2 shadow border'} onClick={openWidget} disabled={loading}>
        <ArrowUpTrayIcon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button type="button" className={className || 'btn-ghost px-3 py-2'} onClick={openWidget} disabled={loading}>{label}</button>
  );
}
