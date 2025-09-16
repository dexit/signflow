import React, { useContext, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Button, Spinner, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, Modal, Card, CardContent } from '../components/ui';
import { Document, DocumentStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';
import ShareModal from '../components/ShareModal';
import { usePdfGenerator } from '../hooks/usePdfGenerator';

const DashboardPage: React.FC = () => {
  const { documents, addDocument, updateDocument, logEvent } = useContext(AppContext);
  const navigate = useNavigate();
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const { isGenerating, generateAndDownloadPdf } = usePdfGenerator();
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const openShareModal = (doc: Document) => {
    setSelectedDoc(doc);
    setShareModalOpen(true);
  };
  
  const handleDownload = async (doc: Document) => {
    setGeneratingId(doc.id);
    await generateAndDownloadPdf(doc);
    setGeneratingId(null);
  };

  const handleDuplicate = (docToDuplicate: Document) => {
    const newDoc: Document = {
      ...JSON.parse(JSON.stringify(docToDuplicate)),
      id: uuidv4(),
      name: `${docToDuplicate.name} (Copy)`,
      status: DocumentStatus.DRAFT,
      createdAt: new Date().toISOString(),
      recipients: docToDuplicate.recipients.map(r => ({...r, status: 'Pending', signingUrl: undefined, signedAt: undefined })),
      fields: docToDuplicate.fields.map(f => ({...f, value: undefined, metadata: undefined})),
      events: [],
      shareSettings: {},
    };
    addDocument(newDoc);
    logEvent(newDoc.id, 'document.created', `Document duplicated from "${docToDuplicate.name}".`);
    navigate(`/editor/${newDoc.id}`);
  };

  const handleReopen = (docToReopen: Document) => {
    const reopenedDoc: Document = {
      ...docToReopen,
      status: DocumentStatus.SENT,
      recipients: docToReopen.recipients.map(r => ({ ...r, status: 'Pending', signedAt: undefined, signatureHash: undefined, auditHash: undefined, ipAddress: undefined })),
      fields: docToReopen.fields.map(f => ({ ...f, value: undefined, metadata: undefined })),
    };
    updateDocument(reopenedDoc);
    logEvent(reopenedDoc.id, 'document.sent', `Document re-opened by user.`);
  };

  const processFile = useCallback((file: File) => {
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileData = e.target?.result as string;
        const newDoc: Document = {
          id: uuidv4(),
          name: file.name,
          status: DocumentStatus.DRAFT,
          file: fileData,
          fields: [],
          recipients: [],
          createdAt: new Date().toISOString(),
          events: [],
        };
        addDocument(newDoc);
        logEvent(newDoc.id, 'document.created', `Document "${file.name}" was uploaded.`);
        navigate(`/editor/${newDoc.id}`);
      };
      reader.readAsDataURL(file);
    } else {
      setAlertMessage('Please upload a valid PDF file.');
    }
  }, [addDocument, logEvent, navigate]);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const statusInfo = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.DRAFT: return { color: 'bg-amber-100 text-amber-800', text: 'Draft' };
      case DocumentStatus.SENT: return { color: 'bg-blue-100 text-blue-800', text: 'Sent' };
      case DocumentStatus.COMPLETED: return { color: 'bg-emerald-100 text-emerald-800', text: 'Completed' };
      default: return { color: 'bg-slate-100 text-slate-800', text: 'Unknown' };
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-slate-900">Documents</h1>
      </div>
      
      {documents.length === 0 ? (
        <div 
          className={`relative flex justify-center items-center w-full h-96 border-4 border-dashed rounded-lg transition-colors ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-slate-300 bg-white'}`}
          onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
        >
            <input type="file" onChange={(e) => e.target.files && processFile(e.target.files[0])} accept=".pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <div className="text-center p-4">
                 <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-slate-400 mb-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                <p className="text-lg font-semibold text-slate-700">Drag & drop your PDF here</p>
                <p className="text-slate-500 my-2">or click to browse</p>
            </div>
        </div>
      ) : (
        <>
          <div 
            className={`relative flex justify-center items-center w-full mb-8 p-6 border-2 border-dashed rounded-lg transition-colors ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-slate-300 bg-white'}`}
            onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
          >
            <input type="file" onChange={(e) => e.target.files && processFile(e.target.files[0])} accept=".pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <div className="text-center text-slate-600">
              <p>Drag & drop another PDF or click here to upload</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((doc) => {
              const s = statusInfo(doc.status);
              return (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-5" onClick={() => navigate(`/editor/${doc.id}`)}>
                  <div className="flex justify-between items-start">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${s.color}`}>
                      {s.text}
                    </span>
                     <div onClick={e => e.stopPropagation()}>
                       <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => navigate(`/editor/${doc.id}`)}>
                              {doc.status === DocumentStatus.DRAFT ? 'Edit' : 'View'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => openShareModal(doc)}>Share</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleDuplicate(doc)}>Duplicate</DropdownMenuItem>
                            {[DocumentStatus.SENT, DocumentStatus.COMPLETED].includes(doc.status) && (
                              <DropdownMenuItem onSelect={() => handleDownload(doc)} disabled={isGenerating && generatingId === doc.id}>
                                  {isGenerating && generatingId === doc.id ? <div className="flex items-center"><Spinner size="sm" /> <span className="ml-2">Downloading...</span></div> : 'Download'}
                              </DropdownMenuItem>
                            )}
                            {doc.status === DocumentStatus.COMPLETED && (
                                <DropdownMenuItem onSelect={() => handleReopen(doc)}>Re-open</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                     </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 truncate mt-3" title={doc.name}>{doc.name}</h3>
                  <p className="text-sm text-slate-500 mt-2">Created: {new Date(doc.createdAt).toLocaleDateString()}</p>
                  <div className="flex items-center text-sm text-slate-600 mt-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mr-2 h-5 w-5 text-slate-400"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    {doc.recipients.length} Recipient(s)
                  </div>
                </CardContent>
              </Card>
            )})}
          </div>
        </>
      )}
      {selectedDoc && (
        <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setShareModalOpen(false)}
            doc={selectedDoc}
        />
      )}
      <Modal isOpen={!!alertMessage} onClose={() => setAlertMessage(null)} title="Upload Error" size="md">
        <p>{alertMessage}</p>
        <div className="mt-6 flex justify-end">
            <Button onClick={() => setAlertMessage(null)}>Close</Button>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardPage;