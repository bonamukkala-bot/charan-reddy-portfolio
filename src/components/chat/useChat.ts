import { useState, useRef, useCallback, useEffect } from 'react';
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
  isStreaming?: boolean;
}

export const WELCOME_MESSAGE_TEXT =
  "Hi, I'm Charan's AI assistant. I answer from his portfolio data, in his voice. Ask me about my projects, skills, services or how to work with me.";

export const SUGGESTION_CHIPS = DEFAULT_SUGGESTION_CHIPS;

export interface UseChatOptions {
  prefersReducedMotion?: boolean;
  onStreamTick?: () => void;
  onStreamFinished?: (fullText: string) => void;
}

export function useChat({
  prefersReducedMotion = false,
  onStreamTick,
  onStreamFinished,
}: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: WELCOME_MESSAGE_TEXT,
      kind: 'intent',
      suggestions: [...DEFAULT_SUGGESTION_CHIPS],
      isStreaming: false,
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);

  const isSendingRef = useRef(false);
  const isFirstQuestionRef = useRef(true);
  const hasInitializedRef = useRef(false);

  // Active stream tracker to allow instantaneous completion or clean cancellation
  const activeStreamRef = useRef<{
    timer: NodeJS.Timeout | number | null;
    finish: () => void;
  } | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeStreamRef.current?.timer) {
        clearInterval(activeStreamRef.current.timer as NodeJS.Timeout);
        activeStreamRef.current = null;
      }
    };
  }, []);

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
   * Instantly completes any in-progress stream without dropping content.
   */
  const finishCurrentStream = useCallback(() => {
    if (activeStreamRef.current) {
      activeStreamRef.current.finish();
      activeStreamRef.current = null;
    }
  }, []);

  /**
   * Sends a user message and generates an answer via respond().
   */
  const sendMessage = useCallback(
    async (textToSend: string) => {
      const trimmed = textToSend.trim().slice(0, 200);
      if (!trimmed || isSendingRef.current) return;

      // Finish any currently streaming message immediately before sending the new one
      finishCurrentStream();

      isSendingRef.current = true;
      setIsTyping(true);

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: trimmed,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');

      // C1: On the visitor's first question, if embedding model is still loading,
      // await readiness for up to 3000ms while keeping typing indicator visible
      if (isFirstQuestionRef.current && isModelLoading) {
        try {
          await Promise.race([
            preload(),
            new Promise((resolve) => setTimeout(resolve, 3000)),
          ]);
        } catch {
          // Continue in keyword-only mode
        }
      }
      isFirstQuestionRef.current = false;

      const startTime = Date.now();

      try {
        const answer = await respond(trimmed);

        // Enforce 300ms minimum typing indicator
        const elapsed = Date.now() - startTime;
        if (elapsed < 300) {
          await new Promise((resolve) => setTimeout(resolve, 300 - elapsed));
        }

        const botMsgId = `bot-${Date.now()}`;

        const shouldReduceMotion =
          prefersReducedMotion ||
          (typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches);

        // Reduced motion: show full answer immediately without streaming
        if (shouldReduceMotion) {
          setIsTyping(false);
          const botMessage: ChatMessage = {
            id: botMsgId,
            sender: 'bot',
            text: answer.text,
            sources: answer.sources,
            confidence: answer.confidence,
            kind: answer.kind,
            suggestions: answer.suggestions,
            isStreaming: false,
          };
          setMessages((prev) => [...prev, botMessage]);
          onStreamFinished?.(answer.text);
          return;
        }

        // Tokenize answer for streaming: split into words keeping trailing whitespace & newlines
        const tokens = answer.text.match(/^[^\S\r\n]+|\S+\s*/g) || [answer.text];
        const totalWords = tokens.length;
        // Reveal tokens every 22ms; long answers finish within ~1.8s
        const wordsPerTick = Math.max(1, Math.ceil(totalWords / (1800 / 22)));

        setIsTyping(false);

        // Insert initial streaming message bubble with empty text
        const botMessage: ChatMessage = {
          id: botMsgId,
          sender: 'bot',
          text: '',
          sources: answer.sources,
          confidence: answer.confidence,
          kind: answer.kind,
          suggestions: answer.suggestions,
          isStreaming: true,
        };
        setMessages((prev) => [...prev, botMessage]);

        let revealedIndex = 0;

        const completeStream = () => {
          if (activeStreamRef.current?.timer) {
            clearInterval(activeStreamRef.current.timer as NodeJS.Timeout);
          }
          activeStreamRef.current = null;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? { ...m, text: answer.text, isStreaming: false }
                : m
            )
          );
          onStreamTick?.();
          onStreamFinished?.(answer.text);
        };

        const timer = setInterval(() => {
          revealedIndex += wordsPerTick;
          if (revealedIndex >= totalWords) {
            completeStream();
          } else {
            const partialText = tokens.slice(0, revealedIndex).join('');
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botMsgId ? { ...m, text: partialText } : m
              )
            );
            onStreamTick?.();
          }
        }, 22);

        activeStreamRef.current = {
          timer,
          finish: completeStream,
        };
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
          isStreaming: false,
        };
        setIsTyping(false);
        setMessages((prev) => [...prev, fallbackMessage]);
        onStreamFinished?.(LOW_CONFIDENCE_FALLBACK);
      } finally {
        isSendingRef.current = false;
      }
    },
    [isModelLoading, prefersReducedMotion, finishCurrentStream, onStreamTick, onStreamFinished]
  );

  /**
   * Clears the chat back to the welcome state.
   */
  const clearChat = useCallback(() => {
    finishCurrentStream();
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: WELCOME_MESSAGE_TEXT,
        kind: 'intent',
        suggestions: [...DEFAULT_SUGGESTION_CHIPS],
        isStreaming: false,
      },
    ]);
    setInput('');
  }, [finishCurrentStream]);

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
    finishCurrentStream,
  };
}
