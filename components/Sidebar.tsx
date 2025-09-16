import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui';
import { AppContext } from '../context/AppContext';

const Sidebar: React.FC = () => {
  const { logout } = React.useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinkClasses = (path: string) =>
    `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
      location.pathname.startsWith(path) ? 'bg-primary-100 text-primary-700' : 'text-slate-600 hover:bg-slate-200'
    }`;

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="flex items-center justify-center h-20 border-b border-slate-200">
        <div className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600"><path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v5"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10.4 12.6a2 2 0 1 1-3.4-2.9l1.4 1.4a2 2 0 1 0 3.4 2.9Z"/><path d="M13.4 15.6a2 2 0 1 1-3.4-2.9l1.4 1.4a2 2 0 1 0 3.4 2.9Z"/><path d="M16.4 18.6a2 2 0 1 1-3.4-2.9l1.4 1.4a2 2 0 1 0 3.4 2.9Z"/><path d="M5.4 16.6a2 2 0 1 1-3.4-2.9l1.4 1.4a2 2 0 1 0 3.4 2.9Z"/></svg>
            <span className="text-2xl font-bold text-slate-800">DocuSeal</span>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <NavLink to="/dashboard" className={navLinkClasses('/dashboard')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
            Dashboard
        </NavLink>
        <NavLink to="/documents" className={navLinkClasses('/documents')}>
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            Documents
        </NavLink>
        <NavLink to="/settings" className={navLinkClasses('/settings')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2.12l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2.12l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            Settings
        </NavLink>
      </nav>
      <div className="p-4 mt-auto border-t border-slate-200">
        <Button variant="secondary" onClick={handleLogout} className="w-full">
            Logout
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;