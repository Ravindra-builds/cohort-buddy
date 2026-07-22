"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();

  const isLoading = status === "submitted" || status === "streaming";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  }

  return (
    <div className="mx-auto flex h-screen max-w-2xl flex-col p-4">
      <h1 className="mb-4 text-xl font-semibold">Cohort-buddy</h1>

      <ScrollArea className="flex-1 rounded-md border p-4">
        <div className="flex flex-col gap-4">
          {messages.map((m) => {
            const text = m.parts
              .filter(
                (p): p is { type: "text"; text: string } => p.type === "text",
              )
              .map((p) => p.text)
              .join("");

            const sourcesPart = m.parts.find(
              (
                p,
              ): p is {
                type: "data-sources";
                data: {
                  sources: {
                    module: string;
                    title: string;
                    startTime: string;
                    endTime: string;
                  }[];
                };
              } => p.type === "data-sources",
            );

            return (
              <Card
                key={m.id}
                className={`p-3 ${
                  m.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "mr-auto"
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{text}</p>
                {sourcesPart && sourcesPart.data.sources.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p className="font-medium">Sources:</p>
                    <ul className="list-disc pl-4">
                      {sourcesPart.data.sources.map((s, i) => (
                        <li key={i}>
                          {s.module} — {s.title} ({s.startTime}–{s.endTime})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            );
          })}

          {isLoading && (
            <p className="text-sm text-muted-foreground">Thinking...</p>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a lecture..."
        />
        <Button type="submit" disabled={isLoading}>
          Send
        </Button>
      </form>
    </div>
  );
}
