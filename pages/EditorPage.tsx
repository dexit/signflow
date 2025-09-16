import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDrag, useDrop } from 'react-dnd';
import { AppContext } from '../context/AppContext';
import { Document, FieldType, DocumentField, Recipient, DocumentStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Button, Modal, Input, Spinner, Tooltip, Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui';
import { usePdfGenerator } from '../hooks/usePdfGenerator';
import { useDocumentHistory } from '../hooks/useDocumentHistory';

const ItemTypes = {
  FIELD: 'field',
  PLACED_FIELD: 'placed_field',
};

const FieldIcons: Record<FieldType, React.FC<{className?: string}>> = {
  [FieldType.SIGNATURE]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 10.5c0 .5-.5 1-1 1H3c-.5 0-1-.5-1-1v-1c0-.5.5-1 1-1h18c.5 0 1 .5 1 1v1Z"/><path d="M7 10.5v8c0 .5.5 1 1 1h8c.5 0 1-.5 1-1v-8"/><path d="M20.5 8.5c.5 0 1-.5 1-1V6c0-1.5-1.5-3-3-3H5.5c-1.5 0-3 1.5-3 3v1.5c0 .5.5 1 1 1h16Z"/></svg>,
  [FieldType.INITIALS]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v5"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 12h-1"/><path d="M10 18h-1"/><path d="M15 12h1"/><path d="M15 18h1"/><path d="M12.5 12v6"/><path d="M7.5 12v6"/></svg>,
  [FieldType.DATE]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
  [FieldType.NAME]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>,
  [FieldType.TEXT]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18H3"/></svg>,
  [FieldType.CHECKBOX]: ({className}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>,
};

interface EditorPageProps {
  isReadOnly?: boolean;
  documentIdForView?: string;
}

const EditorPage: React.FC<EditorPageProps> = ({ isReadOnly = false, documentIdForView }) => {
    const params = useParams<{ documentId: string }>();
    const documentId = documentIdForView || params.documentId;
    const navigate = useNavigate();
    const { getDocument, updateDocument } = useContext(AppContext);
    
    const initialDoc = getDocument(documentId!);
    const { doc, setDoc, undo, redo, canUndo, canRedo } = useDocumentHistory(initialDoc!);

    const [pdfPages, setPdfPages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
    const [isRecipientModalOpen, setRecipientModalOpen] = useState(false);
    const [isSendModalOpen, setSendModalOpen] = useState(false);
    const [newRecipientName, setNewRecipientName] = useState('');
    const [newRecipientEmail, setNewRecipientEmail] = useState('');
    const { isGenerating, generateAndDownloadPdf } = usePdfGenerator();
    const templateImportRef = useRef<HTMLInputElement>(null);
    const [isPreview, setIsPreview] = useState(false);
    const [showSavedMessage, setShowSavedMessage] = useState(false);
    const [alertInfo, setAlertInfo] = useState<{ title: string, message: string } | null>(null);


    useEffect(() => {
        if (!doc) {
            navigate('/dashboard');
            return;
        }
        if(doc.recipients.length > 0 && !selectedRecipientId){
            setSelectedRecipientId(doc.recipients[0].id)
        }
    }, [doc, navigate, selectedRecipientId]);

    const renderPdf = useCallback(async (fileData: string) => {
      setLoading(true);
      const pdfJS = await import('pdfjs-dist/build/pdf.min.mjs');
      pdfJS.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfJS.version}/build/pdf.worker.min.mjs`;

      const pdf = await pdfJS.getDocument(fileData).promise;
      const pages: string[] = [];
      const pageDimensions: { width: number, height: number }[] = [];

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
        if(doc) {
            updateDocument(doc);
        }
    }, [doc, updateDocument]);

    const addField = (fieldType: FieldType, page: number, x: number, y: number) => {
        if (!doc || !selectedRecipientId) {
          setAlertInfo({ title: 'Recipient Needed', message: 'Please select a recipient before adding a field.' });
          return;
        };
        const newField: DocumentField = {
            id: uuidv4(),
            type: fieldType,
            page, x, y,
            width: fieldType === FieldType.SIGNATURE ? 150 : (fieldType === FieldType.INITIALS ? 60 : 120),
            height: fieldType === FieldType.SIGNATURE ? 50 : 30,
            recipientId: selectedRecipientId,
        };
        setDoc({ ...doc, fields: [...doc.fields, newField] });
    };

    const moveField = (fieldId: string, page: number, x: number, y: number) => {
        if (!doc) return;
        const updatedFields = doc.fields.map(f => f.id === fieldId ? { ...f, page, x, y } : f);
        setDoc({ ...doc, fields: updatedFields });
    };

    const removeField = (fieldId: string) => {
      if(!doc) return;
      const updatedFields = doc.fields.filter(f => f.id !== fieldId);
      setDoc({ ...doc, fields: updatedFields });
    };

    const handleAddRecipient = () => {
        if (!doc || !newRecipientName || !newRecipientEmail) return;
        const newRecipient: Recipient = {
            id: uuidv4(),
            name: newRecipientName,
            email: newRecipientEmail,
            status: 'Pending',
        };
        const updatedDoc = { ...doc, recipients: [...doc.recipients, newRecipient] };
        setDoc(updatedDoc);
        setSelectedRecipientId(newRecipient.id);
        setNewRecipientName('');
        setNewRecipientEmail('');
        setRecipientModalOpen(false);
    };

    const handleSend = () => {
        if (!doc || doc.recipients.length === 0) {
            setAlertInfo({ title: 'Recipient Needed', message: 'Please add at least one recipient before sending.' });
            return;
        }

        const recipientsWithUrls = doc.recipients.map(r => ({
            ...r,
            signingUrl: `${window.location.origin}${window.location.pathname}#/sign/${doc.id}/${r.id}`
        }));

        setDoc({ ...doc, recipients: recipientsWithUrls, status: DocumentStatus.SENT });
        setSendModalOpen(true);
    };

    const handleExportTemplate = () => {
      if(!doc) return;
      const template = {
        recipients: doc.recipients.map(({id, name, email}) => ({id, name, email})), // only export basic info
        fields: doc.fields.map(({id, recipientId, ...rest}) => rest), // remove ids
      }
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${doc.name.replace('.pdf', '')}-template.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    }

    const handleImportTemplate = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const template = JSON.parse(e.target?.result as string);
            // Basic validation
            if (template.recipients && template.fields) {
              const newRecipients = template.recipients.map((r: any) => ({ ...r, id: uuidv4(), status: 'Pending' }));
              const idMap = new Map(template.recipients.map((r: any, i: number) => [r.id, newRecipients[i].id]));
              
              const newFields = template.fields.map((f: any) => ({
                ...f,
                id: uuidv4(),
                recipientId: idMap.get(f.recipientId)
              }));

              setDoc({...doc!, recipients: newRecipients, fields: newFields});
              if(newRecipients.length > 0) setSelectedRecipientId(newRecipients[0].id);

            } else {
              setAlertInfo({ title: 'Import Error', message: 'Invalid template file format.' });
            }
          } catch(err) {
            setAlertInfo({ title: 'Import Error', message: 'Error parsing template file.' });
            console.error(err);
          }
        };
        reader.readAsText(file);
      }
       if(templateImportRef.current) templateImportRef.current.value = "";
    }

    const handleSave = () => {
        setShowSavedMessage(true);
        setTimeout(() => setShowSavedMessage(false), 2000);
    };

    const handleSelfSign = () => {
        if (!doc) return;
        const selfSignerEmail = "admin@signflow.com";
        let selfSigner = doc.recipients.find(r => r.email === selfSignerEmail);
        let docToUpdate = doc;

        if (!selfSigner) {
            selfSigner = {
                id: uuidv4(),
                name: "Admin User",
                email: selfSignerEmail,
                status: 'Pending',
            };
            docToUpdate = { ...doc, recipients: [...doc.recipients, selfSigner] };
            setDoc(docToUpdate);
        }
        
        const hasFields = docToUpdate.fields.some(f => f.recipientId === selfSigner!.id);
        if (!hasFields) {
            setAlertInfo({ title: 'Field Needed', message: 'Please add at least one field (e.g., a signature) for yourself before signing.' });
            setSelectedRecipientId(selfSigner.id);
            return;
        }
        navigate(`/sign/${doc.id}/${selfSigner.id}`);
    };

    if (loading || !doc) {
      return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /><p className="ml-4 text-gray-600">Preparing Document...</p></div>;
    }

    const isDraft = doc.status === DocumentStatus.DRAFT && !isReadOnly;
    const isSentOrCompleted = [DocumentStatus.SENT, DocumentStatus.COMPLETED].includes(doc.status);

    if (isPreview) {
        return (
            <div className="flex flex-col h-screen bg-gray-500">
                <header className="flex-shrink-0 bg-yellow-100 border-b-2 border-yellow-400 z-20">
                    <div className="flex items-center justify-center p-4 h-20 relative">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-700 mr-2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        <h2 className="text-xl font-bold text-yellow-800">Preview Mode</h2>
                        <Button onClick={() => setIsPreview(false)} className="absolute right-4 bg-yellow-400 hover:bg-yellow-500 text-yellow-900">Exit Preview</Button>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-4xl mx-auto">
                        {pdfPages.map((pageData, index) => (
                            <PdfPage 
                            key={index}
                            pageNumber={index}
                            imageData={pageData}
                            fields={doc.fields.filter(f => f.page === index)}
                            onDropField={() => {}}
                            onMoveField={() => {}}
                            onRemoveField={() => {}}
                            recipients={doc.recipients}
                            isDraft={false} // Make fields non-interactive in preview
                            />
                        ))}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gray-100">
             {/* Header */}
            <header className="flex-shrink-0 bg-white shadow-md z-20">
                <div className="flex items-center justify-between p-4 h-20">
                    <h2 className="text-xl font-bold text-gray-800 truncate" title={doc.name}>{doc.name}</h2>
                     <div className="flex items-center space-x-2">
                         {showSavedMessage && <span className="text-sm text-green-600 animate-pulse mr-2">Saved!</span>}
                         {isDraft && (
                           <>
                             <Tooltip content="Undo"><Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.9c0-2.3 1.2-4.4 3.1-5.5"/><path d="M3 2v8h8"/></svg></Button></Tooltip>
                             <Tooltip content="Redo"><Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 9.9c0 2.3-1.2 4.4-3.1 5.5"/><path d="M21 2v8h-8"/></svg></Button></Tooltip>
                             <div className="h-6 w-px bg-gray-200 mx-2"></div>
                             <input type="file" ref={templateImportRef} onChange={handleImportTemplate} accept=".json" className="hidden"/>
                             <Button variant="secondary" onClick={() => templateImportRef.current?.click()}>Import</Button>
                             <Button variant="secondary" onClick={handleExportTemplate}>Export</Button>
                             <Button variant="secondary" onClick={handleSave}>Save</Button>
                             <Button variant="secondary" onClick={() => setIsPreview(true)}>Preview</Button>
                           </>
                         )}
                        {isSentOrCompleted && (
                            <Button variant="secondary" onClick={() => generateAndDownloadPdf(doc)} disabled={isGenerating}>
                                {isGenerating ? <Spinner size="sm" /> : <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>}
                                Download
                            </Button>
                        )}
                        {isDraft && <>
                            <Button onClick={handleSelfSign}>Self Sign</Button>
                            <Button onClick={handleSend} disabled={doc.recipients.length === 0}>Send</Button>
                        </>}
                    </div>
                </div>
            </header>
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Fields & Recipients */}
                {isDraft && (
                    <div className="w-80 bg-white p-4 overflow-y-auto shadow-lg flex flex-col flex-shrink-0">
                        <Tabs defaultValue="recipients">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="recipients">Recipients</TabsTrigger>
                                <TabsTrigger value="fields">Fields</TabsTrigger>
                            </TabsList>
                            <TabsContent value="recipients">
                                 <div className="space-y-2 mb-4 mt-4">
                                    {doc.recipients.map(r => {
                                        const getStatusPill = () => {
                                            switch(r.status) {
                                                case 'Signed': return <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Signed</span>;
                                                case 'Opened': return <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Opened</span>;
                                                default: return <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">Pending</span>;
                                            }
                                        };

                                        const getTimestamp = () => {
                                            if (r.signedAt) return `Signed: ${new Date(r.signedAt).toLocaleString()}`;
                                            if (r.openedAt) return `Opened: ${new Date(r.openedAt).toLocaleString()}`;
                                            return 'Status: Pending';
                                        };

                                        return (
                                            <div key={r.id} onClick={() => setSelectedRecipientId(r.id)} className={`p-2 rounded-md cursor-pointer group relative ${selectedRecipientId === r.id ? 'bg-primary-100 ring-2 ring-primary-500' : 'bg-gray-100 hover:bg-gray-200'}`}>
                                                <Tooltip content={getTimestamp()}>
                                                  <div className="flex justify-between items-start">
                                                      <div className="flex-1 min-w-0">
                                                          <p className={`font-semibold text-sm truncate ${selectedRecipientId === r.id ? 'text-primary-900' : 'text-gray-900'}`}>{r.name}</p>
                                                          <p className={`text-xs truncate ${selectedRecipientId === r.id ? 'text-primary-800' : 'text-gray-500'}`}>{r.email}</p>
                                                      </div>
                                                      <div className="flex-shrink-0 ml-2">{getStatusPill()}</div>
                                                  </div>
                                                </Tooltip>
                                                <Button size="sm" variant="ghost" className="absolute top-1 right-1 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); navigate(`/sign/${doc.id}/${r.id}`)}}>Sign Now</Button>
                                            </div>
                                        )
                                    })}
                                </div>
                                <Button variant="secondary" onClick={() => setRecipientModalOpen(true)} className="w-full">
                                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                    Add Recipient
                                </Button>
                            </TabsContent>
                             <TabsContent value="fields">
                                <p className="text-sm text-gray-500 mb-2 mt-4">Drag fields onto the document for <span className="font-bold text-primary-600">{doc.recipients.find(r=>r.id===selectedRecipientId)?.name || 'the selected recipient'}</span>.</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.values(FieldType).map(type => (
                                        <DraggableField key={type} type={type} />
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}

                {/* Main Content - PDF Viewer */}
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-4xl mx-auto">
                        {pdfPages.map((pageData, index) => (
                            <PdfPage 
                            key={index}
                            pageNumber={index}
                            imageData={pageData}
                            fields={doc.fields.filter(f => f.page === index)}
                            onDropField={addField}
                            onMoveField={moveField}
                            onRemoveField={removeField}
                            recipients={doc.recipients}
                            isDraft={isDraft}
                            />
                        ))}
                    </div>
                </main>
            </div>


            {/* Modals */}
            <Modal isOpen={isRecipientModalOpen} onClose={() => setRecipientModalOpen(false)} title="Add New Recipient">
                <div className="space-y-4">
                    <Input label="Full Name" value={newRecipientName} onChange={e => setNewRecipientName(e.target.value)} placeholder="John Doe" />
                    <Input label="Email Address" value={newRecipientEmail} onChange={e => setNewRecipientEmail(e.target.value)} type="email" placeholder="john.doe@example.com" />
                </div>
                <div className="mt-6 flex justify-end">
                    <Button variant="primary" onClick={handleAddRecipient}>Add Recipient</Button>
                </div>
            </Modal>
            <Modal isOpen={isSendModalOpen} onClose={() => setSendModalOpen(false)} title="Document Sent!">
                <p>The following signing links have been generated. In a real app, these would be emailed to recipients.</p>
                <div className="mt-4 space-y-2">
                    {doc.recipients.map(r => (
                        <div key={r.id}>
                            <p className="font-bold">{r.name}:</p>
                            <Input readOnly value={r.signingUrl} onFocus={e => e.target.select()} />
                        </div>
                    ))}
                </div>
                 <div className="mt-6 flex justify-end">
                    <Button variant="primary" onClick={() => { setSendModalOpen(false); navigate('/dashboard'); }}>Close</Button>
                </div>
            </Modal>
             <Modal isOpen={!!alertInfo} onClose={() => setAlertInfo(null)} title={alertInfo?.title || 'Notification'}>
                <p>{alertInfo?.message}</p>
                <div className="mt-6 flex justify-end">
                    <Button onClick={() => setAlertInfo(null)}>OK</Button>
                </div>
            </Modal>
        </div>
    );
};

// --- Sub-components for Editor Page ---

interface DraggableFieldProps { type: FieldType; }
const DraggableField: React.FC<DraggableFieldProps> = ({ type }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.FIELD,
        item: { type },
        collect: monitor => ({ isDragging: !!monitor.isDragging() }),
    }));
    const Icon = FieldIcons[type];
    return (
        <div ref={drag as any} className={`flex items-center p-2 border rounded-md cursor-move ${isDragging ? 'opacity-50 bg-primary-100' : 'bg-white'}`}>
            <Icon className="w-5 h-5 mr-2 text-primary-600"/>
            <span className="text-sm text-gray-700">{type.charAt(0) + type.slice(1).toLowerCase()}</span>
        </div>
    );
};

interface PlacedFieldProps {
    field: DocumentField;
    recipients: Recipient[];
    onRemove: (id: string) => void;
    isDraft: boolean;
}
const PlacedField: React.FC<PlacedFieldProps> = ({ field, recipients, onRemove, isDraft }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.PLACED_FIELD,
        item: { id: field.id, ...field },
        canDrag: isDraft,
        collect: monitor => ({ isDragging: !!monitor.isDragging() }),
    }), [field, isDraft]);
    
    const recipient = recipients.find(r => r.id === field.recipientId);
    const recipientColor = recipient ? `border-blue-500` : `border-gray-400`;

    return (
        <div
            ref={drag as any}
            style={{ left: field.x, top: field.y, width: field.width, height: field.height }}
            className={`absolute flex items-center justify-center p-1 border-2 rounded ${recipientColor} bg-blue-100 bg-opacity-50 group ${isDragging ? 'opacity-25' : ''} ${isDraft ? 'cursor-move' : 'cursor-default'}`}
        >
            <span className="text-xs font-semibold text-blue-800">{field.type}</span>
            {isDraft && (
              <button onClick={() => onRemove(field.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
            )}
        </div>
    );
};


interface PdfPageProps {
    pageNumber: number;
    imageData: string;
    fields: DocumentField[];
    onDropField: (type: FieldType, page: number, x: number, y: number) => void;
    onMoveField: (id: string, page: number, x: number, y: number) => void;
    onRemoveField: (id: string) => void;
    recipients: Recipient[];
    isDraft: boolean;
}
const PdfPage: React.FC<PdfPageProps> = ({ pageNumber, imageData, fields, onDropField, onMoveField, onRemoveField, recipients, isDraft }) => {
    const pageRef = useRef<HTMLDivElement>(null);
    const [, drop] = useDrop(() => ({
        accept: [ItemTypes.FIELD, ItemTypes.PLACED_FIELD],
        drop: (item: { type: FieldType, id?: string }, monitor) => {
            if (!pageRef.current) return;
            const offset = monitor.getClientOffset();
            const pageRect = pageRef.current.getBoundingClientRect();
            if (!offset) return;
            
            const x = offset.x - pageRect.left;
            const y = offset.y - pageRect.top;

            if (item.id) { // Moving an existing field
                onMoveField(item.id, pageNumber, x, y);
            } else { // Dropping a new field from palette
                onDropField(item.type, pageNumber, x, y);
            }
        },
    }), [onDropField, onMoveField, pageNumber]);

    return (
        <div ref={pageRef} className="relative shadow-lg mb-8">
            <div ref={isDraft ? drop as any : null}>
              <img src={imageData} alt={`Page ${pageNumber + 1}`} className="w-full h-auto" />
              {fields.map(field => (
                  <PlacedField key={field.id} field={field} recipients={recipients} onRemove={onRemoveField} isDraft={isDraft} />
              ))}
            </div>
        </div>
    );
};

export default EditorPage;