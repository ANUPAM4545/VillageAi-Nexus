/* eslint-disable */
"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useState, useEffect, useRef, useCallback } from "react";
import { apiClient } from "@/lib/api-client";
import ReactMarkdown from "react-markdown";

// Types
interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export default function AIAssistantPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  
  // Streaming state
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  


  // Handle scroll events to detect if user manually scrolled up
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setIsNearBottom(distanceFromBottom < 100);
  };

  useEffect(() => {
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeConversation?.messages, streamingMessage, isNearBottom]);

  async function loadConversations() {
    setLoadingConversations(true);
    try {
      const res = await apiClient.get("/ai/conversations");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setConversations(data.items || []);
      if (data.items && data.items.length > 0 && !activeConversation) {
        loadConversationDetails(data.items[0].id);
      }
    } catch (err) {
      console.error("Failed to load conversations", err);
    } finally {
      setLoadingConversations(false);
    }
  }

  useEffect(() => {
    if (user?.role !== "STUDENT") return;
    loadConversations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
  }, []);

  const loadConversationDetails = useCallback(async (id: string) => {
    if (loading) stopGeneration();
    try {
      const res = await apiClient.get(`/ai/conversations/${id}`);
      if (!res.ok) throw new Error("Failed to fetch details");
      const data = await res.json();
      setActiveConversation(data);
      setStreamingMessage("");
      setError(null);
    } catch (err) {
      console.error("Failed to load conversation details", err);
    }
  }, [loading, stopGeneration]);

  const startNewConversation = async () => {
    if (loading) stopGeneration();
    try {
      const res = await apiClient.post("/ai/conversations", {});
      if (!res.ok) throw new Error("Failed to create new conversation");
      const newConv = await res.json();
      setConversations([newConv, ...conversations]);
      setActiveConversation(newConv);
      setStreamingMessage("");
      setError(null);
      setInput("");
    } catch (err) {
      setError("Failed to create new conversation.");
    }
  };

  const sendStreamMessage = async (e?: React.FormEvent, retryContent?: string) => {
    if (e) e.preventDefault();
    const contentToSend = retryContent || input;
    if (!contentToSend.trim() || loading) return;

    let targetConv = activeConversation;
    if (!targetConv) {
      try {
        const res = await apiClient.post("/ai/conversations", {});
        if (!res.ok) throw new Error("Failed to create conversation");
        targetConv = await res.json();
        setConversations([targetConv!, ...conversations]);
        setActiveConversation(targetConv);
      } catch (err) {
        setError("Failed to create conversation.");
        return;
      }
    }

    if (!retryContent) setInput("");
    setLoading(true);
    setError(null);
    setStreamingMessage("");
    setIsNearBottom(true); // Force scroll to bottom on new message

    // Optimistically add user message
    // eslint-disable-next-line react-hooks/purity
    const tempUserMsg: Message = {
      // eslint-disable-next-line react-hooks/purity
      id: "temp-" + Date.now(),
      role: "USER",
      content: contentToSend,
      // eslint-disable-next-line react-hooks/purity
      created_at: new Date().toISOString(),
    };
    
    if (targetConv) {
      setActiveConversation({
        ...targetConv,
        messages: [...(targetConv.messages || []), tempUserMsg]
      });
    }

    abortControllerRef.current = new AbortController();

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      // Use standard fetch but include credentials to proxy cookies
      const res = await fetch(`${API_BASE}/ai/conversations/${targetConv!.id}/messages/stream`, {
        method: 'POST',
        body: JSON.stringify({ content: contentToSend }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current.signal
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || "Failed to send message.");
      }

      if (!res.body) throw new Error("ReadableStream not supported");
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let accumulated = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (!dataStr) continue;
            
            let parsed;
            try {
              parsed = JSON.parse(dataStr);
            } catch (e) {
              // Ignore parse errors for partial JSON or empty lines
              continue;
            }
            
            if (parsed.message) {
               // Error event
               throw new Error(parsed.message);
            }
            if (parsed.content && !parsed.message_id) {
              // Chunk event
              accumulated += parsed.content;
              setStreamingMessage(accumulated);
            }
          }
        }
      }
      
      // Refresh to get final persisted message and updated title
      await loadConversationDetails(targetConv!.id);
      
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Handled by stopGeneration
      } else {
        const msg = err instanceof Error ? err.message : "Something went wrong while generating the response.";
        setError(msg);
      }
    } finally {
      setLoading(false);
      setStreamingMessage("");
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const regenerateResponse = () => {
    if (!activeConversation || !activeConversation.messages || activeConversation.messages.length === 0) return;
    
    // Find last USER message
    const userMessages = activeConversation.messages.filter(m => m.role === 'USER');
    if (userMessages.length === 0) return;
    
    const lastUserMsg = userMessages[userMessages.length - 1];
    sendStreamMessage(undefined, lastUserMsg.content);
  };

  // Group conversations by date
  const groupConversations = () => {
    const groups: { [key: string]: Conversation[] } = {
      "TODAY": [],
      "YESTERDAY": [],
      "PREVIOUS 7 DAYS": [],
      "OLDER": []
    };
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    conversations.forEach(conv => {
      const convDate = new Date(conv.created_at);
      if (convDate >= today) groups["TODAY"].push(conv);
      else if (convDate >= yesterday) groups["YESTERDAY"].push(conv);
      else if (convDate >= lastWeek) groups["PREVIOUS 7 DAYS"].push(conv);
      else groups["OLDER"].push(conv);
    });

    return groups;
  };

  if (user?.role !== "STUDENT") {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Access Denied</h2>
          <p className="mt-2 text-[var(--muted-foreground)]">Only students can access the AI Assistant.</p>
        </div>
      </div>
    );
  }

  const grouped = groupConversations();

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-[var(--background)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
      {/* Sidebar */}
      <div className="w-72 md:w-80 border-r border-[var(--border)] flex flex-col bg-[var(--muted)]/10">
        <div className="p-4 border-b border-[var(--border)]">
          <button
            onClick={startNewConversation}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-[var(--foreground)] px-4 py-2.5 text-sm font-medium text-[var(--background)] hover:bg-[var(--foreground)]/90 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {loadingConversations ? (
            <div className="text-center py-4 text-sm text-[var(--muted-foreground)]">Loading history...</div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-4 text-sm text-[var(--muted-foreground)]">No previous chats.</div>
          ) : (
            Object.entries(grouped).map(([label, convs]) => (
              convs.length > 0 && (
                <div key={label} className="space-y-1">
                  <h3 className="text-xs font-semibold text-[var(--muted-foreground)] px-2 mb-2 tracking-wider">{label}</h3>
                  {convs.map((conv) => (
                    <button
                      key={conv.id}
                      // eslint-disable-next-line react-hooks/refs
                      onClick={() => loadConversationDetails(conv.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm truncate transition-colors ${
                        activeConversation?.id === conv.id 
                          ? "bg-[var(--muted)] text-[var(--foreground)] font-medium" 
                          : "text-[var(--foreground)] hover:bg-[var(--muted)]/50"
                      }`}
                    >
                      {conv.title || "New Conversation"}
                    </button>
                  ))}
                </div>
              )
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-[var(--background)]">
        <div className="border-b border-[var(--border)] p-4 bg-[var(--background)]/80 backdrop-blur-sm flex items-center justify-between z-10 sticky top-0">
          <div>
            <h2 className="font-semibold text-[var(--foreground)] tracking-tight">
              {activeConversation?.title || "AI Student Assistant"}
            </h2>
            <p className="text-xs text-[var(--muted-foreground)]">Your personal learning assistant</p>
          </div>
          <div className="hidden sm:block">
             <button onClick={startNewConversation} className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors px-3 py-1.5 border border-[var(--border)] rounded-md hover:bg-[var(--muted)]/50">New Chat</button>
          </div>
        </div>

        <div 
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth" 
          ref={scrollContainerRef} 
          onScroll={handleScroll}
        >
          {!activeConversation || (activeConversation.messages || []).length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center pt-10">
              <div className="text-center max-w-sm">
                <div className="mx-auto w-12 h-12 bg-[var(--muted)] rounded-full flex items-center justify-center mb-4 border border-[var(--border)]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--foreground)]"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                </div>
                <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">How can I help you learn today?</h3>
                <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                  Ask me anything about your studies, homework, or subjects you want to explore.
                </p>
              </div>
            </div>
          ) : (
            <>
              {(activeConversation.messages || []).map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "USER" ? "justify-end" : "justify-start"} group`}>
                  <div 
                    className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm border ${
                      msg.role === "USER" 
                        ? "bg-[var(--foreground)] text-[var(--background)] rounded-br-sm border-[var(--foreground)]" 
                        : "bg-[var(--background)] text-[var(--foreground)] rounded-bl-sm border-[var(--border)]"
                    }`}
                  >
                    <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-[var(--muted)] prose-pre:border prose-pre:border-[var(--border)] prose-pre:text-[var(--foreground)] prose-code:text-[var(--foreground)] prose-code:bg-[var(--muted)] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                      {msg.role === "USER" ? (
                         <div className="whitespace-pre-wrap">{msg.content}</div>
                      ) : (
                         <ReactMarkdown>{msg.content}</ReactMarkdown>
                      )}
                    </div>
                    {msg.role === "ASSISTANT" && (
                      <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => copyToClipboard(msg.content)} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-1 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                            Copy
                         </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start group">
                  <div className="max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm border bg-[var(--background)] text-[var(--foreground)] rounded-bl-sm border-[var(--border)]">
                    {streamingMessage ? (
                      <div className="text-sm leading-relaxed prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-[var(--muted)] prose-pre:border prose-pre:border-[var(--border)] prose-pre:text-[var(--foreground)] prose-code:text-[var(--foreground)] prose-code:bg-[var(--muted)] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                         <ReactMarkdown>{streamingMessage}</ReactMarkdown>
                         <span className="inline-block w-2 h-4 ml-1 bg-[var(--foreground)] animate-pulse align-middle"></span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 h-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted-foreground)] animate-bounce"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted-foreground)] animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--muted-foreground)] animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                      </div>
                    )}
                    
                    <div className="mt-3 flex items-center gap-2">
                       <button onClick={stopGeneration} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex items-center gap-1 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>
                          Stop generating
                       </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          {error && (
            <div className="flex justify-center my-4">
              <div className="bg-[var(--background)] border border-red-500/20 text-red-500 rounded-lg px-4 py-3 text-sm max-w-md text-center shadow-sm">
                <p className="mb-2">{error}</p>
                <button onClick={() => regenerateResponse()} className="text-xs font-medium border border-red-500/20 rounded px-2 py-1 hover:bg-red-500/10 transition-colors">Retry</button>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
        
        {/* Scroll to bottom floating button */}
        {!isNearBottom && activeConversation?.messages?.length && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
             <button 
               onClick={() => {
                 setIsNearBottom(true);
                 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
               }}
               className="bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] rounded-full px-4 py-1.5 text-xs shadow-sm flex items-center gap-2 hover:bg-[var(--muted)] transition-colors"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
               New response
             </button>
          </div>
        )}

        <div className="p-4 bg-[var(--background)] border-t border-[var(--border)] relative z-10">
          <form onSubmit={(e) => sendStreamMessage(e)} className="relative max-w-4xl mx-auto flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              className="flex-1 bg-[var(--background)] border border-[var(--border)] shadow-sm rounded-full pl-5 pr-12 py-3.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--foreground)] transition-shadow"
              disabled={loading}
            />
            {loading ? (
              <button
                type="button"
                onClick={stopGeneration}
                className="absolute right-2 top-2 bottom-2 aspect-square rounded-full bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] flex items-center justify-center hover:bg-[var(--muted)] transition-colors shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="10" height="10" x="7" y="7" rx="1"/></svg>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="absolute right-2 top-2 bottom-2 aspect-square rounded-full bg-[var(--foreground)] text-[var(--background)] flex items-center justify-center hover:bg-[var(--foreground)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
              </button>
            )}
          </form>
          <div className="text-center mt-2.5">
             <span className="text-[10px] text-[var(--muted-foreground)] font-medium">AI can make mistakes. Verify important information.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
