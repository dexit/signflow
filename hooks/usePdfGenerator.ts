import { useState } from 'react';
import { Document, FieldType, DocumentStatus } from '../types';
// FIX: Removed unused 'pdfDocEncoding' and 'drawText' from import.
import { PDFDocument, rgb, StandardFonts, PDFFont, PageSizes } from 'pdf-lib';

async function sha256(str: string): Promise<string> {
    if(!str) return Promise.resolve('');
    const buffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-266', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

async function embedFont(pdfDoc: PDFDocument): Promise<PDFFont> {
    try {
        return await pdfDoc.embedFont(StandardFonts.Helvetica);
    } catch {
        const fontBytes = await fetch('https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/PDFFont/Helvetica.afm').then(res => res.arrayBuffer());
        return await pdfDoc.embedFont(fontBytes);
    }
}

const addCertificatePage = async (pdfDoc: PDFDocument, doc: Document, font: PDFFont, courierFont: PDFFont, documentHash: string) => {
    // FIX: Changed 'const' to 'let' to allow page to be reassigned for multi-page certificates.
    let page = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = page.getSize();
    const margin = 50;
    
    const colors = {
      title: rgb(0.12, 0.12, 0.12),
      subtitle: rgb(0.3, 0.3, 0.3),
      text: rgb(0.2, 0.2, 0.2),
      label: rgb(0.4, 0.4, 0.4),
      hash: rgb(0.1, 0.1, 0.1)
    };
    
    let y = height - 60;

    page.drawText('Certificate of Completion', {
        x: margin, y, font, size: 28, color: colors.title
    });
    y -= 30;

    page.drawText('This certificate confirms the successful completion and signing of the document.', {
      x: margin, y, font, size: 11, color: colors.subtitle
    });
    y -= 40;

    // Document Details
    page.drawText('DOCUMENT DETAILS', { x: margin, y, font, size: 10, color: colors.label });
    y -= 10;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
    y -= 20;

    page.drawText(`Document Name: ${doc.name}`, { x: margin, y, font, size: 11, color: colors.text });
    y -= 18;
    page.drawText(`Document ID: ${doc.id}`, { x: margin, y, font, size: 11, color: colors.text });
    y -= 25;
    
    page.drawText('Original Document Hash (SHA-256):', { x: margin, y, font, size: 10, color: colors.label });
    y -= 15;
    page.drawText(documentHash, { x: margin, y, font: courierFont, size: 9, color: colors.hash });
    y -= 40;

    // Signers Audit Trail
    page.drawText('AUDIT TRAIL', { x: margin, y, font, size: 10, color: colors.label });
    y -= 10;
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
    y -= 25;
    
    const signerAuditHashes: string[] = [];
    
    for (const [index, recipient] of doc.recipients.entries()) {
      if (recipient.status !== 'Signed' || !recipient.signedAt) continue;
      if (recipient.auditHash) signerAuditHashes.push(recipient.auditHash);
      
      if (y < margin + 180) { // Check if space is running out
          const newPage = pdfDoc.addPage(PageSizes.A4);
          page.drawText(`Continued...`, { x: width - margin - 50, y: margin / 2, font, size: 9, color: colors.label });
          page.drawText(`${pdfDoc.getPageCount() - 1}`, { x: width / 2, y: margin / 2, font, size: 9, color: colors.label });
          page = newPage;
          y = height - margin;
          page.drawText('AUDIT TRAIL (CONTINUED)', { x: margin, y, font, size: 10, color: colors.label });
          y -= 25;
      }
      
      page.drawText(`${index + 1}. Signer: ${recipient.name} (${recipient.email})`, { x: margin, y, font, size: 12, color: colors.title });
      y -= 20;
      
      page.drawText(`- Status:`, { x: margin + 15, y, font, size: 10, color: colors.label });
      page.drawText(`Completed`, { x: margin + 100, y, font, size: 10, color: colors.text });
      y -= 15;
      
      page.drawText(`- Signed at:`, { x: margin + 15, y, font, size: 10, color: colors.label });
      page.drawText(`${new Date(recipient.signedAt).toLocaleString()}`, { x: margin + 100, y, font, size: 10, color: colors.text });
      y -= 15;
      
      page.drawText(`- IP Address:`, { x: margin + 15, y, font, size: 10, color: colors.label });
      page.drawText(`${recipient.ipAddress}`, { x: margin + 100, y, font, size: 10, color: colors.text });
      y -= 20;

      page.drawText('Signature Hash (SHA-256):', { x: margin + 15, y, font, size: 10, color: colors.label });
      y -= 15;
      page.drawText(`${recipient.signatureHash}`, { x: margin + 15, y, font: courierFont, size: 9, color: colors.hash });
      y -= 20;
      
      page.drawText('Audit Hash (SHA-256):', { x: margin + 15, y, font, size: 10, color: colors.label });
      y -= 15;
      page.drawText(`${recipient.auditHash}`, { x: margin + 15, y, font: courierFont, size: 9, color: colors.hash });
      y -= 30;
    }

    const certificateHash = await sha256(signerAuditHashes.sort().join('') + documentHash);
    if (certificateHash) {
        if (y < margin + 60) {
          const newPage = pdfDoc.addPage(PageSizes.A4);
          page.drawText(`Continued...`, { x: width - margin - 50, y: margin / 2, font, size: 9, color: colors.label });
          page.drawText(`${pdfDoc.getPageCount() - 1}`, { x: width / 2, y: margin / 2, font, size: 9, color: colors.label });
          page = newPage;
          y = height - margin;
        }

        page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
        y -= 25;
        page.drawText('Final Certificate Hash (SHA-256):', { x: margin, y, font, size: 10, color: colors.label });
        y -= 15;
        page.drawText(certificateHash, { x: margin, y, font: courierFont, size: 9, color: colors.hash });
    }

    page.drawText(`${pdfDoc.getPageCount()}`, { x: width / 2, y: margin / 2, font, size: 9, color: colors.label });
};


export const usePdfGenerator = () => {
    const [isGenerating, setIsGenerating] = useState(false);

    const generateAndDownloadPdf = async (doc: Document) => {
        if (!doc.pageDimensions) {
            alert("Document dimensions are not available. Please open the document in the editor first.");
            return;
        }

        setIsGenerating(true);
        try {
            const existingPdfBytes = Uint8Array.from(atob(doc.file.split(',')[1]), c => c.charCodeAt(0));
            const documentHash = await sha256(doc.file);
            const pdfDoc = await PDFDocument.load(existingPdfBytes, { updateMetadata: false });
            const font = await embedFont(pdfDoc);
            const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);
            const pages = pdfDoc.getPages();

            for (const field of doc.fields) {
                if (!field.value) continue;

                const page = pages[field.page];
                const { width: pagePdfWidth, height: pagePdfHeight } = page.getSize();
                const { width: pagePngWidth, height: pagePngHeight } = doc.pageDimensions[field.page];
                
                const scaleX = pagePdfWidth / pagePngWidth;
                const scaleY = pagePdfHeight / pagePngHeight;

                const pdfX = field.x * scaleX;
                const fieldHeightPdf = field.height * scaleY;
                const pdfY = pagePdfHeight - (field.y * scaleY) - fieldHeightPdf;

                switch (field.type) {
                    case FieldType.SIGNATURE:
                    case FieldType.INITIALS:
                        const pngImageBytes = Uint8Array.from(atob(field.value.split(',')[1]), c => c.charCodeAt(0));
                        const pngImage = await pdfDoc.embedPng(pngImageBytes);
                        page.drawImage(pngImage, {
                            x: pdfX,
                            y: pdfY,
                            width: field.width * scaleX,
                            height: fieldHeightPdf,
                        });
                        if (field.metadata?.signedAt) {
                            const date = new Date(field.metadata.signedAt);
                            const text = `Signed on ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
                             page.drawText(text, {
                                x: pdfX,
                                y: pdfY - 12,
                                size: 8,
                                font,
                                color: rgb(0.2, 0.2, 0.2),
                            });
                        }
                        break;
                    
                    case FieldType.CHECKBOX:
                         page.drawText('X', {
                            x: pdfX + (field.width * scaleX * 0.2),
                            y: pdfY + (field.height * scaleY * 0.1),
                            size: fieldHeightPdf * 0.8,
                            font,
                            color: rgb(0, 0, 0),
                        });
                        break;

                    case FieldType.TEXT:
                    case FieldType.NAME:
                    case FieldType.DATE:
                         page.drawText(field.value, {
                            x: pdfX + 2,
                            y: pdfY + (fieldHeightPdf * 0.25),
                            size: fieldHeightPdf * 0.6,
                            font,
                            color: rgb(0, 0, 0),
                        });
                        break;
                }
            }

            if (doc.status === DocumentStatus.COMPLETED) {
                await addCertificatePage(pdfDoc, doc, font, courierFont, documentHash);
            }
            
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${doc.name.replace('.pdf', '')}-signed.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Failed to generate PDF:", error);
            alert("An error occurred while generating the PDF. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return { isGenerating, generateAndDownloadPdf };
};