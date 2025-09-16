import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '../../components/ui';
import { StorageConfig } from '../../types';

type Provider = StorageConfig['provider'];

const providerInfo = {
    disk: { title: 'Store all files on disk', description: 'No configs are needed but make sure your disk is persistent (Not suitable for Heroku and other PaaS)' },
    aws: { title: 'Store files on AWS S3', description: 'Amazon S3 is a scalable cloud storage service. Configuration required.' },
    gcp: { title: 'Store files on Google Cloud Storage', description: 'GCS offers durable and highly available object storage. Configuration required.' },
    azure: { title: 'Store files on Azure Blob Storage', description: 'Azure Blob Storage is Microsoft\'s object storage solution. Configuration required.' },
    postgresql: { title: 'Store files in PostgreSQL', description: 'Store files directly in your PostgreSQL database as bytea. Requires a connection URL.' }
};

const StorageSettings: React.FC = () => {
  const { userProfile, updateSettings } = useContext(AppContext);
  const [settings, setSettings] = useState<StorageConfig>(userProfile.settings.storage);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings({ storage: settings });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };
  
  const handleProviderChange = (provider: Provider) => {
    if (provider === 'postgresql') {
      setSettings({ provider: 'postgresql', connectionUrl: '' });
    } else {
      setSettings({ provider });
    }
  };

  const handleUrlChange = (url: string) => {
    if (settings.provider === 'postgresql') {
      setSettings({ ...settings, connectionUrl: url });
    }
  };

  return (
    <div className="max-w-4xl">
      <Card>
        <CardHeader><CardTitle>Storage</CardTitle></CardHeader>
        <CardContent>
            <div className="flex flex-wrap gap-2 mb-6">
                {(Object.keys(providerInfo) as Provider[]).map(p => (
                    <Button key={p} variant={settings.provider === p ? 'primary' : 'secondary'} onClick={() => handleProviderChange(p)}>
                        {p === 'postgresql' ? 'PostgreSQL' : p.toUpperCase()}
                    </Button>
                ))}
            </div>
            
            {settings.provider === 'postgresql' && (
                 <div className="mb-6">
                    <Input 
                        label="PostgreSQL Connection URL"
                        placeholder="postgresql://user:password@host:port/database"
                        value={settings.connectionUrl}
                        onChange={e => handleUrlChange(e.target.value)}
                    />
                </div>
            )}
            
            <div className="p-4 bg-slate-100 border border-slate-200 rounded-md">
                <div className="flex">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-500 mr-3 mt-0.5 flex-shrink-0"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" /></svg>
                    <div>
                        <h4 className="font-semibold text-slate-800">{providerInfo[settings.provider].title}</h4>
                        <p className="text-sm text-slate-600 mt-1">{providerInfo[settings.provider].description}</p>
                    </div>
                </div>
            </div>
            <div className="flex justify-end items-center pt-6 space-x-4">
                {saved && <p className="text-sm text-emerald-600">Settings saved!</p>}
                <Button onClick={handleSave}>Save</Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StorageSettings;
