import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, Accordion, AccordionItem, AccordionTrigger, AccordionContent, Input, Button } from '../../components/ui';

const PersonalizationSettings: React.FC = () => {
    const { userProfile, updateSettings } = useContext(AppContext);
    const [settings, setSettings] = useState(userProfile.settings.personalization);
    const [saved, setSaved] = useState(false);

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
                <CardContent className="bg-slate-50 border border-slate-200 rounded-md p-6 text-center">
                     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-400 inline mr-2"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" /></svg>
                     <span className="font-semibold">Unlock with DocuSeal Pro</span>
                     <p className="text-sm text-slate-500 mt-1">Display your company name and logo when signing documents.</p>
                     <Button variant="link" className="text-sm">Learn More</Button>
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