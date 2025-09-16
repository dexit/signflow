import React, { useContext, useState, useRef } from 'react';
import { AppContext } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, Accordion, AccordionItem, AccordionTrigger, AccordionContent, Input, Button } from '../../components/ui';

const PersonalizationSettings: React.FC = () => {
    const { userProfile, updateSettings } = useContext(AppContext);
    const [settings, setSettings] = useState(userProfile.settings.personalization);
    const [saved, setSaved] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        updateSettings({ personalization: settings });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleChange = (key: keyof typeof settings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleEmailChange = (key: keyof typeof settings.signatureRequestEmail, value: string) => {
        setSettings(prev => ({
            ...prev,
            signatureRequestEmail: {
                ...prev.signatureRequestEmail,
                [key]: value
            }
        }));
    };
    
    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleChange('companyLogo', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl">
            <Card>
                <CardHeader><CardTitle>Email Templates</CardTitle></CardHeader>
                <CardContent>
                    <Accordion defaultValue="signature-request">
                        <AccordionItem value="signature-request">
                            <AccordionTrigger>Signature Request Email</AccordionTrigger>
                            <AccordionContent className="space-y-4">
                                <Input 
                                    label="Subject" 
                                    value={settings.signatureRequestEmail.subject}
                                    onChange={e => handleEmailChange('subject', e.target.value)}
                                />
                                <textarea
                                    className="w-full p-2 border rounded-md min-h-[150px] text-sm"
                                    value={settings.signatureRequestEmail.body}
                                    onChange={e => handleEmailChange('body', e.target.value)}
                                />
                                <p className="text-xs text-slate-500">Variables: {"{{document_name}}"}, {"{{recipient_name}}"}, {"{{signing_link}}"} </p>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Company Logo</CardTitle></CardHeader>
                <CardContent>
                    <input type="file" accept="image/*" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" />
                    {settings.companyLogo ? (
                        <div className="flex items-center space-x-4">
                            <div className="p-2 border rounded-md bg-white">
                                <img src={settings.companyLogo} alt="Company Logo" className="h-16" />
                            </div>
                            <div>
                                <Button variant="secondary" onClick={() => logoInputRef.current?.click()}>Change Logo</Button>
                                <Button variant="ghost" onClick={() => handleChange('companyLogo', null)} className="ml-2">Remove</Button>
                            </div>
                        </div>
                    ) : (
                        <div 
                            className="border-2 border-dashed border-slate-300 rounded-md p-8 text-center cursor-pointer hover:bg-slate-50"
                            onClick={() => logoInputRef.current?.click()}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-slate-400 mb-2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                            <h3 className="text-sm font-medium text-slate-900">Upload your logo</h3>
                            <p className="mt-1 text-sm text-slate-500">PNG, JPG, GIF up to 5MB.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader><CardTitle>Submission Form</CardTitle></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <Input 
                                label="Completed Form Message"
                                placeholder="Your document has been signed." 
                                value={settings.completedFormMessage}
                                onChange={e => handleChange('completedFormMessage', e.target.value)}
                            />
                        </div>
                         <div>
                            <Input 
                                label="Completed Form Redirect URL"
                                placeholder="https://example.com/thank-you" 
                                value={settings.redirectUrl}
                                onChange={e => handleChange('redirectUrl', e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

             <div className="flex justify-end items-center space-x-4">
                {saved && <p className="text-sm text-emerald-600">Settings saved!</p>}
                <Button onClick={handleSave}>Save Changes</Button>
            </div>
        </div>
    );
};

export default PersonalizationSettings;