import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
// Fix: Import DocumentStatus to use its enum values for type safety.
import { Document, DocumentField, FieldType, DocumentStatus } from '../types';
import { Button, Modal, Spinner } from '../components/ui';
import SignaturePad from '../components/SignaturePad';

const SigningPage: React.FC = () => {
  const { documentId, recipientId } = useParams<{ documentId: string; recipientId: string }>();
  const { getDocument, updateDocument } = useContext(AppContext);
  const navigate = useNavigate();

  const [doc, setDoc] = useState<Document | null>(null);
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isSignatureModalOpen, setSignatureModalOpen] = useState(false);
  const [activeSignatureField, setActiveSignatureField] = useState<DocumentField | null>(null);

  useEffect(() => {
    if (!documentId) return;
    const foundDoc = getDocument(documentId);
    if (foundDoc) {
      setDoc(foundDoc);
      // Pre-fill fields
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

    } else {
      // Handle document not found
    }
  }, [documentId, recipientId, getDocument]);

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

  const handleSubmit = () => {
    if (!doc) return;
    const recipientFields = doc.fields.filter(f => f.recipientId === recipientId);
    const allFieldsFilled = recipientFields.every(f => !!fieldValues[f.id]);

    if (!allFieldsFilled) {
        alert("Please fill all your required fields.");
        return;
    }

    const updatedFields = doc.fields.map(f => 
        fieldValues[f.id] ? { ...f, value: fieldValues[f.id] } : f
    );
    const updatedRecipients = doc.recipients.map(r =>
        // Fix: Use 'as const' to prevent TypeScript from widening the status type to 'string'.
        r.id === recipientId ? { ...r, status: 'Signed' as const } : r
    );

    const isCompleted = updatedRecipients.every(r => r.status === 'Signed');

    const updatedDoc = {
        ...doc,
        fields: updatedFields,
        recipients: updatedRecipients,
        // Fix: Use DocumentStatus enum for type correctness instead of a string literal.
        status: isCompleted ? DocumentStatus.COMPLETED : doc.status,
    };
    updateDocument(updatedDoc);
    alert("Thank you for signing!");
    navigate('/');
  };

  if (loading || !doc) {
    return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /><p className="ml-4 text-gray-600">Loading Document...</p></div>;
  }
  
  const recipient = doc.recipients.find(r => r.id === recipientId);
  if (!recipient) return <p>Invalid recipient.</p>;
  if (recipient.status === 'Signed') {
    return (
        <div className="text-center py-20">
            <h1 className="text-2xl font-bold">Document Already Signed</h1>
            <p className="text-gray-600 mt-2">You have already completed signing this document.</p>
        </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="sticky top-0 bg-white shadow-md z-10 p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">{doc.name}</h1>
        <Button onClick={handleSubmit}>Finish Signing</Button>
      </div>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          {pdfPages.map((pageData, index) => (
            <div key={index} className="relative shadow-lg mb-8">
              {/* Fix: Replaced undefined variable 'pageNumber' with 'index' from map. */}
              <img src={pageData} alt={`Page ${index + 1}`} className="w-full h-auto" />
              {doc.fields.filter(f => f.page === index && f.recipientId === recipientId).map(field => {
                 const value = fieldValues[field.id];
                 const isFilled = !!value;
                 const baseClass = "absolute bg-yellow-100 bg-opacity-70 border-2 border-dashed border-yellow-500 rounded";
                 const filledClass = "border-green-500 bg-green-100";

                 return (
                    <div
                        key={field.id}
                        style={{ left: field.x, top: field.y, width: field.width, height: field.height }}
                        className={`${baseClass} ${isFilled ? filledClass : ''}`}
                    >
                    {[FieldType.SIGNATURE, FieldType.INITIALS].includes(field.type) ? (
                        <button onClick={() => openSignatureModal(field)} className="w-full h-full flex items-center justify-center">
                            {value ? <img src={value} alt="signature" className="w-full h-full object-contain"/> : <span className="text-yellow-700 text-sm">Click to sign</span>}
                        </button>
                    ) : (
                        <input
                            type="text"
                            value={value || ''}
                            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                            readOnly={field.type === FieldType.DATE || field.type === FieldType.NAME}
                            className="w-full h-full bg-transparent p-1 text-sm focus:outline-none"
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
    </div>
  );
};

export default SigningPage;