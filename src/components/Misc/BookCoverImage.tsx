"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./assets/styles/thorium-web.bookCoverImage.module.css";

function titleHue(title: string): number {
  let h = 0;
  for (let i = 0; i < title.length; i++) {
    h = (((h << 5) - h) + title.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

export interface BookCoverImageProps {
  src: string;
  title: string;
  author?: string;
  sizes?: string;
  className?: string;
}

export function BookCoverImage({ src, title, author, sizes, className }: BookCoverImageProps) {
  const [failed, setFailed] = useState(!src);

  if (failed) {
    const hue = titleHue(title);
    const bg = `linear-gradient(150deg, hsl(${hue} 42% 36%), hsl(${(hue + 28) % 360} 52% 22%))`;
    return (
      <div className={className} style={{ position: "absolute", inset: 0, background: bg }} aria-hidden="true">
        <div className={styles.placeholder}>
          <span className={styles.title}>{title}</span>
          {author && <span className={styles.author}>{author}</span>}
        </div>
      </div>
    );
  }

  return (
    <Image
      className={className}
      src={src}
      alt=""
      fill
      sizes={sizes ?? "140px"}
      style={{ objectFit: "cover" }}
      onError={() => setFailed(true)}
    />
  );
}
