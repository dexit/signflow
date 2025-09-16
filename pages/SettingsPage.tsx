import React from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import EsignatureSettings from './settings/EsignatureSettings';
import PersonalizationSettings from './settings/PersonalizationSettings';
import EmailSettings from './settings/EmailSettings';
import StorageSettings from './settings/StorageSettings';
import SmsSettings from './settings/SmsSettings';

const settingsNav = [
    { name: 'E-Signature', path: 'e-signature', component: <EsignatureSettings /> },
    { name: 'Personalization', path: 'personalization', component: <PersonalizationSettings /> },
    { name: 'Email', path: 'email', component: <EmailSettings /> },
    { name: 'SMS', path: 'sms', component: <SmsSettings /> },
    { name: 'Storage', path: 'storage', component: <StorageSettings /> },
    // Add placeholders for other settings pages
    { name: 'Profile', path: 'profile' },
    { name: 'Account', path: 'account' },
    { name: 'Notifications', path: 'notifications' },
    { name: 'Users', path: 'users' },
    { name: 'API', path: 'api' },
    { name: 'Webhooks', path: 'webhooks' },
    { name: 'Plans', path: 'plans' },
];

const SettingsPage: React.FC = () => {
    
    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
      `block px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive ? 'bg-primary-100 text-primary-700' : 'text-slate-600 hover:bg-slate-100'
      }`;
      
    return (
        <div className="flex h-screen bg-slate-100 text-slate-900">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                 <header className="flex-shrink-0 bg-white border-b border-slate-200 z-10">
                    <div className="flex items-center justify-between p-4 h-20">
                        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
                    </div>
                </header>
                <div className="flex flex-1 overflow-hidden">
                    {/* Settings Sidebar */}
                    <aside className="w-64 bg-white border-r border-slate-200 p-6 overflow-y-auto">
                        <nav className="space-y-1">
                            {settingsNav.map(item => (
                                <NavLink
                                    key={item.name}
                                    to={item.path}
                                    className={navLinkClasses}
                                >
                                    {item.name}
                                </NavLink>
                            ))}
                        </nav>
                    </aside>
                    {/* Settings Content */}
                    <main className="flex-1 overflow-y-auto p-8">
                        <Routes>
                             {settingsNav.filter(item => item.component).map(item => (
                                <Route key={item.path} path={item.path} element={item.component} />
                             ))}
                            <Route path="*" element={<Navigate to="e-signature" replace />} />
                        </Routes>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
