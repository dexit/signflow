import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, Input, Button, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';
import { EmailConfig } from '../../types';

const EmailSettings: React.FC = () => {
  const { userProfile, updateSettings } = useContext(AppContext);
  const [settings, setSettings] = useState<EmailConfig>(userProfile.settings.email);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings({ email: settings });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  
  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value } as EmailConfig));
  };
  
  const handleProviderChange = (provider: 'smtp' | 'msGraph' | 'webhook') => {
    if (provider === 'smtp') {
        setSettings({
            provider: 'smtp', smtpHost: '', smtpPort: '', smtpUsername: '', smtpPassword: '',
            smtpDomain: '', smtpAuth: 'plain', smtpSecurity: 'tls', sendFromEmail: ''
        });
    } else if (provider === 'msGraph') {
        setSettings({ provider: 'msGraph', clientId: '', tenantId: '', clientSecret: '' });
    } else {
        setSettings({ provider: 'webhook', url: '' });
    }
  };

  return (
    <div className="max-w-4xl">
      <Card>
        <CardHeader><CardTitle>Email Settings</CardTitle></CardHeader>
        <CardContent>
            <Tabs defaultValue={settings.provider} onValueChange={val => handleProviderChange(val as any)}>
                <TabsList className="mb-6">
                    <TabsTrigger value="smtp">SMTP</TabsTrigger>
                    <TabsTrigger value="msGraph">Microsoft Graph</TabsTrigger>
                    <TabsTrigger value="webhook">Webhook</TabsTrigger>
                </TabsList>

                <TabsContent value="smtp">
                    {settings.provider === 'smtp' && (
                        <div className="space-y-4">
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
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="msGraph">
                     {settings.provider === 'msGraph' && (
                        <div className="space-y-4">
                          <Input label="Client ID" value={settings.clientId} onChange={e => handleChange('clientId', e.target.value)} />
                          <Input label="Tenant ID" value={settings.tenantId} onChange={e => handleChange('tenantId', e.target.value)} />
                          <Input label="Client Secret" type="password" value={settings.clientSecret} onChange={e => handleChange('clientSecret', e.target.value)} />
                        </div>
                    )}
                </TabsContent>
                 <TabsContent value="webhook">
                     {settings.provider === 'webhook' && (
                        <div className="space-y-4">
                            <Input label="Webhook URL" placeholder="https://your-endpoint.com/email-hook" value={settings.url} onChange={e => handleChange('url', e.target.value)} />
                        </div>
                    )}
                </TabsContent>
            </Tabs>
          <div className="flex justify-end items-center pt-6 space-x-4">
            {saved && <p className="text-sm text-emerald-600">Settings saved!</p>}
            <Button onClick={handleSave}>Save</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailSettings;