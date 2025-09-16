import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Accordion, AccordionItem, AccordionTrigger, AccordionContent, Input, Button } from '../../components/ui';

const PersonalizationSettings: React.FC = () => {
    return (
        <div className="space-y-8 max-w-4xl">
            <Card>
                <CardHeader><CardTitle>Email Templates</CardTitle></CardHeader>
                <CardContent>
                    <Accordion defaultValue="signature-request">
                        <AccordionItem value="signature-request">
                            <AccordionTrigger>Signature Request Email</AccordionTrigger>
                            <AccordionContent><p className="text-sm text-slate-500">Template settings will go here.</p></AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="documents-copy">
                            <AccordionTrigger>Documents Copy Email</AccordionTrigger>
                            <AccordionContent><p className="text-sm text-slate-500">Template settings will go here.</p></AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="completed-notification">
                            <AccordionTrigger>Completed Notification Email</AccordionTrigger>
                            <AccordionContent><p className="text-sm text-slate-500">Template settings will go here.</p></AccordionContent>
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
                    <Accordion>
                        <AccordionItem value="form-message">
                            <AccordionTrigger>Completed Form Message</AccordionTrigger>
                            <AccordionContent><Input placeholder="Your document has been signed." /></AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="form-redirect">
                            <AccordionTrigger>Completed Form Redirect Button</AccordionTrigger>
                            <AccordionContent><Input placeholder="https://example.com/thank-you" /></AccordionContent>
                        </AccordionItem>
                         <AccordionItem value="policy-links">
                            <AccordionTrigger>Policy Links</AccordionTrigger>
                            <AccordionContent><p className="text-sm text-slate-500">Policy link settings will go here.</p></AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>

             <div className="flex justify-end">
                <Button>Save Changes</Button>
            </div>
        </div>
    );
};

export default PersonalizationSettings;