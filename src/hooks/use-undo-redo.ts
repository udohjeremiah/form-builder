import { useCallback, useState } from "react";

interface Snapshot<T> {
  state: T;
}

const MAX_HISTORY = 50;

interface History<T> {
  future: Snapshot<T>[];
  past: Snapshot<T>[];
  present: T;
}

export function useUndoRedo<T>(initial: T) {
  const [history, setHistory] = useState<History<T>>({
    future: [],
    past: [],
    present: initial,
  });

  const set = useCallback((updater: ((previous: T) => T) | T) => {
    setHistory(({ future, past, present }) => {
      const nextPast = [...past, { state: present }];
      if (nextPast.length > MAX_HISTORY) nextPast.shift();
      return {
        future,
        past: nextPast,
        present:
          typeof updater === "function"
            ? (updater as (previous_: T) => T)(present)
            : updater,
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory(({ future, past, present }) => {
      const previous = past.at(-1);
      if (!previous) return { future, past, present };
      return {
        future: [...future, { state: present }],
        past: past.slice(0, -1),
        present: previous.state,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(({ future, past, present }) => {
      const next = future.at(-1);
      if (!next) return { future, past, present };
      return {
        future: future.slice(0, -1),
        past: [...past, { state: present }],
        present: next.state,
      };
    });
  }, []);

  const resetHistory = useCallback((newState: T) => {
    setHistory((current) => ({
      ...current,
      future: [],
      past: [],
      present: newState,
    }));
  }, []);

  return {
    canRedo: history.future.length > 0,
    canUndo: history.past.length > 0,
    redo,
    resetHistory,
    set,
    state: history.present,
    undo,
  };
}
