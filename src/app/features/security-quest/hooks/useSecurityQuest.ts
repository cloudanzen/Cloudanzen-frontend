import { useReducer, useCallback, useEffect, useRef } from 'react';
import { questReducer, createInitialState } from '../lib/reducer';
import type { QuestState, FeedbackData, UserAnswer } from '../lib/types';
import { MODULE_IDS, getModuleById } from '../content/modules';
import { useCurrentUser } from '@/hooks/useCurrentUser';

const STORAGE_KEY_PREFIX = 'cloudanzen-academy-state:legacy-quest';
const TICK_INTERVAL = 1000;

export function useSecurityQuest() {
  const currentUser = useCurrentUser();
  const storageKey = currentUser
    ? `${STORAGE_KEY_PREFIX}:${currentUser.id}`
    : null;

  // Only called once at mount via useRef — no need for useCallback
  function loadSavedState(): QuestState | null {
    if (!storageKey) return null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as QuestState;
      // Don't restore completed quests
      if (parsed.completionReady) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  const saved = useRef(loadSavedState());

  const [state, dispatch] = useReducer(
    questReducer,
    MODULE_IDS,
    (ids) => saved.current ?? createInitialState(ids),
  );

  const saveState = useCallback(
    (s: QuestState) => {
      if (!storageKey) return;
      try {
        localStorage.setItem(storageKey, JSON.stringify(s));
      } catch {
        // localStorage full or unavailable — non-fatal
      }
    },
    [storageKey],
  );

  const clearSavedState = useCallback(() => {
    if (!storageKey) return;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // non-fatal
    }
  }, [storageKey]);

  // Persist state on every change (except summary)
  useEffect(() => {
    if (state.phase !== 'summary') {
      saveState(state);
    }
  }, [state, saveState]);

  // Time tracking ticker
  useEffect(() => {
    if (state.phase === 'intro' || state.phase === 'summary') return;
    const interval = setInterval(() => {
      dispatch({ type: 'TICK_TIME', deltaMs: TICK_INTERVAL });
    }, TICK_INTERVAL);
    return () => clearInterval(interval);
  }, [state.phase]);

  // ── Convenience dispatchers ──────────────────────────────────────────────

  const startQuest = useCallback(() => {
    dispatch({ type: 'START_QUEST', startedAt: new Date().toISOString() });
  }, []);

  const enterModule = useCallback((moduleId: string) => {
    dispatch({ type: 'ENTER_MODULE', moduleId });
  }, []);

  const nextInteraction = useCallback(() => {
    dispatch({ type: 'NEXT_INTERACTION' });
  }, []);

  const recordAnswer = useCallback(
    (answer: UserAnswer, feedback: FeedbackData) => {
      dispatch({ type: 'RECORD_ANSWER', answer, feedback });
    },
    [],
  );

  const dismissFeedback = useCallback(() => {
    dispatch({ type: 'DISMISS_FEEDBACK' });
  }, []);

  const completeModule = useCallback((moduleId: string) => {
    const mod = getModuleById(moduleId);
    dispatch({
      type: 'COMPLETE_MODULE',
      moduleId,
      badgeIds: mod?.badgeIds ?? [],
    });
  }, []);

  const updateInteractionState = useCallback(
    (interactionId: string, data: unknown) => {
      dispatch({ type: 'UPDATE_INTERACTION_STATE', interactionId, data });
    },
    [],
  );

  const completeQuest = useCallback(() => {
    dispatch({ type: 'COMPLETE_QUEST', completedAt: new Date().toISOString() });
    clearSavedState();
  }, [clearSavedState]);

  const resetQuest = useCallback(() => {
    clearSavedState();
    dispatch({ type: 'RESET_QUEST' });
  }, [clearSavedState]);

  // ── Derived values ───────────────────────────────────────────────────────

  const currentModule = state.currentModuleId
    ? getModuleById(state.currentModuleId)
    : null;

  const currentInteraction = currentModule
    ? (currentModule.interactions[state.currentInteractionIndex] ?? null)
    : null;

  const isLastInteraction = currentModule
    ? state.currentInteractionIndex >= currentModule.interactions.length - 1
    : false;

  const completedModuleCount = Object.values(state.moduleProgress).filter(
    (s) => s === 'complete',
  ).length;

  const totalModuleCount = MODULE_IDS.length;

  const progressPercent = Math.round(
    (completedModuleCount / totalModuleCount) * 100,
  );

  return {
    state,
    dispatch,
    currentModule,
    currentInteraction,
    isLastInteraction,
    completedModuleCount,
    totalModuleCount,
    progressPercent,
    // Actions
    startQuest,
    enterModule,
    nextInteraction,
    recordAnswer,
    dismissFeedback,
    completeModule,
    updateInteractionState,
    completeQuest,
    resetQuest,
  };
}

export type UseSecurityQuestReturn = ReturnType<typeof useSecurityQuest>;
