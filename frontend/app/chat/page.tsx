"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, AlertCircle, Loader } from "lucide-react";
import { apiFetch } from "@/lib/api";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  strategy?: string | string[];
  risks?: string | string[];
  references?: Array<{ title?: string; summary?: string; case_id?: number; description?: string }>;
}

const suggestedPrompts = [
  "What are the strongest arguments in this case?",
  "Identify potential weaknesses and risks",
  "Suggest settlement strategy",
  "What evidence is missing?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    // Add user message
    const userMessage: Message = { role: "user", content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiFetch(`/chat`, {
        method: "POST",
        body: JSON.stringify({ 
          query: messageText,
          case_id: null 
        }),
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer || "No response received",
        strategy: data.strategy,
        risks: data.risks,
        references: data.references,
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMsg);
      setMessages((prev) =>
        prev.concat({
          role: "assistant",
          content: `Error: ${errorMsg}`,
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 h-screen flex flex-col">
      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Assistant</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Context-aware legal AI. Ask about your cases, documents, or legal concepts.
        </p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto mb-6 space-y-4">
        {messages.length === 0 ? (
          <Card className="h-full flex flex-col items-center justify-center">
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💬</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Start a Legal Conversation
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                Ask questions about your cases, get legal insights, or request document analysis.
              </p>

              {/* Suggested Prompts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-6">
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(prompt)}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {prompt}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-2xl p-4 rounded-lg ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  }`}
                >
                  <div className={`prose prose-sm max-w-none prose-p:leading-relaxed ${msg.role === "user" ? "text-white prose-invert" : "dark:prose-invert"}`}>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  
                  {msg.role === "assistant" && msg.strategy && (
                    <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                      <p className="text-xs font-semibold mb-1">Strategy:</p>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{Array.isArray(msg.strategy) ? msg.strategy.join('\n\n') : msg.strategy}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                  
                  {msg.role === "assistant" && msg.risks && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold mb-1 text-red-600 dark:text-red-400">Risks:</p>
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown>{Array.isArray(msg.risks) ? msg.risks.join('\n\n') : msg.risks}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                  {msg.role === "assistant" && msg.references && msg.references.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
                      <p className="text-xs font-semibold">Similar Cases:</p>
                      <ul className="text-xs list-disc pl-5">
                        {msg.references.map((ref, i) => (
                          <li key={i}>
                            <a href={`/cases/${ref.case_id}`} className="text-blue-600 hover:underline">
                              {ref.title || `Case ${ref.case_id}`}
                            </a>
                            {ref.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">{ref.description}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-3 flex-shrink-0">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !isLoading) {
              sendMessage();
            }
          }}
          placeholder="Ask a legal question..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button
          onClick={() => sendMessage()}
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
