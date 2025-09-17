import { useState, useCallback } from 'react';
import { Document } from '../types';

interface History<T> {
  past: T[];
  present: T | undefined;
  future: T[];
}

export const useDocumentHistory = (initialDoc: Document | undefined) => {
  const [state, setState] = useState<History<Document>>({
    past: [],
    present: initialDoc,
    future: [],
  });

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const set = useCallback((newPresent: Document) => {
    setState(currentState => {
      if (JSON.stringify(newPresent) === JSON.stringify(currentState.present)) {
        return currentState;
      }
      const newPast = currentState.present ? [...currentState.past, currentState.present] : currentState.past;
      return {
        past: newPast,
        present: newPresent,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState(currentState => {
      if (!canUndo) return currentState;
      const newPresent = currentState.past[currentState.past.length - 1];
      const newPast = currentState.past.slice(0, currentState.past.length - 1);
      const newFuture = currentState.present ? [currentState.present, ...currentState.future] : currentState.future;
      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
      };
    });
  }, [canUndo]);

  const redo = useCallback(() => {
    setState(currentState => {
      if (!canRedo) return currentState;
      const newPresent = currentState.future[0];
      const newFuture = currentState.future.slice(1);
      const newPast = currentState.present ? [...currentState.past, currentState.present] : currentState.past;
      return {
        past: newPast,
        present: newPresent,
        future: newFuture,
      };
    });
  }, [canRedo]);

  return {
    doc: state.present,
    setDoc: set,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};