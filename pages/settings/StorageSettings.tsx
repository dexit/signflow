import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../../components/ui';

const StorageSettings: React.FC = () => {
  return (
    <div className="max-w-4xl">
      <Card>
        <CardHeader><CardTitle>Storage</CardTitle></CardHeader>
        <CardContent>
            <div className="flex flex-wrap gap-4 mb-6">
                <Button variant="primary">Disk</Button>
                <Button variant="secondary">AWS</Button>
                <Button variant="secondary">GCP</Button>
                <Button variant="secondary">Azure</Button>
            </div>
            <div className="p-4 bg-slate-100 border border-slate-200 rounded-md">
                <div className="flex">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-500 mr-3 mt-0.5 flex-shrink-0"><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" /></svg>
                    <div>
                        <h4 className="font-semibold text-slate-800">Store all files on disk</h4>
                        <p className="text-sm text-slate-600 mt-1">No configs are needed but make sure your disk is persistent (Not suitable for Heroku and other PaaS)</p>
                    </div>
                </div>
            </div>
            <div className="flex justify-end pt-6">
                <Button>Save</Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StorageSettings;