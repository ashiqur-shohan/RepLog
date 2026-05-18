"use client";

import { Dumbbell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface Props {
  mediaUrl: string | null;
  mediaType: "gif" | "mp4" | "webm" | null;
  thumbnailUrl: string | null;
  name: string;
  className?: string;
  autoplay?: boolean;
}

export function ExerciseMedia({
  mediaUrl,
  mediaType,
  thumbnailUrl,
  name,
  className,
  autoplay = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(autoplay);

  useEffect(() => {
    if (autoplay) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [autoplay]);

  const placeholder = (
    <div className="grid place-items-center w-full h-full bg-muted text-muted-foreground">
      <Dumbbell className="size-8 opacity-50" aria-hidden />
    </div>
  );

  return (
    <div ref={ref} className={cn("relative overflow-hidden bg-muted", className)}>
      {!mediaUrl ? (
        placeholder
      ) : mediaType === "gif" ? (
        // biome-ignore lint/a11y/useAltText: alt is provided via name
        <img src={inView ? mediaUrl : (thumbnailUrl ?? mediaUrl)} alt={name} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        // For mp4/webm
        <video
          autoPlay={inView}
          loop
          muted
          playsInline
          poster={thumbnailUrl ?? undefined}
          className="w-full h-full object-cover"
          aria-label={name}
        >
          <source src={mediaUrl} type={`video/${mediaType ?? "mp4"}`} />
        </video>
      )}
    </div>
  );
}
