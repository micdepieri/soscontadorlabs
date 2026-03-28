"use client";

interface Props {
  url: string;
  title: string;
}

function getEmbedUrl(url: string): string {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // Loom
  const loomMatch = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
  if (loomMatch) {
    return `https://www.loom.com/embed/${loomMatch[1]}`;
  }

  // Wistia
  const wistiaMatch = url.match(/(?:wistia\.com|wi\.st)\/(?:medias|embed)\/([a-zA-Z0-9]+)/);
  if (wistiaMatch) {
    return `https://fast.wistia.net/embed/iframe/${wistiaMatch[1]}`;
  }

  // Generic direct video link (MP4, WebM)
  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return url;
  }

  // Already an embed URL or fallback
  return url;
}

export default function VideoEmbed({ url, title }: Props) {
  const isDirectVideo = !!url.match(/\.(mp4|webm|ogg)$/i);
  const embedUrl = getEmbedUrl(url);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-lg ring-1 ring-white/10">
      {isDirectVideo ? (
        <video
          src={url}
          controls
          className="absolute inset-0 h-full w-full"
          title={title}
        >
          Seu navegador não suporta a exibição de vídeos.
        </video>
      ) : (
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
          frameBorder="0"
        />
      )}
    </div>
  );
}
