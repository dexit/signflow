import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, Input, Button } from '../../components/ui';

const EmailSettings: React.FC = () => {
  const { userProfile, updateSettings } = useContext(AppContext);
  const [settings, setSettings] = useState(userProfile.settings.email);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings({ email: settings });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  
  const handleChange = (key: keyof typeof settings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-4xl">
      <Card>
        <CardHeader><CardTitle>Email SMTP</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Host" id="host" placeholder="smtp.example.com" value={settings.smtpHost} onChange={e => handleChange('smtpHost', e.target.value)} />
            <Input label="Port" id="port" placeholder="587" value={settings.smtpPort} onChange={e => handleChange('smtpPort', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Username" id="username" placeholder="your_username" value={settings.smtpUsername} onChange={e => handleChange('smtpUsername', e.target.value)} />
            <Input label="Password" id="password" type="password" placeholder="••••••••" value={settings.smtpPassword} onChange={e => handleChange('smtpPassword', e.target.value)} />
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Domain (optional)" id="domain" placeholder="example.com" value={settings.smtpDomain} onChange={e => handleChange('smtpDomain', e.target.value)} />
            <div>
              <label htmlFor="auth" className="block text-sm font-medium text-slate-700 mb-1">Authentication</label>
              <select id="auth" value={settings.smtpAuth} onChange={e => handleChange('smtpAuth', e.target.value)} className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm">
                <option value="plain">Plain</option>
                <option value="login">Login</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">SMTP Security</label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
                <label className="flex items-center"><input type="radio" name="smtp-security" value="auto" checked={settings.smtpSecurity === 'auto'} onChange={e => handleChange('smtpSecurity', e.target.value)} className="mr-2" /> Auto</label>
                <label className="flex items-center"><input type="radio" name="smtp-security" value="ssl" checked={settings.smtpSecurity === 'ssl'} onChange={e => handleChange('smtpSecurity', e.target.value)} className="mr-2" /> SSL</label>
                <label className="flex items-center"><input type="radio" name="smtp-security" value="tls" checked={settings.smtpSecurity === 'tls'} onChange={e => handleChange('smtpSecurity', e.target.value)} className="mr-2" /> TLS</label>
                <label className="flex items-center"><input type="radio" name="smtp-security" value="noverify" checked={settings.smtpSecurity === 'noverify'} onChange={e => handleChange('smtpSecurity', e.target.value)} className="mr-2" /> Noverify</label>
            </div>
          </div>
          <Input label="Send from Email" id="from-email" placeholder="no-reply@example.com" value={settings.sendFromEmail} onChange={e => handleChange('sendFromEmail', e.target.value)} />
          <div className="flex justify-end items-center pt-4 space-x-4">
            {saved && <p className="text-sm text-emerald-600">Settings saved!</p>}
            <Button onClick={handleSave}>Save</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailSettings;