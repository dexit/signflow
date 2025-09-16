import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Tabs, TabsList, TabsTrigger, TabsContent } from './ui';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClose }) => {
  const [mode, setMode] = useState<'draw' | 'upload'>('draw');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const getCtx = () => canvasRef.current?.getContext('2d');

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && mode === 'draw') {
      const ctx = getCtx();
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [mode]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    const { offsetX, offsetY } = (e.nativeEvent as MouseEvent);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = getCtx();
    if (!ctx) return;
    const { offsetX, offsetY } = (e.nativeEvent as MouseEvent);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = canvasRef.current;
          const ctx = getCtx();
          if (!canvas || !ctx) return;
          clearCanvas();
          const hRatio = canvas.width / img.width;
          const vRatio = canvas.height / img.height;
          const ratio = Math.min(hRatio, vRatio, 1);
          const centerShift_x = (canvas.width - img.width * ratio) / 2;
          const centerShift_y = (canvas.height - img.height * ratio) / 2;
          ctx.drawImage(img, 0, 0, img.width, img.height,
                      centerShift_x, centerShift_y, img.width * ratio, img.height * ratio);
        }
        img.src = event.target?.result as string;
      }
      reader.readAsDataURL(file);
    }
  }

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL('image/png'));
    }
  };

  return (
    <div>
      <Tabs defaultValue="draw" onValueChange={(val) => setMode(val as any)}>
        <TabsList>
          <TabsTrigger value="draw">Draw</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>
        <TabsContent value="draw">
          <canvas
            ref={canvasRef}
            width={450}
            height={200}
            className="border border-input rounded-md cursor-crosshair bg-white mt-2"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </TabsContent>
        <TabsContent value="upload">
            <div 
                className="mt-2 w-[450px] h-[200px] border-2 border-dashed border-slate-300 rounded-md flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50"
                onClick={() => uploadInputRef.current?.click()}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500 mb-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                <p className="text-sm text-slate-600">Click to upload an image</p>
                <p className="text-xs text-slate-500">PNG, JPG, GIF</p>
            </div>
          <input type="file" ref={uploadInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          <canvas ref={canvasRef} width={450} height={200} className="hidden" />
        </TabsContent>
      </Tabs>
      <div className="mt-6 flex justify-end items-center space-x-3">
        <Button variant="secondary" onClick={onClose}>
            Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
            Save
        </Button>
      </div>
    </div>
  );
};

export default SignaturePad;