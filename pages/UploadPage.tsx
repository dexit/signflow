import React, { useContext, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { Document, DocumentStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '../components/ui';

const UploadPage: React.FC = () => {
  const { addDocument } = useContext(AppContext);
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
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
          // Fix: Add missing 'events' property required by the Document type.
          events: [],
        };
        addDocument(newDoc);
        navigate(`/editor/${newDoc.id}`);
      };
      reader.readAsDataURL(file);
    } else {
      alert('Please upload a valid PDF file.');
    }
  }, [addDocument, navigate]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Upload New Document</h1>
        <div 
            className={`flex justify-center items-center w-full h-96 border-4 border-dashed rounded-lg transition-colors ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-slate-300 bg-white'}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf"
                className="hidden"
            />
            <div className="text-center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-slate-400 mb-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                <p className="text-lg font-semibold text-slate-700">Drag & drop your PDF here</p>
                <p className="text-slate-500 my-2">or</p>
                <Button onClick={() => fileInputRef.current?.click()}>
                    Browse Files
                </Button>
            </div>
        </div>
    </div>
  );
};

export default UploadPage;