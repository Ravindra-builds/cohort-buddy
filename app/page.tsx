"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { formatTimestamp } from "@/lib/formatTimestamp";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import {
  Sources,
  SourcesTrigger,
  SourcesContent,
} from "@/components/ai-elements/sources";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Loader } from "@/components/ai-elements/loader";
import { Sparkles, CopyIcon, CheckIcon, BookOpen, Bot, User } from "lucide-react";

type SourceMeta = {
  module: string;
  title: string;
  startTime: string;
  endTime: string;
};

const SUGGESTED_PROMPTS = [
  "What is Expo Router and how does file-based routing work?",
  "Explain core components vs native components in React Native",
  "How do I set up authentication with Clerk in Expo?",
  "What's the difference between AsyncStorage and SecureStore?",
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <MessageAction
      tooltip={copied ? "Copied!" : "Copy"}
      className="rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? (
        <CheckIcon className="size-3.5" />
      ) : (
        <CopyIcon className="size-3.5" />
      )}
    </MessageAction>
  );
}

export default function ChatPage() {
  const { messages, sendMessage, status } = useChat();
  const isLoading = status === "submitted" || status === "streaming";

  function handleSubmit(message: { text?: string }) {
    if (!message.text?.trim()) return;
    sendMessage({ text: message.text });
  }

  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-3xl flex-col">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-primary/10 blur-[110px]" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-accent/20 blur-[100px]" />
      </div>

      <Conversation className="flex-1 overflow-y-auto">
        <ConversationContent className="gap-6 px-4 py-6 pb-36 md:px-6">
          {messages.length === 0 ? (
            <ConversationEmptyState className="gap-6">
              <div className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-orange-400 shadow-lg shadow-primary/25">
                <BookOpen className="size-8 text-primary-foreground" strokeWidth={1.75} />
                <Sparkles className="absolute -right-2 -top-2 size-6 text-amber-300 drop-shadow" />
              </div>

              <div className="space-y-2">
                <h3 className="bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-2xl font-semibold text-transparent">
                  Ask Cohort Buddy anything on Mobile-Dev
                </h3>
                <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                  Grounded answers from your recorded lectures — with timestamps and sources, every time.
                </p>
              </div>

              <div className="flex w-full max-w-xl flex-col gap-2 pt-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage({ text: prompt })}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3 text-left text-sm text-foreground/80 backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                  >
                    <span>{prompt}</span>
                    <Sparkles className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:text-primary group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((m) => {
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
                  data: { sources: SourceMeta[] };
                } => p.type === "data-sources",
              );

              const isUser = m.role === "user";

              return (
                <div
                  key={m.id}
                  className={`flex w-full items-start gap-3 ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isUser && (
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-orange-400 shadow-sm shadow-primary/20">
                      <Bot className="size-4 text-primary-foreground" />
                    </div>
                  )}

                  <Message from={m.role} className={isUser ? "max-w-[80%]" : "max-w-[85%]"}>
                    <MessageContent
                      className={
                        isUser
                          ? "group-[.is-user]:rounded-2xl group-[.is-user]:rounded-tr-sm group-[.is-user]:bg-gradient-to-br group-[.is-user]:from-primary group-[.is-user]:to-orange-400 group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-primary-foreground group-[.is-user]:shadow-md group-[.is-user]:shadow-primary/20"
                          : "rounded-2xl rounded-tl-sm border border-border/60 bg-card/70 px-4 py-3 shadow-sm backdrop-blur-sm"
                      }
                    >
                      <MessageResponse>{text}</MessageResponse>

                      {sourcesPart && sourcesPart.data.sources.length > 0 && (
                        <Sources>
                          <SourcesTrigger
                            count={sourcesPart.data.sources.length}
                            className="w-fit rounded-full border border-border/50 bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                          />
                          <SourcesContent className="w-full">
                            {sourcesPart.data.sources.map((s, i) => (
                              <div
                                key={i}
                                className="flex flex-col gap-1 rounded-lg border border-border/50 bg-background/60 px-3 py-2 transition-colors hover:border-primary/40"
                              >
                                <span className="w-fit rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                  {s.module}
                                </span>
                                <span className="text-sm font-medium text-foreground">
                                  {s.title}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatTimestamp(s.startTime)} – {formatTimestamp(s.endTime)}
                                </span>
                              </div>
                            ))}
                          </SourcesContent>
                        </Sources>
                      )}

                      {!isUser && text && !isLoading && (
                        <MessageActions>
                          <CopyButton text={text} />
                        </MessageActions>
                      )}
                    </MessageContent>
                  </Message>

                  {isUser && (
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-secondary">
                      <User className="size-4 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex w-full items-start justify-start gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-orange-400 shadow-sm shadow-primary/20">
                <Bot className="size-4 text-primary-foreground" />
              </div>
              <Message from="assistant" className="max-w-[85%]">
                <MessageContent className="rounded-2xl rounded-tl-sm border border-border/60 bg-card/70 px-4 py-3 shadow-sm backdrop-blur-sm">
                  <Loader />
                </MessageContent>
              </Message>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton className="border-primary/30 bg-card/90 text-primary shadow-lg backdrop-blur hover:bg-primary/10" />
      </Conversation>

      <div className="sticky bottom-0 z-20 border-t border-border/60 bg-background/80 p-4 backdrop-blur-xl">
        <PromptInput
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border/70 bg-card/80 shadow-lg shadow-black/5 backdrop-blur-sm transition-shadow focus-within:border-primary/50"
        >
          <PromptInputBody>
            <PromptInputTextarea placeholder="Ask about a lecture..." className="text-[15px]" />
          </PromptInputBody>
          <PromptInputFooter>
            <span className="px-1 text-xs text-muted-foreground">
              Grounded in your course transcripts
            </span>
            <PromptInputSubmit
              status={status}
              className="rounded-full bg-gradient-to-br from-primary to-orange-400 text-primary-foreground shadow-sm hover:brightness-110"
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}