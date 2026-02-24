
import { useReducer, useCallback, useRef } from 'react';

interface HistoryState<T> {
    past: T[];
    present: T;
    future: T[];
}

type HistoryAction<T> =
    | { type: 'UNDO' }
    | { type: 'REDO' }
    | { type: 'SET', newPresent: T, debounce?: boolean }
    | { type: 'RESET', newPresent: T };

function historyReducer<T>(state: HistoryState<T>, action: HistoryAction<T>): HistoryState<T> {
    const { past, present, future } = state;

    switch (action.type) {
        case 'UNDO': {
            if (past.length === 0) return state;
            const previous = past[past.length - 1];
            const newPast = past.slice(0, past.length - 1);
            return {
                past: newPast,
                present: previous,
                future: [present, ...future]
            };
        }
        case 'REDO': {
            if (future.length === 0) return state;
            const next = future[0];
            const newFuture = future.slice(1);
            return {
                past: [...past, present],
                present: next,
                future: newFuture
            };
        }
        case 'SET': {
            const { newPresent, debounce } = action;
            if (JSON.stringify(newPresent) === JSON.stringify(present)) return state;

            if (debounce) {
                return {
                    ...state,
                    present: newPresent
                };
            }

            return {
                past: [...past, present].slice(-50),
                present: newPresent,
                future: []
            };
        }
        case 'RESET': {
            return {
                past: [],
                present: action.newPresent,
                future: []
            };
        }
        default:
            return state;
    }
}

export function useHistory<T>(initialState: T) {
    const [history, dispatch] = useReducer(historyReducer, {
        past: [],
        present: initialState,
        future: []
    }) as [HistoryState<T>, React.Dispatch<HistoryAction<T>>];

    // Ref to always have the latest state for functional updates
    const stateRef = useRef(history.present);
    stateRef.current = history.present;

    const lastHistoryUpdateTimeRef = useRef<number>(0);

    const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
    const redo = useCallback(() => dispatch({ type: 'REDO' }), []);

    const set = useCallback((value: T | ((prev: T) => T)) => {
        const newPresent = value instanceof Function ? value(stateRef.current) : value;

        // Safety check to avoid infinite loops if the value doesn't actually change
        if (JSON.stringify(newPresent) === JSON.stringify(stateRef.current)) return;

        const now = Date.now();
        // Debounce history: Only add to 'past' if more than 2 seconds have passed since last history entry
        // This prevents every keystroke from creating an undo step.
        const shouldDebounce = now - lastHistoryUpdateTimeRef.current < 2000;

        if (shouldDebounce) {
            // If debouncing, we just update the present without adding to past or clearing future
            // actually, my reducer currently adds to past on every SET. 
            // I'll adjust the reducer and dispatch accordingly.
            dispatch({ type: 'SET', newPresent, debounce: true });
        } else {
            dispatch({ type: 'SET', newPresent, debounce: false });
            lastHistoryUpdateTimeRef.current = now;
        }
    }, []);

    const reset = useCallback((newPresent: T) => {
        dispatch({ type: 'RESET', newPresent });
        lastHistoryUpdateTimeRef.current = 0;
    }, []);

    return {
        state: history.present,
        set,
        undo,
        redo,
        reset,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0
    };
}
