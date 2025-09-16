import React, { createContext, useState, useMemo, useCallback, useEffect } from 'react';
import { Document, Recipient, UserProfile, UserSettings, Event } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AppContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  documents: Document[];
  addDocument: (doc: Document) => void;
  updateDocument: (doc: Document) => void;
  getDocument: (id: string) => Document | undefined;
  getDocumentByShareId: (shareId: string) => { doc: Document; permission: 'view' | 'edit' } | undefined;
  logEvent: (documentId: string, type: Event['type'], message: string) => void;
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
}

const defaultSettings: UserSettings = {
    personalization: {
        signatureRequestEmail: { 
            subject: 'Signature Request for {{document_name}}', 
            body: 'Hello {{recipient_name}},\n\nPlease review and sign the following document: {{document_name}}.\n\nClick the link below to get started:\n{{signing_link}}\n\nThank you!' 
        },
        documentsCopyEmail: { subject: '', body: '' },
        completedNotificationEmail: { subject: '', body: '' },
        companyLogo: null,
        completedFormMessage: 'Thank you for signing!',
        redirectUrl: '',
        showConfetti: false,
    },
    email: {
        provider: 'smtp',
        smtpHost: '', smtpPort: '', smtpUsername: '', smtpPassword: '',
        smtpDomain: '', smtpAuth: 'plain', smtpSecurity: 'tls', sendFromEmail: ''
    },
    sms: {
        provider: 'twilio',
        accountSid: '',
        authToken: '',
        twilioPhoneNumber: ''
    },
    storage: { provider: 'disk' },
};

const defaultUserProfile: UserProfile = {
    name: 'Admin User',
    email: 'admin@docuseal.com',
    settings: defaultSettings,
};


export const AppContext = createContext<AppContextType>({
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  documents: [],
  addDocument: () => {},
  updateDocument: () => {},
  getDocument: () => undefined,
  getDocumentByShareId: () => undefined,
  logEvent: () => {},
  userProfile: defaultUserProfile,
  updateUserProfile: () => {},
  updateSettings: () => {},
});

// Helper function to check if a value is a non-array object.
const isObject = (item: any): item is Record<string, any> => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

// Deeply merges a source object into a target object.
const deepMerge = <T extends Record<string, any>>(target: T, source: Partial<T>): T => {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      const sourceKey = key as keyof T;
      if (isObject(source[sourceKey])) {
        if (!(key in target) || !isObject(target[sourceKey])) {
          output[sourceKey] = source[sourceKey];
        } else {
          output[sourceKey] = deepMerge(target[sourceKey], source[sourceKey] as Partial<T[keyof T]>);
        }
      } else {
        output[sourceKey] = source[sourceKey];
      }
    });
  }
  return output;
};


const getInitialState = <T,>(key: string, defaultValue: T): T => {
  try {
    const storedValue = localStorage.getItem(key);
    if (storedValue) {
      const parsed = JSON.parse(storedValue);
      // Use deep merge only for objects to avoid corrupting arrays (like documents)
      // and to correctly merge nested settings in userProfile.
      if (isObject(defaultValue) && isObject(parsed)) {
        return deepMerge(defaultValue as any, parsed as any);
      }
      return parsed; // Return arrays and primitives as is.
    }
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
  }
  return defaultValue;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => getInitialState('isAuthenticated', false));
  const [documents, setDocuments] = useState<Document[]>(() => getInitialState('documents', []));
  const [userProfile, setUserProfile] = useState<UserProfile>(() => getInitialState('userProfile', defaultUserProfile));

  useEffect(() => {
    localStorage.setItem('isAuthenticated', JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('documents', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
  }, [userProfile]);

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
  
  const logEvent = useCallback((documentId: string, type: Event['type'], message: string) => {
    setDocuments(prevDocs => {
        return prevDocs.map(doc => {
            if (doc.id === documentId) {
                const newEvent: Event = {
                    id: uuidv4(),
                    type,
                    message,
                    timestamp: new Date().toISOString()
                };
                return { ...doc, events: [...doc.events, newEvent] };
            }
            return doc;
        });
    });
  }, []);

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

  const updateUserProfile = useCallback((profileUpdate: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...profileUpdate }));
  }, []);

  const updateSettings = useCallback((settingsUpdate: Partial<UserSettings>) => {
    setUserProfile(prev => ({
      ...prev,
      settings: deepMerge(prev.settings, settingsUpdate),
    }));
  }, []);

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
      logEvent,
      userProfile,
      updateUserProfile,
      updateSettings,
    }),
    [isAuthenticated, login, logout, documents, addDocument, updateDocument, getDocument, getDocumentByShareId, logEvent, userProfile, updateUserProfile, updateSettings]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};