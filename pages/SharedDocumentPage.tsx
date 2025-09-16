import React, { useContext, useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import EditorPage from './EditorPage';
// Fix: Import the Button component to resolve the 'Cannot find name' error.
import { Spinner, Button } from '../components/ui';
import { Document } from '../types';

const SharedDocumentPage: React.FC = () => {
  const { shareId } = useParams<{ shareId: string }>();
  const navigate = useNavigate();
  const { getDocumentByShareId, isAuthenticated, login } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageContent, setPageContent] = useState<React.ReactNode | null>(null);

  useEffect(() => {
    if (!shareId) {
      setError("Invalid share link.");
      setIsLoading(false);
      return;
    }

    const result = getDocumentByShareId(shareId);

    if (!result) {
      setError("Document not found or the link may have expired.");
      setIsLoading(false);
      return;
    }

    const { doc, permission } = result;

    // For this simple app, we can auto-log in the user to view/edit shared docs.
    // In a real app, this would involve a different auth flow.
    if (!isAuthenticated) {
        login();
    }

    if (permission === 'edit') {
      // Redirect to the standard editor page
      navigate(`/editor/${doc.id}`, { replace: true });
    } else { // permission === 'view'
      // Render the EditorPage in a read-only state.
      // It is rendered outside the main AppLayout, so it won't have the main sidebar.
      setPageContent(<EditorPage isReadOnly={true} documentIdForView={doc.id} />);
    }

    setIsLoading(false);

  }, [shareId, getDocumentByShareId, navigate, isAuthenticated, login]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /><p className="ml-4 text-gray-600">Loading Shared Document...</p></div>;
  }

  if (error) {
    return (
        <div className="flex flex-col justify-center items-center h-screen text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mb-4"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            <h1 className="text-2xl font-bold">Access Error</h1>
            <p className="text-red-600 mt-2">{error}</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-6">Go to Dashboard</Button>
        </div>
    );
  }

  return <>{pageContent}</>;
};

export default SharedDocumentPage;