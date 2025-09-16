import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Input, Button } from '../../components/ui';

const EmailSettings: React.FC = () => {
  return (
    <div className="max-w-4xl">
      <Card>
        <CardHeader><CardTitle>Email SMTP</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Host" id="host" placeholder="smtp.example.com" />
            <Input label="Port" id="port" placeholder="587" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Username" id="username" placeholder="your_username" />
            <Input label="Password" id="password" type="password" placeholder="••••••••" />
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Domain (optional)" id="domain" placeholder="example.com" />
            {/* Replace with a Select component when available */}
            <Input label="Authentication" id="auth" placeholder="Plain" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">SMTP Security</label>
            <div className="flex space-x-4">
                <label className="flex items-center"><input type="radio" name="smtp-security" className="mr-2" defaultChecked /> Auto</label>
                <label className="flex items-center"><input type="radio" name="smtp-security" className="mr-2" /> SSL</label>
                <label className="flex items-center"><input type="radio" name="smtp-security" className="mr-2" /> TLS</label>
                <label className="flex items-center"><input type="radio" name="smtp-security" className="mr-2" /> Noverify</label>
            </div>
          </div>
          <Input label="Send from Email" id="from-email" placeholder="no-reply@example.com" />
          <div className="flex justify-end pt-4">
             <Button>Save</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailSettings;