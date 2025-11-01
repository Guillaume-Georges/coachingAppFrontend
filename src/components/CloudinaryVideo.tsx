const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const urlHls = (publicId: string) => `https://res.cloudinary.com/${cloud}/video/upload/${publicId}.m3u8`;

export function CloudVideo({ publicId, poster }: { publicId: string; poster?: string }) {
  const source = cloud ? urlHls(publicId) : undefined;
  return (
    <div className="w-full">
      <video controls playsInline poster={poster} style={{ width: '100%' }}>
        {source && <source src={source} type="application/vnd.apple.mpegurl" />}
      </video>
    </div>
  );
}

