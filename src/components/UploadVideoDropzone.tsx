import { useState, useRef } from 'react';
import { useApi } from '../api';

type Props = { onUploaded: (info: { publicId: string; secureUrl: string; posterUrl: string; hlsUrl: string }) => void };

export function UploadVideoDropzone({ onUploaded }: Props) {
  const api = useApi();
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function chooseLocalFile() {
    inputRef.current?.click();
  }

  async function onFile(file: File) {
    try {
      setError(null); setProgress(0);
      // Ask backend for a Cloudinary signature
      const sig: any = await api.post('/api/uploads/signature', { resourceType: 'video' } as any);
      const cloudName = sig.cloudName; const apiKey = sig.apiKey; const signature = sig.signature; const timestamp = sig.timestamp; const folder = sig.folder;
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;
      const data = new FormData();
      data.append('file', file);
      data.append('api_key', apiKey);
      data.append('timestamp', String(timestamp));
      data.append('signature', signature);
      if (folder) data.append('folder', folder);
      // Perform xhr to track progress
      const xhr = new XMLHttpRequest();
      const resP = new Promise<any>((resolve, reject) => {
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)); };
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText)); else reject(new Error('Upload failed'));
          }
        };
        xhr.open('POST', uploadUrl, true);
        xhr.send(data);
      });
      const res = await resP;
      const publicId = res.public_id as string;
      const secureUrl = res.secure_url as string;
      const cloud = cloudName;
      const hlsUrl = `https://res.cloudinary.com/${cloud}/video/upload/sp_auto/${publicId}.m3u8`;
      const posterUrl = `https://res.cloudinary.com/${cloud}/video/upload/so_1/${publicId}.jpg`;
      onUploaded({ publicId, secureUrl, posterUrl, hlsUrl });
    } catch (e: any) {
      setError(e?.message || 'Upload failed');
    } finally {
      setProgress(null); setDragging(false);
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0]; if (file) onFile(file);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`rounded-2xl border-2 border-dashed p-6 text-center ${dragging ? 'border-brand-600 bg-brand-50/40 dark:bg-emerald-500/5' : 'border-gray-300 dark:border-slate-700'}`}
    >
      <input ref={inputRef} type="file" accept="video/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      <p className="text-sm text-gray-600 dark:text-slate-300">Drag & drop a video file here, or</p>
      <button type="button" className="btn-primary px-3 py-1.5 mt-2" onClick={chooseLocalFile}>Choose file</button>
      {progress !== null && <div className="mt-3 text-sm">Uploading… {progress}%</div>}
      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
    </div>
  );
}

