"use client";

import { Message } from "ai";
import { cn } from "@/lib/utils";
import { User, Sparkles, Loader2 } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { ToolCallLabel } from "./ToolCallLabel";

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] px-4 text-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-violet-100 to-blue-100 mb-5">
          <Sparkles className="h-6 w-6 text-violet-600" />
        </div>
        <p className="text-neutral-800 font-medium text-base mb-1.5">What would you like to build?</p>
        <p className="text-neutral-400 text-sm max-w-xs leading-relaxed">Describe a React component and I&apos;ll generate it for you</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto px-5 py-8">
      <div className="space-y-5 max-w-3xl mx-auto w-full">
        {messages.map((message) => (
          <div
            key={message.id || message.content}
            className={cn(
              "flex gap-3",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === "assistant" && (
              <div className="flex-shrink-0 pt-0.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-100 to-blue-100 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-violet-600" />
                </div>
              </div>
            )}

            <div className={cn(
              "flex flex-col gap-1.5 max-w-[80%]",
              message.role === "user" ? "items-end" : "items-start"
            )}>
              <div className={cn(
                "rounded-2xl px-4 py-2.5",
                message.role === "user"
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-50 text-neutral-800 ring-1 ring-neutral-200/60"
              )}>
                <div className="text-[13px] leading-relaxed">
                  {message.parts ? (
                    <>
                      {message.parts.map((part, partIndex) => {
                        switch (part.type) {
                          case "text":
                            return message.role === "user" ? (
                              <span key={partIndex} className="whitespace-pre-wrap">{part.text}</span>
                            ) : (
                              <MarkdownRenderer
                                key={partIndex}
                                content={part.text}
                                className="prose-sm"
                              />
                            );
                          case "reasoning":
                            return (
                              <div key={partIndex} className="mt-3 p-3 bg-white rounded-lg ring-1 ring-neutral-200/60">
                                <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block mb-1.5">Reasoning</span>
                                <span className="text-[13px] text-neutral-600 leading-relaxed">{part.reasoning}</span>
                              </div>
                            );
                          case "tool-invocation":
                            return (
                              <ToolCallLabel key={partIndex} toolInvocation={part.toolInvocation} />
                            );
                          case "source":
                            return (
                              <div key={partIndex} className="mt-2 text-xs text-neutral-400">
                                Source: {JSON.stringify(part.source)}
                              </div>
                            );
                          case "step-start":
                            return partIndex > 0 ? <hr key={partIndex} className="my-3 border-neutral-100" /> : null;
                          default:
                            return null;
                        }
                      })}
                      {isLoading &&
                        message.role === "assistant" &&
                        messages.indexOf(message) === messages.length - 1 && (
                          <div className="flex items-center gap-1.5 mt-3 text-neutral-400">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span className="text-xs">Thinking...</span>
                          </div>
                        )}
                    </>
                  ) : message.content ? (
                    message.role === "user" ? (
                      <span className="whitespace-pre-wrap">{message.content}</span>
                    ) : (
                      <MarkdownRenderer content={message.content} className="prose-sm" />
                    )
                  ) : isLoading &&
                    message.role === "assistant" &&
                    messages.indexOf(message) === messages.length - 1 ? (
                    <div className="flex items-center gap-1.5 text-neutral-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span className="text-xs">Thinking...</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            
            {message.role === "user" && (
              <div className="flex-shrink-0 pt-0.5">
                <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}