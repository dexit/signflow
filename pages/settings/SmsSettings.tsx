import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, Input, Button, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';
import { SmsConfig } from '../../types';

const SmsSettings: React.FC = () => {
  const { userProfile, updateSettings } = useContext(AppContext);
  const [settings, setSettings] = useState<SmsConfig>(userProfile.settings.sms);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings({ sms: settings });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  
  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value } as SmsConfig));
  };
  
  const handleProviderChange = (provider: 'twilio' | 'webhook') => {
    if (provider === 'twilio') {
        setSettings({
            provider: 'twilio', accountSid: '', authToken: '', twilioPhoneNumber: ''
        });
    } else {
        setSettings({ provider: 'webhook', url: '' });
    }
  };

  return (
    <div className="max-w-4xl">
      <Card>
        <CardHeader><CardTitle>SMS Settings</CardTitle></CardHeader>
        <CardContent>
            <Tabs defaultValue={settings.provider} onValueChange={val => handleProviderChange(val as any)}>
                <TabsList className="mb-6">
                    <TabsTrigger value="twilio">Twilio</TabsTrigger>
                    <TabsTrigger value="webhook">Webhook</TabsTrigger>
                </TabsList>

                <TabsContent value="twilio">
                    {settings.provider === 'twilio' && (
                        <div className="space-y-4 pt-6">
                          <Input label="Account SID" value={settings.accountSid} onChange={e => handleChange('accountSid', e.target.value)} />
                          <Input label="Auth Token" type="password" value={settings.authToken} onChange={e => handleChange('authToken', e.target.value)} />
                          <Input label="Twilio Phone Number" placeholder="+15017122661" value={settings.twilioPhoneNumber} onChange={e => handleChange('twilioPhoneNumber', e.target.value)} />
                        </div>
                    )}
                </TabsContent>
                
                 <TabsContent value="webhook">
                     {settings.provider === 'webhook' && (
                        <div className="space-y-4 pt-6">
                            <Input label="Webhook URL" placeholder="https://your-endpoint.com/sms-hook" value={settings.url} onChange={e => handleChange('url', e.target.value)} />
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

export default SmsSettings;