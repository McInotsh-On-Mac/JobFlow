"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import styles from "./BrandLogo.module.css";

type BrandLogoProps = {
  href?: string | null;
  size?: "small" | "medium" | "large";
  priority?: boolean;
  asset?: "image" | "video";
};

export default function BrandLogo({
  href = "/",
  size = "small",
  priority = false,
  asset = "image",
}: BrandLogoProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const width = size === "large" ? 420 : size === "medium" ? 220 : 220;
  const height = size === "large" ? 229 : size === "medium" ? 120 : 120;
  const sizeClass = size === "large" ? styles.large : size === "medium" ? styles.medium : styles.small;
  const className = `${styles.logo} ${sizeClass}`;

  useEffect(() => {
    if (asset !== "video") return;

    const video = videoRef.current;
    if (!video) return;

    const ensurePlayback = () => {
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute("muted", "");
      video.setAttribute("autoplay", "");
      video.setAttribute("playsinline", "");
      video.removeAttribute("controls");
      void video.play().catch(() => {});
    };

    const onVisibilityChange = () => {
      if (!document.hidden) ensurePlayback();
    };

    ensurePlayback();
    const retryId = window.setInterval(() => {
      if (video.paused) ensurePlayback();
    }, 700);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(retryId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [asset]);

  const logo =
    asset === "video" ? (
      <span className={`${className} ${styles.videoFrame}`}>
        <video
          ref={videoRef}
          className={styles.video}
          autoPlay
          loop
          muted
          playsInline
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
          preload="auto"
          onLoadedMetadata={(event) => {
            const video = event.currentTarget;
            video.muted = true;
            void video.play().catch(() => {});
          }}
          onLoadedData={(event) => {
            const video = event.currentTarget;
            video.muted = true;
            void video.play().catch(() => {});
          }}
          onCanPlay={(event) => {
            const video = event.currentTarget;
            video.muted = true;
            void video.play().catch(() => {});
          }}
          onCanPlayThrough={(event) => {
            const video = event.currentTarget;
            video.muted = true;
            void video.play().catch(() => {});
          }}
          onPause={(event) => {
            const video = event.currentTarget;
            void video.play().catch(() => {});
          }}
          onClick={(event) => {
            event.preventDefault();
          }}
          aria-label="JobFlow logo animation"
        >
          <source src="/jobflow-logo-reveal.mp4" type="video/mp4" />
        </video>
      </span>
    ) : (
      <Image
        src="/jobflow-logo.png"
        alt="JobFlow"
        width={width}
        height={height}
        className={className}
        priority={priority}
      />
    );

  if (!href) {
    return <span className={styles.standalone}>{logo}</span>;
  }

  return (
    <Link href={href} className={styles.link} aria-label="JobFlow">
      {logo}
    </Link>
  );
}
