import { useRef, useState } from 'react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { useApi } from '../api';

export function UploadImageButton({ label = 'Upload', onUploaded, className, variant = 'icon', signaturePath = '/api/uploads/signature' }: { label?: string; onUploaded: (url: string, info?: any) => void; className?: string; variant?: 'button'|'icon'; signaturePath?: string }) {
  const api = useApi();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);

  async function chooseFile() {
    inputRef.current?.click();
  }

  async function onFile(file: File) {
    try {
      setLoading(true);
      const sig: any = await api.post(signaturePath, { resourceType: 'image' } as any);
      const cloudName = sig.cloudName; const apiKey = sig.apiKey; const signature = sig.signature; const timestamp = sig.timestamp; const folder = sig.folder; const resourceType = sig.resourceType || 'image';
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
      const data = new FormData();
      data.append('file', file);
      data.append('api_key', apiKey);
      data.append('timestamp', String(timestamp));
      data.append('signature', signature);
      if (folder) data.append('folder', folder);
      const xhr = new XMLHttpRequest();
      const resP = new Promise<any>((resolve, reject) => {
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText)); else reject(new Error('Upload failed'));
          }
        };
        xhr.open('POST', uploadUrl, true);
        xhr.send(data);
      });
      const res = await resP;
      onUploaded(res.secure_url as string, res);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  if (variant === 'icon') {
    return (
      <>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        <button type="button" aria-label={label} className={className || 'rounded-full bg-white/90 text-gray-700 hover:bg-white p-2 shadow border'} onClick={chooseFile} disabled={loading}>
          <ArrowUpTrayIcon className="h-4 w-4" />
        </button>
      </>
    );
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      <button type="button" className={className || 'btn-ghost px-3 py-2'} onClick={chooseFile} disabled={loading}>{label}</button>
    </>
  );
}
