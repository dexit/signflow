
import React, { createContext, useState, useMemo, useCallback, useEffect } from 'react';
import { Document, Recipient } from '../types';

interface AppContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  documents: Document[];
  addDocument: (doc: Document) => void;
  updateDocument: (doc: Document) => void;
  getDocument: (id: string) => Document | undefined;
  getDocumentByShareId: (shareId: string) => { doc: Document; permission: 'view' | 'edit' } | undefined;
}

export const AppContext = createContext<AppContextType>({
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  documents: [],
  addDocument: () => {},
  updateDocument: () => {},
  getDocument: () => undefined,
  getDocumentByShareId: () => undefined,
});

const getInitialState = <T,>(key: string, defaultValue: T): T => {
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      return JSON.parse(storedValue);
    }
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
  }
  return defaultValue;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => getInitialState('isAuthenticated', false));
  const [documents, setDocuments] = useState<Document[]>(() => getInitialState('documents', []));

  useEffect(() => {
    localStorage.setItem('isAuthenticated', JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('documents', JSON.stringify(documents));
  }, [documents]);

  const login = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const addDocument = useCallback((doc: Document) => {
    setDocuments((prev) => [...prev, doc]);
  }, []);

  const updateDocument = useCallback((updatedDoc: Document) => {
    setDocuments((prev) => prev.map((doc) => (doc.id === updatedDoc.id ? updatedDoc : doc)));
  }, []);
  
  const getDocument = useCallback((id: string) => {
    return documents.find(doc => doc.id === id);
  }, [documents]);

  const getDocumentByShareId = useCallback((shareId: string) => {
    for (const doc of documents) {
        if (doc.shareSettings?.viewId === shareId) {
            return { doc, permission: 'view' as const };
        }
        if (doc.shareSettings?.editId === shareId) {
            return { doc, permission: 'edit' as const };
        }
    }
    return undefined;
  }, [documents]);

  const contextValue = useMemo(
    () => ({
      isAuthenticated,
      login,
      logout,
      documents,
      addDocument,
      updateDocument,
      getDocument,
      getDocumentByShareId,
    }),
    [isAuthenticated, login, logout, documents, addDocument, updateDocument, getDocument, getDocumentByShareId]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};