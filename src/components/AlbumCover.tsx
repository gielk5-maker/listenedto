"use client";

import Image from "next/image";
import { useState } from "react";

export default function AlbumCover({
  src,
  alt,
  fill,
  width,
  height,
  sizes,
  priority,
  className,
}: {
  src: string | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const [fout, setFout] = useState(false);

  if (!src || fout) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-zinc-800 text-3xl ${className ?? ""}`}>
        💿
      </div>
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={className}
        onError={() => setFout(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 300}
      height={height ?? 300}
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setFout(true)}
    />
  );
}
