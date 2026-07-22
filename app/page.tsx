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
import { GraduationCap, CopyIcon, CheckIcon } from "lucide-react";

type SourceMeta = {
  module: string;
  title: string;
  startTime: string;
  endTime: string;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <MessageAction
      tooltip={copied ? "Copied!" : "Copy"}
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
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col">
      <Conversation>
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<GraduationCap className="size-8" />}
              title="Ask Class Buddy anything"
              description="Ask about any concept covered in your recorded lectures — answers are grounded in the actual transcript, with sources."
            />
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

              return (
                <Message from={m.role} key={m.id}>
                  <MessageContent>
                    <MessageResponse>{text}</MessageResponse>

                    {sourcesPart && sourcesPart.data.sources.length > 0 && (
                      <Sources>
                        <SourcesTrigger
                          count={sourcesPart.data.sources.length}
                        />
                        <SourcesContent>
                          {sourcesPart.data.sources.map((s, i) => (
                            <div
                              key={i}
                              className="flex flex-col gap-0.5 rounded-md border px-3 py-2"
                            >
                              <span className="text-xs font-medium text-primary">
                                {s.module}
                              </span>
                              <span className="text-sm font-medium text-foreground">
                                {s.title}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(s.startTime)} –{" "}
                                {formatTimestamp(s.endTime)}
                              </span>
                            </div>
                          ))}
                        </SourcesContent>
                      </Sources>
                    )}

                    {m.role === "assistant" && text && !isLoading && (
                      <MessageActions>
                        <CopyButton text={text} />
                      </MessageActions>
                    )}
                  </MessageContent>
                </Message>
              );
            })
          )}

          {isLoading && (
            <Message from="assistant">
              <MessageContent>
                <Loader />
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t p-4">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea placeholder="Ask about a lecture..." />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputSubmit status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
