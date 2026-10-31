import { useState, useRef, useEffect, useCallback } from 'react';
import type { WebSession, SessionStatus, TranscriptEvent } from '@omnidim-ai/client';

export type CallState = 'idle' | 'connecting' | 'active' | 'ended' | 'error';
export type SpeakerState = 'connecting' | 'listening' | 'speaking';
export type ErrorType = 'permission_denied' | 'unavailable' | 'unknown';

export interface TranscriptTurn {
  id: string;
  role: 'user' | 'agent';
  text: string;
  final: boolean;
}

const MAX_CALL_DURATION_SEC = 180; // 3 minutes auto-end

/**
 * Updates turns ensuring the latest cumulative snapshot replaces the current turn in-place,
 * creating a new turn only when speaker changes or after a finalized turn.
 */
function updateTurns(
  prevTurns: TranscriptTurn[],
  event: TranscriptEvent
): TranscriptTurn[] {
  if (!event.text) return prevTurns;

  const lastTurn = prevTurns[prevTurns.length - 1];

  // If last turn exists, has same role, and wasn't finalized yet -> REPLACE in-place
  if (lastTurn && lastTurn.role === event.role && !lastTurn.final) {
    const updated = [...prevTurns];
    updated[updated.length - 1] = {
      ...lastTurn,
      text: event.text,
      final: event.final,
    };
    return updated;
  }

  // Otherwise (role changed or last turn was final) -> append fresh turn
  const newTurn: TranscriptTurn = {
    id: `${event.role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role: event.role,
    text: event.text,
    final: event.final,
  };

  // Keep last 6 turns to keep the panel compact and readable
  return [...prevTurns, newTurn].slice(-6);
}

export function useVoiceAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [callState, setCallState] = useState<CallState>('idle');
  const [speakerState, setSpeakerState] = useState<SpeakerState>('connecting');
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [secondsRemaining, setSecondsRemaining] = useState(MAX_CALL_DURATION_SEC);
  const [endedReason, setEndedReason] = useState<string | null>(null);

  const sessionRef = useRef<WebSession | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const speakingTimeoutRef = useRef<number | null>(null);
  const callStateRef = useRef<CallState>('idle');

  // Keep ref in sync for synchronous event handlers
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  // Clean up all audio/socket connections
  const cleanUpSession = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (speakingTimeoutRef.current) {
      clearTimeout(speakingTimeoutRef.current);
      speakingTimeoutRef.current = null;
    }
    if (sessionRef.current) {
      try {
        sessionRef.current.stop();
      } catch {
        // Safe fallback
      }
      sessionRef.current = null;
    }
  }, []);

  // End call and release microphone
  const endCall = useCallback((reason = 'user_ended') => {
    cleanUpSession();
    if (callStateRef.current === 'active' || callStateRef.current === 'connecting') {
      setCallState('ended');
      setEndedReason(reason);
    }
  }, [cleanUpSession]);

  // Start 3-minute auto-end countdown
  const startCountdown = useCallback(() => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setSecondsRemaining(MAX_CALL_DURATION_SEC);

    countdownTimerRef.current = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          endCall('max_duration');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [endCall]);

  // Start a fresh voice call
  const startCall = useCallback(async () => {
    cleanUpSession();
    setTurns([]);
    setCallState('connecting');
    setSpeakerState('connecting');
    setErrorType(null);
    setIsMuted(false);
    setEndedReason(null);
    setSecondsRemaining(MAX_CALL_DURATION_SEC);

    try {
      // 1. Request fresh ws_url from backend
      const res = await fetch('/api/voice-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        setCallState('error');
        setErrorType('unavailable');
        return;
      }

      const data = (await res.json()) as { ws_url?: string };
      if (!data.ws_url) {
        setCallState('error');
        setErrorType('unavailable');
        return;
      }

      // 2. Lazy-load WebSession from @omnidim-ai/client
      const { WebSession } = await import('@omnidim-ai/client');
      const session = new WebSession();
      sessionRef.current = session;

      // 3. Attach SDK event listeners
      session.on('status', (s: SessionStatus) => {
        if (s === 'connecting') {
          setCallState('connecting');
          setSpeakerState('connecting');
        } else if (s === 'active') {
          setCallState('active');
          setSpeakerState('listening');
          startCountdown();
        } else if (typeof s === 'object' && s.state === 'ended') {
          cleanUpSession();
          setCallState('ended');
          setEndedReason(s.reason || 'ended');
        }
      });

      session.on('transcript', (t: TranscriptEvent) => {
        if (!t.text) return;
        setTurns((prev) => updateTurns(prev, t));

        if (t.role === 'agent') {
          setSpeakerState('speaking');
          if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
          if (t.final) {
            speakingTimeoutRef.current = window.setTimeout(() => {
              setSpeakerState('listening');
            }, 1200);
          }
        } else if (t.role === 'user') {
          if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
          setSpeakerState('listening');
        }
      });

      session.on('error', (err: Error) => {
        console.error('OmniDimension session error:', err);
        cleanUpSession();
        setCallState('error');
        const isPermission =
          err.name === 'NotAllowedError' ||
          err.name === 'PermissionDeniedError' ||
          /permission|denied|notallowed/i.test(err.message || '');
        setErrorType(isPermission ? 'permission_denied' : 'unavailable');
      });

      // 4. Start session (prompts for mic permission)
      await session.start({ wsUrl: data.ws_url });
    } catch (err: unknown) {
      console.error('Failed to start voice call:', err);
      cleanUpSession();
      setCallState('error');
      const error = err as Error;
      const isPermission =
        error?.name === 'NotAllowedError' ||
        error?.name === 'PermissionDeniedError' ||
        /permission|denied|notallowed/i.test(error?.message || '');
      setErrorType(isPermission ? 'permission_denied' : 'unavailable');
    }
  }, [cleanUpSession, startCountdown]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!sessionRef.current || callState !== 'active') return;
    const nextMuted = !isMuted;
    try {
      sessionRef.current.mute(nextMuted);
      setIsMuted(nextMuted);
    } catch (err) {
      console.error('Failed to toggle mute:', err);
    }
  }, [isMuted, callState]);

  // Open/Close panel handling
  const openPanel = useCallback(() => {
    // Exclusivity: Close text chatbot if open
    window.dispatchEvent(new CustomEvent('close-chat-widget'));
    setIsOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    endCall('closed_panel');
    setIsOpen(false);
  }, [endCall]);

  // Fallback to text chatbot
  const fallbackToChat = useCallback(() => {
    closePanel();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-chat-widget'));
    }, 100);
  }, [closePanel]);

  // Unload / Unmount cleanup
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionRef.current?.stop();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const handleCloseFromOutside = () => {
      endCall('external_close');
      setIsOpen(false);
    };
    window.addEventListener('close-voice-widget', handleCloseFromOutside);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('close-voice-widget', handleCloseFromOutside);
      cleanUpSession();
    };
  }, [cleanUpSession, endCall]);

  return {
    isOpen,
    callState,
    speakerState,
    errorType,
    isMuted,
    turns,
    secondsRemaining,
    endedReason,
    openPanel,
    closePanel,
    startCall,
    endCall,
    toggleMute,
    fallbackToChat,
  };
}

