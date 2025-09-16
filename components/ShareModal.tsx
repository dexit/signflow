import React, { useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AppContext } from '../context/AppContext';
import { Document } from '../types';
import { Modal, Button, Input } from './ui';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: Document;
}

const ShareLinkSection: React.FC<{
    doc: Document,
    permission: 'view' | 'edit',
    onDocUpdate: (doc: Document) => void
}> = ({ doc, permission, onDocUpdate }) => {
    const [copied, setCopied] = useState(false);
    const idKey = permission === 'view' ? 'viewId' : 'editId';
    const shareId = doc.shareSettings?.[idKey];
    const baseUrl = `${window.location.origin}${window.location.pathname}#`;
    const link = shareId ? `${baseUrl}/${permission}/${shareId}` : '';

    const generateLink = () => {
        const newId = uuidv4();
        const updatedDoc = {
            ...doc,
            shareSettings: {
                ...doc.shareSettings,
                [idKey]: newId,
            }
        };
        onDocUpdate(updatedDoc);
    };

    const copyLink = () => {
        if (!link) return;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const title = permission === 'view' ? "View Access" : "Edit Access";
    const description = permission === 'view'
        ? "Anyone with this link can view the document and its fields."
        : "Anyone with this link can edit the document, add fields, and manage recipients.";

    return (
        <div>
            <h4 className="font-semibold">{title}</h4>
            <p className="text-sm text-gray-500 mb-2">{description}</p>
            <div className="flex space-x-2">
                <Input value={link} readOnly placeholder="Generate a link to share" onFocus={e => e.target.select()}/>
                {shareId ? (
                    <Button variant="secondary" onClick={copyLink} className="w-28 flex-shrink-0">
                        {copied ? 'Copied!' : 'Copy Link'}
                    </Button>
                ) : (
                    <Button variant="secondary" onClick={generateLink} className="w-36 flex-shrink-0">
                        Generate Link
                    </Button>
                )}
            </div>
        </div>
    );
};

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, doc }) => {
  const { updateDocument } = useContext(AppContext);
  const [internalDoc, setInternalDoc] = useState(doc);

  // Update internal state if the prop changes
  React.useEffect(() => {
    setInternalDoc(doc);
  }, [doc]);

  const handleDocUpdate = (updatedDoc: Document) => {
    setInternalDoc(updatedDoc);
    updateDocument(updatedDoc);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Share "${doc.name}"`}>
      <div className="space-y-6">
          <ShareLinkSection doc={internalDoc} permission="view" onDocUpdate={handleDocUpdate} />
          <ShareLinkSection doc={internalDoc} permission="edit" onDocUpdate={handleDocUpdate} />
      </div>
       <div className="mt-8 flex justify-end">
        <Button onClick={onClose}>Done</Button>
      </div>
    </Modal>
  );
};

export default ShareModal;
