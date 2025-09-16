import { useState } from 'react';
import { Document, FieldType, DocumentStatus } from '../types';
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';

async function sha256(str: string): Promise<string> {
    if(!str) return Promise.resolve('');
    const buffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
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
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const margin = 50;
    const lightGray = rgb(0.33, 0.4, 0.51); // slate-600
    const black = rgb(0.06, 0.09, 0.15); // slate-900
    const headerBlue = rgb(0.24, 0.21, 0.65); // primary-700
    
    let yPosition = height - margin;

    page.drawText('Digital Signing Certificate', {
        x: margin, y: yPosition, font, size: 24, color: headerBlue,
    });
    yPosition -= 30;
    
    const completionDate = doc.recipients.reduce((latest, r) => {
        const signedDate = r.signedAt ? new Date(r.signedAt) : new Date(0);
        return signedDate > latest ? signedDate : latest;
    }, new Date(0));

    if (completionDate.getTime() > 0) {
      page.drawText(`Document Completed: ${completionDate.toLocaleString()}`, { x: margin, y: yPosition, font, size: 11, color: lightGray });
    }
    yPosition -= 25;

    page.drawText('Document Details', { x: margin, y: yPosition, font, size: 16, color: black });
    yPosition -= 20;
    page.drawText(`Name: ${doc.name}`, { x: margin, y: yPosition, font, size: 10 });
    yPosition -= 15;
    page.drawText(`ID: ${doc.id}`, { x: margin, y: yPosition, font, size: 10 });
    yPosition -= 15;
    page.drawText(`Document Hash (SHA-256): ${documentHash}`, { x: margin, y: yPosition, font: courierFont, size: 10 });

    yPosition -= 30;
    page.drawLine({ start: { x: margin, y: yPosition }, end: { x: width - margin, y: yPosition }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
    yPosition -= 30;

    page.drawText('Signer Summary', { x: margin, y: yPosition, font, size: 16, color: black });
    yPosition -= 25;
    
    const signerAuditHashes: string[] = [];

    for (const recipient of doc.recipients) {
        if (recipient.status !== 'Signed' || !recipient.signedAt) continue;
        if(recipient.auditHash) signerAuditHashes.push(recipient.auditHash);

        page.drawText(`${recipient.name} (${recipient.email})`, { x: margin, y: yPosition, font, size: 12, color: black });
        yPosition -= 18;
        page.drawText(`Signed On: ${new Date(recipient.signedAt).toLocaleString()}`, { x: margin + 10, y: yPosition, font, size: 9, color: lightGray });
        yPosition -= 15;
        page.drawText(`IP Address: ${recipient.ipAddress}`, { x: margin + 10, y: yPosition, font, size: 9, color: lightGray });
        yPosition -= 15;
        page.drawText(`Signature Hash: ${recipient.signatureHash}`, { x: margin + 10, y: yPosition, font: courierFont, size: 9, color: lightGray });
        yPosition -= 15;
        page.drawText(`Audit Hash: ${recipient.auditHash}`, { x: margin + 10, y: yPosition, font: courierFont, size: 9, color: lightGray });

        yPosition -= 30;
    }

    const certificateHash = await sha256(signerAuditHashes.sort().join(''));
    if (certificateHash) {
        yPosition -= 10;
        page.drawLine({ start: { x: margin, y: yPosition }, end: { x: width - margin, y: yPosition }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
        yPosition -= 20;
        page.drawText('Certificate Hash (SHA-256):', { x: margin, y: yPosition, font, size: 10, color: black });
        yPosition -= 15;
        page.drawText(certificateHash, { x: margin, y: yPosition, font: courierFont, size: 10, color: lightGray });
    }
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
            const pdfDoc = await PDFDocument.load(existingPdfBytes);
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
                            y: pdfY + (fieldHeightPdf * 0.2),
                            size: fieldHeightPdf * 0.7,
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