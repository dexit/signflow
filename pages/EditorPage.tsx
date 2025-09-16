import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDrag, useDrop } from 'react-dnd';
import { AppContext } from '../context/AppContext';
import { Document, FieldType, DocumentField, Recipient, DocumentStatus, Event } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Button, Modal, Input, Spinner, Tooltip, Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui';
import { useFieldDetector } from '../hooks/useFieldDetector';
// Fix: Import Sidebar component to resolve 'Cannot find name' error.
import Sidebar from '../components/Sidebar';

const ItemTypes = {
  FIELD: 'field',
  PLACED_FIELD: 'placed_field',
};

const RECIPIENT_COLORS = [
  { border: 'border-blue-500', bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  { border: 'border-emerald-500', bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  { border: 'border-amber-500', bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
  { border: 'border-purple-500', bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' },
  { border: 'border-pink-500', bg: 'bg-pink-100', text: 'text-pink-800', dot: 'bg-pink-500' },
  { border: 'border-indigo-500', bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-500' },
];

const getRecipientColor = (index: number) => RECIPIENT_COLORS[index % RECIPIENT_COLORS.length];
const getInitials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

const FieldIcons: Record<FieldType, React.FC<{className?: string}>> = {
  [FieldType.SIGNATURE]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.33 10.35a1.18 1.18 0 0 0-1.2.33l-2.43 2.91 4.25 4.25 2.44-2.92a1.18 1.18 0 0 0-.32-1.2l-2.74-3.37z"/><path d="M16 12.31 4.25 21.75l-1-3.5L14 3.25l3.5 1Z"/><path d="m15 5 3 3"/><path d="M4.25 21.75 2 22l.25-2.25"/></svg>,
  [FieldType.INITIALS]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m17 21-4.24-4.24"/><path d="M21 21H3"/><path d="M21 3H3"/><path d="M15 3h2a2 2 0 0 1 2 2v2"/><path d="M3 11V9a2 2 0 0 1 2-2h2"/></svg>,
  [FieldType.DATE]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
  [FieldType.NAME]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>,
  [FieldType.TEXT]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>,
  [FieldType.CHECKBOX]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  [FieldType.NUMBER]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16"/><path d="M4 18h16"/><path d="M4 6h16"/></svg>,
  [FieldType.IMAGE]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>,
  [FieldType.FILE]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>,
  [FieldType.RADIO]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>,
  [FieldType.SELECT]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><path d="m6 12 4 4 8-8"/></svg>,
  [FieldType.STAMP]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 5a2 2 0 0 0-2-2h-2.5a2 2 0 0 1-1.6-.8L12 1l-1.9 1.2a2 2 0 0 1-1.6.8H6a2 2 0 0 0-2 2v2.5a2 2 0 0 1-.8 1.6L2 12l1.2 1.9a2 2 0 0 1 .8 1.6V20a2 2 0 0 0 2 2h2.5a2 2 0 0 1 1.6.8L12 23l1.9-1.2a2 2 0 0 1 1.6-.8H20a2 2 0 0 0 2-2v-2.5a2 2 0 0 1 .8-1.6L22 12l-1.2-1.9a2 2 0 0 1-.8-1.6Z"/><path d="M12 8v4h4"/></svg>,
};


interface EditorPageProps {
  isReadOnly?: boolean;
  documentIdForView?: string;
}

const EditorPage: React.FC<EditorPageProps> = ({ isReadOnly = false, documentIdForView }) => {
    const { documentId: documentIdFromParams } = useParams<{ documentId: string }>();
    const documentId = documentIdForView || documentIdFromParams;

    const navigate = useNavigate();
    const { getDocument, updateDocument, userProfile, logEvent } = useContext(AppContext);
    
    const [doc, setDoc] = useState<Document | null>(() => getDocument(documentId!) || null);

    const [pdfPages, setPdfPages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
    const [isSendModalOpen, setSendModalOpen] = useState(false);
    const [isLeftSidebarOpen, setLeftSidebarOpen] = useState(true);
    const [isRightSidebarOpen, setRightSidebarOpen] = useState(true);

    const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        if (!doc) {
            navigate('/dashboard');
            return;
        }
        if(doc.recipients.length > 0 && !selectedRecipientId){
            setSelectedRecipientId(doc.recipients[0].id)
        } else if (doc.recipients.length === 0) {
            setSelectedRecipientId('');
        }
    }, [doc, navigate, selectedRecipientId]);

    const renderPdf = useCallback(async (fileData: string) => {
      setLoading(true);
      const pdfJS = await import('pdfjs-dist/build/pdf.min.mjs');
      pdfJS.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfJS.version}/build/pdf.worker.min.mjs`;

      const pdf = await pdfJS.getDocument(fileData).promise;
      const pages: string[] = [];
      const pageDimensions: { width: number, height: number }[] = [];
      pageRefs.current = [...Array(pdf.numPages)];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        pageDimensions.push({ width: viewport.width, height: viewport.height });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');
        if (context) {
          await page.render({ canvasContext: context, viewport: viewport }).promise;
          pages.push(canvas.toDataURL('image/png'));
        }
      }
      setPdfPages(pages);
      
      if(doc && !doc.pageDimensions) {
          setDoc({ ...doc, pageDimensions });
      }
      
      setLoading(false);
    }, [doc]);

    useEffect(() => {
        if (doc?.file) {
            renderPdf(doc.file);
        }
    }, [doc?.file, renderPdf]);
    
    useEffect(() => {
        if(doc && !isReadOnly) {
            const timer = setTimeout(() => updateDocument(doc), 500);
            return () => clearTimeout(timer);
        }
    }, [doc, updateDocument, isReadOnly]);
    
    const handleSend = () => {
        if(!doc) return;
        if(doc.recipients.length === 0) {
            alert("Please add at least one recipient."); return;
        }
        if(doc.fields.length === 0) {
            alert("Please add at least one field to the document."); return;
        }
        setSendModalOpen(true);
    };

    const confirmSend = () => {
        if(!doc) return;
        const baseUrl = `${window.location.origin}${window.location.pathname}#`;
        const updatedRecipients = doc.recipients.map(r => ({
            ...r,
            signingUrl: `${baseUrl}/sign/${doc.id}/${r.id}`
        }));
        
        const updatedDoc = {
            ...doc,
            recipients: updatedRecipients,
            status: DocumentStatus.SENT,
        };
        updateDocument(updatedDoc);
        setDoc(updatedDoc);
        logEvent(doc.id, 'document.sent', `Document sent to ${doc.recipients.length} recipient(s).`);
        setSendModalOpen(false);
    }
    
    const handleSignYourself = () => {
        if (!doc) return;

        const adminEmail = 'admin@docuseal.com';
        let selfRecipient = doc.recipients.find(r => r.email === adminEmail);
        let updatedDoc = doc;

        if (!selfRecipient) {
            const newRecipient: Recipient = {
                id: uuidv4(),
                name: "Admin User",
                email: adminEmail,
                status: 'Pending',
            };
            updatedDoc = { ...doc, recipients: [...doc.recipients, newRecipient] };
            setDoc(updatedDoc);
            logEvent(doc.id, 'recipient.added', `Recipient "Admin User" was added for self-signing.`);
            selfRecipient = newRecipient;
        }
        
        navigate(`/sign/${doc.id}/${selfRecipient.id}`);
    };
    
    if (loading || !doc) {
      return (
        <div className="flex h-screen bg-slate-100">
            <Sidebar />
            <div className="flex-1 flex justify-center items-center">
                <Spinner size="lg" /><p className="ml-4 text-slate-600">Preparing Document...</p>
            </div>
        </div>
      );
    }
    
    const handleFieldDrop = (item: { type: FieldType }, page: number, dropX: number, dropY: number) => {
        if (!selectedRecipientId || isReadOnly) return;
        const newField: DocumentField = {
            id: uuidv4(),
            type: item.type,
            page,
            x: dropX,
            y: dropY,
            width: 150,
            height: item.type === FieldType.CHECKBOX ? 20 : 40,
            recipientId: selectedRecipientId,
        };
        const updatedDoc = { ...doc, fields: [...doc.fields, newField] };
        setDoc(updatedDoc);
    };

    const handlePlacedFieldMove = (field: DocumentField, deltaX: number, deltaY: number) => {
        if (isReadOnly) return;
        const updatedFields = doc.fields.map(f =>
            f.id === field.id ? { ...f, x: f.x + deltaX, y: f.y + deltaY } : f
        );
        const updatedDoc = { ...doc, fields: updatedFields };
        setDoc(updatedDoc);
    };

    return (
    <div className="flex h-screen bg-slate-100 text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 bg-white border-b border-slate-200 z-20">
            <div className="flex items-center justify-between p-4 h-20">
                <div className="flex items-center min-w-0">
                    <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={() => setLeftSidebarOpen(!isLeftSidebarOpen)}>
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
                    </Button>
                    <h2 className="text-xl font-bold text-slate-800 truncate" title={doc.name}>{doc.name}</h2>
                </div>
                 <div className="flex items-center space-x-2">
                    <Button variant="secondary" onClick={() => navigate('/dashboard')}>Back</Button>
                     {(!isReadOnly && doc.status === DocumentStatus.DRAFT) && (
                        <>
                            <Button variant="secondary" onClick={handleSignYourself}>Sign Yourself</Button>
                            <Button onClick={handleSend}>Send</Button>
                        </>
                     )}
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setRightSidebarOpen(!isRightSidebarOpen)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="16" y1="6" y2="6"/><line x1="3" x2="16" y1="12" y2="12"/><line x1="3" x2="16" y1="18" y2="18"/><line x1="21" x2="21.01" y1="6" y2="6"/><line x1="21" x2="21.01" y1="12" y2="12"/><line x1="21" x2="21.01" y1="18" y2="18"/></svg>
                    </Button>
                </div>
            </div>
        </header>

        {/* Editor Body */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Left Thumbnails */}
          <aside className={`flex-shrink-0 bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto transition-all duration-300 w-48 
            ${isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
            absolute md:relative h-full md:translate-x-0 z-10`}>
              <h3 className="font-semibold text-sm mb-4">Pages</h3>
              <div className="space-y-4">
                  {pdfPages.map((pageData, index) => (
                      <div key={index} onClick={() => pageRefs.current[index]?.scrollIntoView({ behavior: 'smooth' })} className="cursor-pointer border-2 border-transparent hover:border-primary-500 rounded-md overflow-hidden">
                          <img src={pageData} alt={`Page ${index+1} thumbnail`} className="w-full h-auto"/>
                          <p className="text-center text-xs p-1 bg-white">{index+1}</p>
                      </div>
                  ))}
              </div>
          </aside>

          {/* Main Content - PDF Viewer */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-200">
            <div className="max-w-4xl mx-auto">
              {pdfPages.map((pageData, index) => (
                  <PdfPage 
                      key={index}
                      pageIndex={index}
                      pageData={pageData}
                      fields={doc.fields.filter(f => f.page === index)}
                      onFieldDrop={handleFieldDrop}
                      onPlacedFieldMove={handlePlacedFieldMove}
                      ref={el => { pageRefs.current[index] = el; }}
                  />
              ))}
            </div>
          </main>
          
          {/* Right Sidebar */}
          <aside className={`flex-shrink-0 bg-white border-l border-slate-200 p-4 overflow-y-auto transition-all duration-300 w-80 
            ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
            absolute md:relative right-0 h-full md:translate-x-0 z-10`}>
            {(doc.status === DocumentStatus.DRAFT && !isReadOnly) ? (
              <DraftSidebar doc={doc} setDoc={setDoc} selectedRecipientId={selectedRecipientId} setSelectedRecipientId={setSelectedRecipientId} logEvent={logEvent} pdfPages={pdfPages} />
            ) : (
              <SubmissionsSidebar doc={doc} />
            )}
          </aside>
        </div>
        
        <SendModal isOpen={isSendModalOpen} onClose={() => setSendModalOpen(false)} onConfirm={confirmSend} doc={doc} />
      </div>
    </div>
  );
};


const DraftSidebar: React.FC<{
  doc: Document;
  setDoc: (doc: Document) => void;
  selectedRecipientId: string;
  setSelectedRecipientId: (id: string) => void;
  logEvent: (id: string, type: any, msg: string) => void;
  pdfPages: string[];
}> = ({ doc, setDoc, selectedRecipientId, setSelectedRecipientId, logEvent, pdfPages }) => {
  const [isRecipientModalOpen, setRecipientModalOpen] = useState(false);
  const [isNoRecipientAlertOpen, setNoRecipientAlertOpen] = useState(false);
  const selectedRecipient = doc.recipients.find(r => r.id === selectedRecipientId);
  const { isDetecting, detectFields } = useFieldDetector();

  const handleAutoDetect = async () => {
    if (doc.recipients.length === 0) {
      setNoRecipientAlertOpen(true);
      return;
    }

    const detected = await detectFields(pdfPages);
    if (detected && detected.length > 0) {
      const recipientToAssign = selectedRecipientId || doc.recipients[0].id;
      const newFields: DocumentField[] = detected.map(f => ({
        ...f,
        id: uuidv4(),
        recipientId: recipientToAssign,
      }));
      setDoc({ ...doc, fields: [...doc.fields, ...newFields] });
      logEvent(doc.id, 'document.edited' as any, `Auto-detected and added ${newFields.length} fields.`);
    } else if (detected) {
        alert("No fields were detected in the document.");
    }
  };

  return (
    <div>
      <h3 className="font-bold text-lg mb-4">Recipients</h3>
      <div className="space-y-2 mb-4">
        {doc.recipients.map((r, index) => {
          const color = getRecipientColor(index);
          return (
            <div key={r.id} onClick={() => setSelectedRecipientId(r.id)} 
                 className={`p-3 rounded-md cursor-pointer flex items-center justify-between ${selectedRecipientId === r.id ? `bg-primary-100 ring-2 ring-primary-500` : 'bg-slate-100 hover:bg-slate-200'}`}>
              <div className="flex items-center min-w-0">
                  <span className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${color.dot}`}></span>
                  <div className="min-w-0">
                      <p className={`font-semibold text-sm truncate ${selectedRecipientId === r.id ? 'text-primary-900' : 'text-slate-900'}`}>{r.name}</p>
                      <p className={`text-xs truncate ${selectedRecipientId === r.id ? 'text-primary-800' : 'text-slate-500'}`}>{r.email}</p>
                  </div>
              </div>
            </div>
          );
        })}
      </div>
      <Button variant="secondary" onClick={() => setRecipientModalOpen(true)} className="w-full mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        Add Recipient
      </Button>

      <AddRecipientModal 
        isOpen={isRecipientModalOpen} 
        onClose={() => setRecipientModalOpen(false)}
        onAddRecipients={(newRecipients) => {
          const updatedDoc = { ...doc, recipients: [...doc.recipients, ...newRecipients]};
          setDoc(updatedDoc);
          newRecipients.forEach(r => logEvent(doc.id, 'recipient.added', `Recipient "${r.name}" was added.`));
          if (!selectedRecipientId && newRecipients.length > 0) {
            setSelectedRecipientId(newRecipients[0].id);
          }
        }}
      />
      
      <hr className="my-6"/>
      
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg">Fields</h3>
        <Button variant="secondary" size="sm" onClick={handleAutoDetect} disabled={isDetecting}>
          {isDetecting ? <Spinner size="sm"/> : 
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M9.5 2.5a1.5 1.5 0 0 1 3 0"/><path d="M6.02 5.21a1.5 1.5 0 0 1 2.1 0l.98.98a1.5 1.5 0 0 1 0 2.12l-6.2 6.2a1.5 1.5 0 0 1-2.12 0l-.98-.98a1.5 1.5 0 0 1 0-2.12L6.02 5.2Z"/><path d="m15.5 6.5 3 3"/><path d="M12.5 9.5 9.5 6.5"/><path d="m6.5 12.5 3 3"/><path d="m3.5 15.5 3 3"/><path d="M18 11.5a1.5 1.5 0 0 1 3 0"/><path d="M21.5 14.5a1.5 1.5 0 0 1 0 3"/><path d="M18.5 21.5a1.5 1.5 0 0 1-3 0"/></svg>
          }
          {isDetecting ? 'Detecting...' : 'Auto-detect'}
        </Button>
      </div>
      <p className="text-sm text-slate-500 mb-4">For <span className="font-bold text-primary-700">{selectedRecipient?.name || '...'}</span></p>
      <div className="grid grid-cols-2 gap-2">
          {Object.values(FieldType).map(type => (
              <DraggableField key={type} type={type} disabled={!selectedRecipientId} />
          ))}
      </div>
      <Modal isOpen={isNoRecipientAlertOpen} onClose={() => setNoRecipientAlertOpen(false)} title="Add a Recipient" size="md">
        <p>Please add at least one recipient before auto-detecting fields.</p>
        <div className="mt-6 flex justify-end">
            <Button onClick={() => setNoRecipientAlertOpen(false)}>OK</Button>
        </div>
      </Modal>
    </div>
  );
};

const SubmissionsSidebar: React.FC<{ doc: Document }> = ({ doc }) => {
  return (
    <Tabs defaultValue="submissions">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="submissions">Submissions</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      <TabsContent value="submissions">
         <div className="space-y-3">
          {doc.recipients.map((r, index) => {
            const color = getRecipientColor(index);
             const getStatusPill = () => {
                switch(r.status) {
                    case 'Signed': return <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Completed</span>;
                    case 'Opened': return <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Opened</span>;
                    default: return <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">Sent</span>;
                }
            };
            return (
              <div key={r.id} className="bg-slate-50 p-3 rounded-md border border-slate-200">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center min-w-0">
                      <span className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${color.dot}`}></span>
                      <p className="font-semibold text-sm truncate text-slate-900">{r.name}</p>
                  </div>
                  {getStatusPill()}
                </div>
                <p className="text-xs text-slate-500 truncate">{r.email}</p>
              </div>
            )
          })}
        </div>
      </TabsContent>
      <TabsContent value="history">
        <div className="space-y-4">
            {[...doc.events].reverse().map(event => (
                <div key={event.id} className="flex">
                    <div className="w-8 flex-shrink-0 flex justify-center">
                        <div className="w-px bg-slate-300 h-full"></div>
                        <div className="absolute w-3 h-3 bg-slate-300 rounded-full mt-1"></div>
                    </div>
                    <div className="pl-4 pb-4">
                        <p className="text-sm font-medium text-slate-800">{event.message}</p>
                        <p className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleString()}</p>
                    </div>
                </div>
            ))}
        </div>
      </TabsContent>
    </Tabs>
  );
};


const PdfPage = React.forwardRef<HTMLDivElement, {
    pageIndex: number, pageData: string, fields: DocumentField[],
    onFieldDrop: (item: { type: FieldType }, page: number, x: number, y: number) => void,
    onPlacedFieldMove: (field: DocumentField, deltaX: number, deltaY: number) => void
}>(({ pageIndex, pageData, fields, onFieldDrop, onPlacedFieldMove }, ref) => {
    
    const pageContainerRef = useRef<HTMLDivElement>(null);
    const [, drop] = useDrop(() => ({
        accept: ItemTypes.FIELD,
        drop: (item: { type: FieldType }, monitor) => {
            const offset = monitor.getClientOffset();
            const pageRect = pageContainerRef.current?.getBoundingClientRect();
            if (offset && pageRect) {
                const x = offset.x - pageRect.left;
                const y = offset.y - pageRect.top;
                onFieldDrop(item, pageIndex, x, y);
            }
        },
    }), [pageIndex]);

    return (
        <div ref={ref}>
            <div ref={pageContainerRef} className="relative shadow-lg mb-8 bg-white">
                <div ref={drop as any} className="absolute inset-0 z-10">
                    {fields.map((field) => (
                        <PlacedField key={field.id} field={field} onMove={onPlacedFieldMove} />
                    ))}
                </div>
                <img src={pageData} alt={`Page ${pageIndex + 1}`} className="w-full h-auto" />
            </div>
        </div>
    );
});

const PlacedField: React.FC<{
    field: DocumentField,
    onMove: (field: DocumentField, deltaX: number, deltaY: number) => void
}> = ({ field, onMove }) => {
    const { getDocument } = useContext(AppContext);
    const doc = getDocument(useParams<{documentId: string}>().documentId!)!;
    const recipientIndex = doc.recipients.findIndex(r => r.id === field.recipientId);
    const color = getRecipientColor(recipientIndex);

    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.PLACED_FIELD,
        item: { id: field.id },
        end: (item, monitor) => {
            const delta = monitor.getDifferenceFromInitialOffset();
            if (delta) {
                onMove(field, delta.x, delta.y);
            }
        },
        collect: monitor => ({ isDragging: !!monitor.isDragging() }),
    }), [field, onMove]);
    
    return (
        <div
            ref={drag as any}
            style={{ left: field.x, top: field.y, width: field.width, height: field.height }}
            className={`absolute flex items-center justify-center cursor-move p-1 ${isDragging ? 'opacity-50' : ''} ${color.border} border-2 rounded`}
        >
            <div className={`w-full h-full ${color.bg} opacity-50`}></div>
            <div className="absolute text-center">
                <p className={`text-xs font-bold ${color.text}`}>{getInitials(doc.recipients[recipientIndex]?.name || '??')}</p>
                <p className={`text-[8px] ${color.text}`}>{field.type}</p>
            </div>
        </div>
    );
};

const AddRecipientModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAddRecipients: (recipients: Recipient[]) => void;
}> = ({ isOpen, onClose, onAddRecipients }) => {
    const [recipients, setRecipients] = useState([{ name: '', email: '', phone: '' }]);

    const handleAdd = () => {
        const newRecipients = recipients
            .filter(r => r.name && r.email)
            .map(r => ({ ...r, id: uuidv4(), status: 'Pending' as const }));
        onAddRecipients(newRecipients);
        setRecipients([{ name: '', email: '', phone: '' }]);
        onClose();
    };
    
    const updateRecipient = (index: number, field: 'name' | 'email' | 'phone', value: string) => {
        const updated = [...recipients];
        updated[index][field] = value;
        setRecipients(updated);
    };

    const addRecipientField = () => setRecipients([...recipients, { name: '', email: '', phone: '' }]);
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Recipients" size="xl">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
                {recipients.map((r, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
                        <Input label="Name" value={r.name} onChange={e => updateRecipient(index, 'name', e.target.value)} placeholder="John Doe"/>
                        <Input label="Email" value={r.email} onChange={e => updateRecipient(index, 'email', e.target.value)} type="email" placeholder="john.doe@email.com"/>
                    </div>
                ))}
            </div>
             <Button variant="link" onClick={addRecipientField} className="mt-4">Add Another</Button>
            <div className="mt-6 flex justify-end space-x-2">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button variant="primary" onClick={handleAdd}>Add Recipients</Button>
            </div>
        </Modal>
    );
};


const SendModal: React.FC<{ isOpen: boolean, onClose: () => void, onConfirm: () => void, doc: Document }> = ({ isOpen, onClose, onConfirm, doc }) => {
    const { userProfile } = useContext(AppContext);
    const { subject, body } = userProfile.settings.personalization.signatureRequestEmail;

    const populatedBody = body
        .replace(/{{document_name}}/g, doc.name)
        .replace(/{{recipient_name}}/g, '[Recipient Name]')
        .replace(/{{signing_link}}/g, '[Signing Link]');

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Send Document" size="xl">
            <div className="space-y-4">
                <p>The following email will be simulated as sent to all recipients. In a real application, each recipient would receive a unique link.</p>
                <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
                    <p className="text-sm font-semibold">Subject: {subject.replace('{{document_name}}', doc.name)}</p>
                    <hr className="my-2"/>
                    <p className="text-sm whitespace-pre-wrap">{populatedBody}</p>
                </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button variant="primary" onClick={onConfirm}>Confirm and Send</Button>
            </div>
        </Modal>
    )
}

const DraggableField: React.FC<{ type: FieldType; disabled: boolean; }> = ({ type, disabled }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.FIELD,
        item: { type },
        canDrag: !disabled,
        collect: monitor => ({ isDragging: !!monitor.isDragging() }),
    }));
    const Icon = FieldIcons[type];
    return (
        <Tooltip content={disabled ? "Select a recipient first" : `Drag to add a ${type} field`}>
            <div ref={drag as any} className={`flex items-center p-2 border rounded-md ${disabled ? 'cursor-not-allowed bg-slate-100 text-slate-400' : 'cursor-move bg-white hover:bg-slate-50'} ${isDragging ? 'opacity-50 bg-primary-100' : ''}`}>
                <Icon className="w-5 h-5 mr-2"/>
                <span className="text-sm">{type.charAt(0) + type.slice(1).toLowerCase()}</span>
            </div>
        </Tooltip>
    );
};

export default EditorPage;
