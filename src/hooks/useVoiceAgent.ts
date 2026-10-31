import { useState, useRef, useEffect, useCallback } from 'react';
import type { WebSession, SessionStatus, TranscriptEvent } from '@omnidim-ai/client';

export type CallState = 'idle' | 'connecting' | 'active' | 'ended' | 'error';
export type SpeakerState = 'connecting' | 'listening' | 'speaking';
export type ErrorType = 'permission_denied' | 'unavailable' | 'unknown';
export type VoiceType = 'clone' | 'stock' | null;

export interface TranscriptTurn {
  id: number;
  role: 'user' | 'agent';
  text: string;
  final: boolean;
}

const MAX_CALL_DURATION_SEC = 180; // 3 minutes auto-end

/**
 * Updates turns ensuring the cumulative snapshot replaces the current turn in-place:
 * 1. If LAST turn has the same role and is not final -> replace text and final flag in-place.
 * 2. If event repeats text of last FINAL turn with same role (duplicate final) -> ignore it.
 * 3. If an event arrives from other role while turn is in-progress -> mark in-progress turn final and push new turn.
 * 4. Otherwise -> push new turn.
 * 5. Stable incrementing counter for ids (React keys).
 */
function updateTurns(
  prevTurns: TranscriptTurn[],
  event: TranscriptEvent,
  nextId: () => number
): TranscriptTurn[] {
  const text = event.text ?? '';
  if (!text.trim()) return prevTurns;

  const lastIdx = prevTurns.length - 1;
  const lastTurn = lastIdx >= 0 ? prevTurns[lastIdx] : null;

  // 3. If an event arrives from the other role while a turn is still in progress,
  // mark the in-progress turn final and start the new one.
  if (lastTurn && !lastTurn.final && lastTurn.role !== event.role) {
    const finalizedLast: TranscriptTurn = { ...lastTurn, final: true };
    const newTurn: TranscriptTurn = {
      id: nextId(),
      role: event.role,
      text,
      final: Boolean(event.final),
    };
    return [...prevTurns.slice(0, lastIdx), finalizedLast, newTurn].slice(-4);
  }

  // 2a. If the LAST turn has the same role and is not final, replace its text (and final flag)
  if (lastTurn && !lastTurn.final && lastTurn.role === event.role) {
    const updatedLast: TranscriptTurn = {
      ...lastTurn,
      text,
      final: Boolean(event.final),
    };
    return [...prevTurns.slice(0, lastIdx), updatedLast];
  }

  // 2b. If the event repeats the text of the last FINAL turn with the same role (duplicate final), ignore it.
  if (
    lastTurn &&
    lastTurn.final &&
    lastTurn.role === event.role &&
    (lastTurn.text.trim() === text.trim() || lastTurn.text.trim().startsWith(text.trim()))
  ) {
    return prevTurns;
  }

  // 2c. Otherwise, push a new turn.
  const newTurn: TranscriptTurn = {
    id: nextId(),
    role: event.role,
    text,
    final: Boolean(event.final),
  };
  return [...prevTurns, newTurn].slice(-4);
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
  const [voice, setVoice] = useState<VoiceType>(null);

  const turnIdCounterRef = useRef(0);
  const nextTurnId = useCallback(() => ++turnIdCounterRef.current, []);

  const sessionRef = useRef<WebSession | null>(null);
  const activeSessionIdRef = useRef<number>(0);
  const isStartingRef = useRef(false);
  const statusCbRef = useRef<((s: SessionStatus) => void) | null>(null);
  const transcriptCbRef = useRef<((t: TranscriptEvent) => void) | null>(null);
  const errorCbRef = useRef<((e: Error) => void) | null>(null);

  const countdownTimerRef = useRef<number | null>(null);
  const speakingTimeoutRef = useRef<number | null>(null);
  const callStateRef = useRef<CallState>('idle');

  // Keep ref in sync for synchronous event handlers
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  // Clean up all audio/socket connections and event listeners
  const cleanUpSession = useCallback(() => {
    // Invalidate active session so in-flight events are ignored
    activeSessionIdRef.current++;

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (speakingTimeoutRef.current) {
      clearTimeout(speakingTimeoutRef.current);
      speakingTimeoutRef.current = null;
    }
    if (sessionRef.current) {
      const session = sessionRef.current;
      sessionRef.current = null;
      if (statusCbRef.current) {
        session.off('status', statusCbRef.current);
        statusCbRef.current = null;
      }
      if (transcriptCbRef.current) {
        session.off('transcript', transcriptCbRef.current);
        transcriptCbRef.current = null;
      }
      if (errorCbRef.current) {
        session.off('error', errorCbRef.current);
        errorCbRef.current = null;
      }
      try {
        session.stop();
      } catch {
        // Safe fallback
      }
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

  // Start a fresh voice call ("Speak with Charan" / "Speak again")
  const startCall = useCallback(async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;

    try {
      cleanUpSession();
      turnIdCounterRef.current = 0;
      setTurns([]);
      setCallState('connecting');
      setSpeakerState('connecting');
      setErrorType(null);
      setIsMuted(false);
      setEndedReason(null);
      setSecondsRemaining(MAX_CALL_DURATION_SEC);
      setVoice(null);

      const currentSessionId = activeSessionIdRef.current;

      // 1. Request fresh ws_url from backend
      const res = await fetch('/api/voice-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (activeSessionIdRef.current !== currentSessionId) return;

      if (!res.ok) {
        setCallState('error');
        setErrorType('unavailable');
        return;
      }

      const data = (await res.json()) as { ws_url?: string; voice?: 'clone' | 'stock' };
      if (activeSessionIdRef.current !== currentSessionId) return;

      if (!data.ws_url) {
        setCallState('error');
        setErrorType('unavailable');
        return;
      }

      // Store voice for current call as soon as session is created
      setVoice(data.voice === 'clone' ? 'clone' : 'stock');

      // 2. Lazy-load WebSession from @omnidim-ai/client
      const { WebSession } = await import('@omnidim-ai/client');
      if (activeSessionIdRef.current !== currentSessionId) return;

      const session = new WebSession();
      sessionRef.current = session;

      // 3. Attach SDK event listeners (guarded by session ID)
      const onStatus = (s: SessionStatus) => {
        if (activeSessionIdRef.current !== currentSessionId) return;
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
      };

      const onTranscript = (t: TranscriptEvent) => {
        if (activeSessionIdRef.current !== currentSessionId) return;
        if (!t.text) return;

        if (import.meta.env.DEV) {
          console.warn(`[VoiceAgent] transcript: role=${t.role}, final=${t.final}, len=${t.text.length}`);
        }

        setTurns((prev) => updateTurns(prev, t, nextTurnId));

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
      };

      const onError = (err: Error) => {
        if (activeSessionIdRef.current !== currentSessionId) return;
        console.error('OmniDimension session error:', err);
        cleanUpSession();
        setCallState('error');
        const isPermission =
          err.name === 'NotAllowedError' ||
          err.name === 'PermissionDeniedError' ||
          /permission|denied|notallowed/i.test(err.message || '');
        setErrorType(isPermission ? 'permission_denied' : 'unavailable');
      };

      statusCbRef.current = onStatus;
      transcriptCbRef.current = onTranscript;
      errorCbRef.current = onError;

      session.on('status', onStatus);
      session.on('transcript', onTranscript);
      session.on('error', onError);

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
    } finally {
      isStartingRef.current = false;
    }
  }, [cleanUpSession, nextTurnId, startCountdown]);

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
    setVoice(null);
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
      setVoice(null);
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
    voice,
    openPanel,
    closePanel,
    startCall,
    endCall,
    toggleMute,
    fallbackToChat,
  };
}

