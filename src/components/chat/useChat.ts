import { useState, useRef, useCallback } from 'react';
import { loadIndex } from '../../lib/rag/retriever';
import { preload } from '../../lib/rag/embedder';
import { respond } from '../../lib/rag/respond';
import { LOW_CONFIDENCE_FALLBACK } from '../../lib/rag/answer';
import { DEFAULT_SUGGESTION_CHIPS } from '../../lib/rag/intents';
import type { AnswerSource } from '../../lib/rag/types';

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  sources?: AnswerSource[];
  confidence?: 'high' | 'medium' | 'low';
  kind?: 'knowledge' | 'intent' | 'fallback';
  suggestions?: string[];
}

export const WELCOME_MESSAGE_TEXT =
  "Hi, I'm Charan's AI assistant. I answer from his portfolio data, in his voice. Ask me about my projects, skills, services or how to work with me.";

export const SUGGESTION_CHIPS = DEFAULT_SUGGESTION_CHIPS;

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: WELCOME_MESSAGE_TEXT,
      kind: 'intent',
      suggestions: [...DEFAULT_SUGGESTION_CHIPS],
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);

  const isSendingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  /**
   * Initializes index fetching and embedder preloading on first panel open.
   */
  const initChat = useCallback(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    // Background load index
    loadIndex().catch((err) => {
      console.warn('Index load notice:', err);
    });

    // Background preload embedder
    setIsModelLoading(true);
    preload()
      .catch((err) => {
        console.warn('Embedding model preload notice (using BM25 fallback):', err);
      })
      .finally(() => {
        setIsModelLoading(false);
      });
  }, []);

  /**
   * Sends a user message and generates an answer via respond().
   */
  const sendMessage = useCallback(async (textToSend: string) => {
    const trimmed = textToSend.trim().slice(0, 200);
    if (!trimmed || isSendingRef.current) return;

    isSendingRef.current = true;
    setIsTyping(true);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    const startTime = Date.now();

    try {
      const answer = await respond(trimmed);

      // Enforce at least 400ms typing indicator
      const elapsed = Date.now() - startTime;
      if (elapsed < 400) {
        await new Promise((resolve) => setTimeout(resolve, 400 - elapsed));
      }

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: answer.text,
        sources: answer.sources,
        confidence: answer.confidence,
        kind: answer.kind,
        suggestions: answer.suggestions,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Retrieval error:', err);
      const fallbackMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: LOW_CONFIDENCE_FALLBACK,
        sources: [],
        confidence: 'low',
        kind: 'fallback',
        suggestions: [...DEFAULT_SUGGESTION_CHIPS.slice(0, 3)],
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      isSendingRef.current = false;
      setIsTyping(false);
    }
  }, []);

  /**
   * Clears the chat back to the welcome state.
   */
  const clearChat = useCallback(() => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: WELCOME_MESSAGE_TEXT,
        kind: 'intent',
        suggestions: [...DEFAULT_SUGGESTION_CHIPS],
      },
    ]);
    setInput('');
  }, []);

  // Suggestions are only visible before any user questions have been sent
  const showSuggestions = messages.length === 1 && messages[0].sender === 'bot';

  return {
    messages,
    input,
    setInput,
    isTyping,
    isModelLoading,
    showSuggestions,
    initChat,
    sendMessage,
    clearChat,
  };
}
