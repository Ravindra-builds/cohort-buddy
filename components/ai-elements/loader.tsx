"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const THINKING_MESSAGES = [
  "Searching the transcripts...",
  "Cross-checking the lectures...",
  "Lining up timestamps...",
  "Almost there...",
];

export function Loader() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % THINKING_MESSAGES.length);
    }, 1600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Sparkles className="size-4 animate-pulse text-primary" />
      <span>{THINKING_MESSAGES[index]}</span>
      <span className="flex gap-0.5">
        <span className="size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
        <span className="size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
        <span className="size-1 animate-bounce rounded-full bg-muted-foreground" />
      </span>
    </div>
  );
}