import React, { useContext } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { AppProvider, AppContext } from './context/AppContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EditorPage from './pages/EditorPage';
import SigningPage from './pages/SigningPage';
import UploadPage from './pages/UploadPage';
import Sidebar from './components/Sidebar';
import SharedDocumentPage from './pages/SharedDocumentPage';
import SettingsPage from './pages/SettingsPage';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useContext(AppContext);
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }
    
    // Editor page and Settings page have custom layouts
    if (location.pathname.startsWith('/editor') || location.pathname.startsWith('/settings')) {
       return <>{children}</>;
    }

    return (
        <div className="flex h-screen bg-slate-100 text-foreground">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 py-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

function App() {
  return (
    <AppProvider>
      <DndProvider backend={HTML5Backend}>
        <HashRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/sign/:documentId/:recipientId" element={<SigningPage />} />
            <Route path="/view/:shareId" element={<SharedDocumentPage />} />
            <Route path="/edit/:shareId" element={<SharedDocumentPage />} />
            
            <Route path="/dashboard" element={<AppLayout><DashboardPage /></AppLayout>} />
            <Route path="/upload" element={<Navigate to="/dashboard" />} />
            <Route path="/documents" element={<AppLayout><DashboardPage /></AppLayout>} />
            <Route path="/editor/:documentId" element={<EditorPage />} />
            <Route path="/settings/*" element={<SettingsPage />} />

            {/* Redirect root of authenticated app to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </HashRouter>
      </DndProvider>
    </AppProvider>
  );
}

export default App;