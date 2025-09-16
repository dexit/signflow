import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDrag, useDrop } from 'react-dnd';
import { AppContext } from '../context/AppContext';
import { Document, FieldType, DocumentField, Recipient, DocumentStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Button, Modal, Input, Spinner, Tooltip } from '../components/ui';
import { usePdfGenerator } from '../hooks/usePdfGenerator';
import { useDocumentHistory } from '../hooks/useDocumentHistory';
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
  [FieldType.SIGNATURE]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M16.53 11.23a.75.75 0 0 0-1.06-1.06L12 13.69 8.53 10.23a.75.75 0 0 0-1.06 1.06l4 4a.75.75 0 0 0 1.06 0l4-4Z"></path></svg>,
  [FieldType.INITIALS]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M12.97 3.97a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 1 1-1.06-1.06l6.22-6.22H3a.75.75 0 0 1 0-1.5h16.19l-6.22-6.22a.75.75 0 0 1 0-1.06Z" clipRule="evenodd"></path></svg>,
  [FieldType.DATE]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd"></path></svg>,
  [FieldType.NAME]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd"></path></svg>,
  [FieldType.TEXT]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M4.125 3C3.504 3 3 3.504 3 4.125v3.75C3 8.496 3.504 9 4.125 9h15.75C20.496 9 21 8.496 21 7.875v-3.75C21 3.504 20.496 3 19.875 3H4.125ZM4.5 10.5a.75.75 0 0 0 0 1.5h15a.75.75 0 0 0 0-1.5h-15ZM4.5 15a.75.75 0 0 0 0 1.5h15a.75.75 0 0 0 0-1.5h-15Z" clipRule="evenodd"></path></svg>,
  [FieldType.CHECKBOX]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd"></path></svg>,
  [FieldType.NUMBER]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M11.25 3.375A4.125 4.125 0 0 0 7.125 7.5v9A4.125 4.125 0 0 0 11.25 20.625h1.5A4.125 4.125 0 0 0 16.875 16.5v-9A4.125 4.125 0 0 0 12.75 3.375h-1.5ZM9.123 7.5a2.123 2.123 0 0 1 2.127-2.125h1.5a2.123 2.123 0 0 1 2.127 2.125v9a2.123 2.123 0 0 1-2.127 2.125h-1.5a2.123 2.123 0 0 1-2.127-2.125v-9Z"></path></svg>,
  [FieldType.IMAGE]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5a.75.75 0 0 0 .75-.75v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd"></path></svg>,
  [FieldType.FILE]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M11.47 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06l-3.22-3.22V16.5a.75.75 0 0 1-1.5 0V4.81L8.03 8.03a.75.75 0 0 1-1.06-1.06l4.5-4.5ZM3 15.75a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd"></path></svg>,
  [FieldType.RADIO]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.25-1.5a.75.75 0 0 1 .75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 1 0 1.5H12a.75.75 0 0 1-.75-.75V11.25a.75.75 0 0 1 .75-.75Z" clipRule="evenodd"></path></svg>,
  [FieldType.SELECT]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path fillRule="evenodd" d="M11.47 4.72a.75.75 0 0 1 1.06 0l3.75 3.75a.75.75 0 0 1-1.06 1.06L12 6.31 8.78 9.53a.75.75 0 0 1-1.06-1.06l3.75-3.75Zm-3.75 9.75a.75.75 0 0 1 1.06 0L12 17.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-3.75 3.75a.75.75 0 0 1-1.06 0l-3.75-3.75a.75.75 0 0 1 0-1.06Z" clipRule="evenodd"></path></svg>,
  [FieldType.STAMP]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M13.5 1.515a3 3 0 0 0-3 0L3 5.845a2.25 2.25 0 0 0-1.5 2.074V18a2.25 2.25 0 0 0 2.25 2.25h16.5A2.25 2.25 0 0 0 22.5 18V7.92a2.25 2.25 0 0 0-1.5-2.074L13.5 1.515Z"></path></svg>,
};


// FIX: Add props interface to handle shared/read-only views
interface EditorPageProps {
  isReadOnly?: boolean;
  documentIdForView?: string;
}

const EditorPage: React.FC<EditorPageProps> = ({ isReadOnly = false, documentIdForView }) => {
    // FIX: Use either the ID from props (for shared views) or from URL params
    const { documentId: documentIdFromParams } = useParams<{ documentId: string }>();
    const documentId = documentIdForView || documentIdFromParams;

    const navigate = useNavigate();
    const { getDocument, updateDocument, userProfile } = useContext(AppContext);
    
    const initialDoc = getDocument(documentId!);
    const { doc, setDoc, undo, redo, canUndo, canRedo } = useDocumentHistory(initialDoc!);

    const [pdfPages, setPdfPages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
    const [isRecipientModalOpen, setRecipientModalOpen] = useState(false);
    const [isSendModalOpen, setSendModalOpen] = useState(false);
    const { isGenerating, generateAndDownloadPdf } = usePdfGenerator();
    const [alertInfo, setAlertInfo] = useState<{ title: string, message: string } | null>(null);
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
    }, [doc, setDoc]);

    useEffect(() => {
        if (doc?.file) {
            renderPdf(doc.file);
        }
    }, [doc?.file, renderPdf]);
    
    useEffect(() => {
        // FIX: Don't auto-save changes in read-only mode
        if(doc && !isReadOnly) {
            const timer = setTimeout(() => updateDocument(doc), 500); // Debounce updates
            return () => clearTimeout(timer);
        }
    }, [doc, updateDocument, isReadOnly]);

    const handlePageThumbnailClick = (pageIndex: number) => {
        pageRefs.current[pageIndex]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    
    return (
    <div className="flex h-screen bg-slate-100 text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 bg-white border-b border-slate-200 z-20">
            <div className="flex items-center justify-between p-4 h-20">
                <h2 className="text-xl font-bold text-slate-800 truncate" title={doc.name}>{doc.name}</h2>
                 <div className="flex items-center space-x-2">
                    <Button variant="secondary" onClick={() => navigate('/dashboard')}>Back to Documents</Button>
                    {/* FIX: Only show Send button when in edit mode and the doc is a draft */}
                    {(!isReadOnly && doc.status === DocumentStatus.DRAFT) && <Button>Send</Button>}
                </div>
            </div>
        </header>

        {/* Editor Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Thumbnails */}
          <aside className="w-48 bg-slate-50 border-r border-slate-200 p-4 overflow-y-auto">
              <h3 className="font-semibold text-sm mb-4">Pages</h3>
              <div className="space-y-4">
                  {pdfPages.map((pageData, index) => (
                      <div key={index} onClick={() => handlePageThumbnailClick(index)} className="cursor-pointer border-2 border-transparent hover:border-primary-500 rounded-md overflow-hidden">
                          <img src={pageData} alt={`Page ${index+1} thumbnail`} className="w-full h-auto"/>
                          <p className="text-center text-xs p-1 bg-white">{index+1}</p>
                      </div>
                  ))}
              </div>
          </aside>

          {/* Main Content - PDF Viewer */}
          <main className="flex-1 overflow-y-auto p-8 bg-slate-200">
            <div className="max-w-4xl mx-auto">
              {pdfPages.map((pageData, index) => (
                  // FIX: Correctly assign ref to avoid returning a value from the callback
                  <div key={index} ref={el => { pageRefs.current[index] = el; }} className="relative shadow-lg mb-8 bg-white">
                      <img src={pageData} alt={`Page ${index + 1}`} className="w-full h-auto" />
                  </div>
              ))}
            </div>
          </main>
          
          {/* Right Sidebar */}
          <aside className="w-80 bg-white border-l border-slate-200 p-4 overflow-y-auto">
            {/* FIX: Show draft sidebar only in edit mode, otherwise show submissions */}
            {(doc.status === DocumentStatus.DRAFT && !isReadOnly) ? (
              <DraftSidebar doc={doc} setDoc={setDoc} selectedRecipientId={selectedRecipientId} setSelectedRecipientId={setSelectedRecipientId} />
            ) : (
              <SubmissionsSidebar doc={doc} />
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};


// --- Sub-components for Editor Page ---

const DraftSidebar: React.FC<{
  doc: Document;
  setDoc: (doc: Document) => void;
  selectedRecipientId: string;
  setSelectedRecipientId: (id: string) => void;
}> = ({ doc, setDoc, selectedRecipientId, setSelectedRecipientId }) => {
  const [isRecipientModalOpen, setRecipientModalOpen] = useState(false);
  const selectedRecipient = doc.recipients.find(r => r.id === selectedRecipientId);

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
          if (!selectedRecipientId && newRecipients.length > 0) {
            setSelectedRecipientId(newRecipients[0].id);
          }
        }}
      />
      
      <hr className="my-6"/>
      
      <h3 className="font-bold text-lg mb-2">Fields</h3>
      <p className="text-sm text-slate-500 mb-4">For <span className="font-bold text-primary-700">{selectedRecipient?.name || '...'}</span></p>
      <div className="grid grid-cols-2 gap-2">
          {Object.values(FieldType).map(type => (
              <DraggableField key={type} type={type} disabled={!selectedRecipientId} />
          ))}
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
            .map(r => ({
                ...r,
                id: uuidv4(),
                status: 'Pending' as const,
            }));
        onAddRecipients(newRecipients);
        setRecipients([{ name: '', email: '', phone: '' }]);
        onClose();
    };
    
    const updateRecipient = (index: number, field: 'name' | 'email' | 'phone', value: string) => {
        const updated = [...recipients];
        updated[index][field] = value;
        setRecipients(updated);
    };

    const addRecipientField = () => {
        setRecipients([...recipients, { name: '', email: '', phone: '' }]);
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add New Recipients" size="xl">
            <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
                {recipients.map((r, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b pb-4">
                        <Input label="Name" value={r.name} onChange={e => updateRecipient(index, 'name', e.target.value)} placeholder="John Doe"/>
                        <Input label="Email" value={r.email} onChange={e => updateRecipient(index, 'email', e.target.value)} type="email" placeholder="john.doe@email.com"/>
                        <Input label="Phone (optional)" value={r.phone || ''} onChange={e => updateRecipient(index, 'phone', e.target.value)} type="tel" placeholder="Phone number"/>
                    </div>
                ))}
            </div>
             <Button variant="link" onClick={addRecipientField} className="mt-4">Add Another</Button>
            <div className="mt-6 flex justify-end">
                <Button variant="primary" onClick={handleAdd}>Add Recipients</Button>
            </div>
        </Modal>
    );
};


const SubmissionsSidebar: React.FC<{ doc: Document }> = ({ doc }) => {
  return (
    <div>
      <h3 className="font-bold text-lg mb-4">Submissions</h3>
      <div className="space-y-3">
        {doc.recipients.map((r, index) => {
          const color = getRecipientColor(index);
           const getStatusPill = () => {
              switch(r.status) {
                  case 'Signed': return <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Completed</span>;
                  case 'Opened': return <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Opened</span>;
                  case 'Awaiting': return <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Awaiting</span>;
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
              <div className="mt-3 flex space-x-2">
                  <Button variant="secondary" size="sm" className="flex-1">Copy Link</Button>
                  <Button variant="secondary" size="sm" className="flex-1">View</Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};


interface DraggableFieldProps { type: FieldType; disabled: boolean; }
const DraggableField: React.FC<DraggableFieldProps> = ({ type, disabled }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.FIELD,
        item: { type },
        canDrag: !disabled,
        collect: monitor => ({ isDragging: !!monitor.isDragging() }),
    }));
    const Icon = FieldIcons[type];
    return (
        <div ref={drag as any} className={`flex items-center p-2 border rounded-md ${disabled ? 'cursor-not-allowed bg-slate-100 text-slate-400' : 'cursor-move bg-white'} ${isDragging ? 'opacity-50 bg-primary-100' : ''}`}>
            <Icon className="w-5 h-5 mr-2"/>
            <span className="text-sm">{type.charAt(0) + type.slice(1).toLowerCase()}</span>
        </div>
    );
};

export default EditorPage;