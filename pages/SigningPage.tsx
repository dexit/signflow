import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Document, DocumentField, FieldType, DocumentStatus } from '../types';
import { Button, Modal, Spinner } from '../components/ui';
import SignaturePad from '../components/SignaturePad';

async function sha256(str: string): Promise<string> {
    const buffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

const SigningPage: React.FC = () => {
  const { documentId, recipientId } = useParams<{ documentId: string; recipientId: string }>();
  const { getDocument, updateDocument, logEvent } = useContext(AppContext);
  const navigate = useNavigate();

  const [doc, setDoc] = useState<Document | null>(null);
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isSignatureModalOpen, setSignatureModalOpen] = useState(false);
  const [activeSignatureField, setActiveSignatureField] = useState<DocumentField | null>(null);
  const [alertInfo, setAlertInfo] = useState<{ title: string; message: string; onConfirm?: () => void } | null>(null);

  useEffect(() => {
    if (!documentId) return;
    const foundDoc = getDocument(documentId);
    if (foundDoc) {
      setDoc(foundDoc);
      const initialValues: Record<string, string> = {};
      const recipient = foundDoc.recipients.find(r => r.id === recipientId);
      foundDoc.fields.forEach(field => {
        if(field.recipientId === recipientId) {
            if(field.type === FieldType.DATE) {
                initialValues[field.id] = new Date().toLocaleDateString();
            } else if (field.type === FieldType.NAME && recipient) {
                initialValues[field.id] = recipient.name;
            }
        }
      });
      setFieldValues(initialValues);

    }
  }, [documentId, recipientId, getDocument]);

  useEffect(() => {
    if (doc) {
      const recipient = doc.recipients.find(r => r.id === recipientId);
      if (recipient && recipient.status === 'Pending') {
        const openedAt = new Date().toISOString();
        const updatedRecipients = doc.recipients.map(r => 
          r.id === recipientId ? { ...r, status: 'Opened' as const, openedAt } : r
        );
        const updatedDoc = { ...doc, recipients: updatedRecipients };
        updateDocument(updatedDoc);
        logEvent(doc.id, 'recipient.opened', `Recipient "${recipient.name}" opened the document.`);
        setDoc(updatedDoc);
      }
    }
  }, [doc, recipientId, updateDocument, logEvent]);

  const renderPdf = useCallback(async (fileData: string) => {
    setLoading(true);
    const pdfJS = await import('pdfjs-dist/build/pdf.min.mjs');
    pdfJS.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfJS.version}/build/pdf.worker.min.mjs`;

    const pdf = await pdfJS.getDocument(fileData).promise;
    const pages: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
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
    setLoading(false);
  }, []);

  useEffect(() => {
    if (doc?.file) {
      renderPdf(doc.file);
    }
  }, [doc?.file, renderPdf]);
  
  const handleFieldValueChange = (fieldId: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const openSignatureModal = (field: DocumentField) => {
    setActiveSignatureField(field);
    setSignatureModalOpen(true);
  };
  
  const handleSaveSignature = (dataUrl: string) => {
    if (activeSignatureField) {
      handleFieldValueChange(activeSignatureField.id, dataUrl);
    }
    setSignatureModalOpen(false);
    setActiveSignatureField(null);
  };

  const handleSubmit = async () => {
    if (!doc || !recipientId) return;
    const recipientFields = doc.fields.filter(f => f.recipientId === recipientId);
    const allFieldsFilled = recipientFields.every(f => !!fieldValues[f.id]);

    if (!allFieldsFilled) {
        setAlertInfo({ title: "Fields Incomplete", message: "Please fill all your required fields before you can finish signing." });
        return;
    }

    const signedAt = new Date().toISOString();
    const ipAddress = "IP Not Tracked (Client-Side App)";

    const updatedFields = doc.fields.map(f => {
        if (fieldValues[f.id]) {
            const isSignature = f.type === FieldType.SIGNATURE || f.type === FieldType.INITIALS;
            return {
                ...f,
                value: fieldValues[f.id],
                metadata: isSignature ? { signedAt } : f.metadata,
            };
        }
        return f;
    });

    let signingRecipientName = '';
    const updatedRecipients = await Promise.all(doc.recipients.map(async r => {
        if (r.id !== recipientId) return r;
        signingRecipientName = r.name;
        const signatureField = doc.fields.find(f => f.recipientId === recipientId && (f.type === FieldType.SIGNATURE || f.type === FieldType.INITIALS));
        const signatureValue = signatureField ? fieldValues[signatureField.id] : '';
        const signatureHash = signatureValue ? await sha256(signatureValue) : undefined;
        
        const auditTrailData = JSON.stringify({
            name: r.name,
            email: r.email,
            signedAt,
            ipAddress,
            signatureHash,
            documentId: doc.id,
        });
        const auditHash = await sha256(auditTrailData);

        return { ...r, status: 'Signed' as const, signedAt, ipAddress, signatureHash, auditHash };
    }));

    const isCompleted = updatedRecipients.every(r => r.status === 'Signed');

    const updatedDoc = {
        ...doc,
        fields: updatedFields,
        recipients: updatedRecipients,
        status: isCompleted ? DocumentStatus.COMPLETED : doc.status,
    };
    updateDocument(updatedDoc);
    logEvent(doc.id, 'recipient.signed', `Recipient "${signingRecipientName}" signed the document.`);
    setAlertInfo({
        title: "Signature Submitted",
        message: "Thank you for signing! Your document has been completed.",
        onConfirm: () => navigate('/dashboard')
    });
  };

  if (loading || !doc) {
    return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /><p className="ml-4 text-slate-600">Loading Document...</p></div>;
  }
  
  const recipient = doc.recipients.find(r => r.id === recipientId);
  if (!recipient) return <p>Invalid recipient.</p>;
  if (recipient.status === 'Signed') {
    return (
        <div className="text-center py-20 bg-slate-100 min-h-screen">
            <h1 className="text-2xl font-bold text-slate-800">Document Already Signed</h1>
            <p className="text-slate-600 mt-2">You have already completed signing this document.</p>
             <Button onClick={() => navigate('/dashboard')} className="mt-6">Back to Dashboard</Button>
        </div>
    );
  }

  const handleAlertConfirm = () => {
    alertInfo?.onConfirm?.();
    setAlertInfo(null);
  };

  return (
    <div className="bg-slate-200 min-h-screen">
      <div className="sticky top-0 bg-white shadow-md z-10 p-4 flex justify-between items-center">
        <h1 className="text-lg md:text-xl font-bold text-slate-800 truncate pr-4">{doc.name}</h1>
        <Button onClick={handleSubmit}>Finish Signing</Button>
      </div>
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {pdfPages.map((pageData, index) => (
            <div key={index} className="relative shadow-lg mb-8 bg-white">
              <img src={pageData} alt={`Page ${index + 1}`} className="w-full h-auto" />
              {doc.fields.filter(f => f.page === index && f.recipientId === recipientId).map(field => {
                 const value = fieldValues[field.id];
                 const isFilled = !!value;
                 const baseClass = "absolute bg-primary-100 bg-opacity-60 border-2 border-dashed border-primary-400 rounded focus-within:ring-2 focus-within:ring-primary-500";
                 const filledClass = "border-solid border-emerald-500 bg-emerald-100";

                 return (
                    <div
                        key={field.id}
                        style={{ left: field.x, top: field.y, width: field.width, height: field.height }}
                        className={`${baseClass} ${isFilled ? filledClass : ''}`}
                    >
                    {[FieldType.SIGNATURE, FieldType.INITIALS].includes(field.type) ? (
                        <button onClick={() => openSignatureModal(field)} className="w-full h-full flex items-center justify-center">
                            {value ? <img src={value} alt="signature" className="w-full h-full object-contain"/> : <span className="text-primary-800 font-semibold text-sm">Click to Sign</span>}
                        </button>
                    ) : field.type === FieldType.CHECKBOX ? (
                         <div className="w-full h-full flex items-center justify-center">
                            <input
                                type="checkbox"
                                checked={!!value}
                                onChange={(e) => handleFieldValueChange(field.id, e.target.checked ? 'true' : '')}
                                className="w-2/3 h-2/3"
                            />
                        </div>
                    ) : (
                        <input
                            type="text"
                            value={value || ''}
                            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                            readOnly={field.type === FieldType.DATE || field.type === FieldType.NAME}
                            className="w-full h-full bg-transparent p-1 text-sm focus:outline-none text-slate-900"
                        />
                    )}
                    </div>
                 );
              })}
            </div>
          ))}
        </div>
      </div>
      <Modal isOpen={isSignatureModalOpen} onClose={() => setSignatureModalOpen(false)} title={`Provide your ${activeSignatureField?.type.toLowerCase()}`}>
        <SignaturePad
            onSave={handleSaveSignature}
            onClose={() => setSignatureModalOpen(false)}
        />
      </Modal>
      <Modal isOpen={!!alertInfo} onClose={handleAlertConfirm} title={alertInfo?.title || ''}>
        <p>{alertInfo?.message}</p>
        <div className="mt-6 flex justify-end">
            <Button onClick={handleAlertConfirm}>OK</Button>
        </div>
      </Modal>
    </div>
  );
};

export default SigningPage;