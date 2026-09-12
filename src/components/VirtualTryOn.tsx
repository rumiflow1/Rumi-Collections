import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, X, Loader2, Check, Info, RefreshCw, AlertTriangle } from 'lucide-react';
import { tryOnApi } from '../services/api';
import { resolveImageUrl } from '../lib/utils';

interface VirtualTryOnProps {
  productImage: string;
  productName: string;
  onClose: () => void;
}

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Photo could not be read'));
    reader.readAsDataURL(file);
  });

const remoteToDataUrl = async (url: string) => {
  const response = await fetch(resolveImageUrl(url));
  if (!response.ok) throw new Error('Garment image could not be loaded');
  const blob = await response.blob();
  return fileToDataUrl(new File([blob], 'garment-image', { type: blob.type || 'image/jpeg' }));
};

export default function VirtualTryOn({ productImage, productName, onClose }: VirtualTryOnProps) {
  const [userImage, setUserImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    if (stream) stream.getTracks().forEach(track => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
  };

  useEffect(() => () => stopCamera(), []);

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch {
      setError('Camera access denied. Please upload a photo instead.');
    }
  };

  const capture = () => {
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setUserImage(canvas.toDataURL('image/jpeg', 0.92));
    setResultImage(null);
    stopCamera();
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setResultImage(null);
    try {
      setUserImage(await fileToDataUrl(file));
    } catch {
      setError('That photo could not be opened. Please try another format (JPG/PNG).');
    }
  };

  const generate = async () => {
    if (!userImage) return;
    setIsGenerating(true);
    setError('');
    try {
      const garment = await remoteToDataUrl(productImage);
      const response = await tryOnApi.generate(userImage, garment, productName);
      const image = response.data?.image;
      if (!image) throw new Error('No fitting image was returned by the server');
      setResultImage(image);
    } catch (err: any) {
      console.error('Try-On Error:', err);
      setError(err?.response?.data?.error || err?.message || 'Virtual fitting could not be completed. Please ensure the photo is clear and well-lit.');
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    setUserImage(null);
    setResultImage(null);
    setError('');
    stopCamera();
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }} 
        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-8"
      >
        <div className="relative w-full max-w-5xl bg-white max-h-[92vh] overflow-y-auto shadow-2xl rounded-xl">
          <div className="sticky top-0 z-20 p-5 md:p-6 border-b border-gray-100 flex justify-between items-center bg-white rounded-t-xl">
            <div>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-[#0B1220]">Virtual Fitting</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{productName}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="p-5 md:p-8">
            {!userImage && !isCameraActive && (
              <div className="max-w-lg mx-auto text-center py-10 space-y-7">
                <div className="w-20 h-20 rounded-full bg-[#F9F8F6] flex items-center justify-center mx-auto text-[#0B1220]">
                  <Camera size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#0B1220]">Start your fitting</h3>
                  <p className="text-sm text-gray-500 mt-2 leading-6">
                    Use a clear, front-facing photo. The fitting service creates a new preview with the selected piece naturally worn on the body.
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <button onClick={startCamera} className="bg-[#0B1220] text-white py-4 text-xs font-bold tracking-widest uppercase flex justify-center items-center gap-2 hover:bg-[#1a253a] transition-colors rounded-lg">
                    <Camera size={16} /> Use Camera
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="border border-gray-300 py-4 text-xs font-bold tracking-widest uppercase flex justify-center items-center gap-2 hover:bg-gray-50 transition-colors rounded-lg">
                    <Upload size={16} /> Upload Photo
                  </button>
                </div>
              </div>
            )}

            {isCameraActive && (
              <div className="space-y-4">
                <div className="relative bg-black aspect-[3/4] max-h-[65vh] overflow-hidden rounded-lg">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-3">
                    <button onClick={capture} className="w-14 h-14 bg-white rounded-full border-4 border-gray-300 hover:border-white transition-colors" />
                    <button onClick={stopCamera} className="px-5 bg-black/60 text-white text-xs font-bold uppercase tracking-widest hover:bg-black/80 transition-colors rounded-lg">Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {userImage && !isCameraActive && (
              <div className="grid lg:grid-cols-2 gap-6 items-start">
                <div className="border border-gray-100 p-3 bg-[#F9F8F6] rounded-lg">
                  <img src={resultImage || userImage} alt="Fitting preview" className="w-full max-h-[65vh] object-contain bg-white rounded" />
                  {resultImage && (
                    <div className="mt-3 text-center text-[10px] tracking-widest uppercase text-green-700 font-bold flex items-center justify-center gap-2">
                      <Check size={14} /> Fitting preview generated
                    </div>
                  )}
                </div>
                <div className="space-y-5">
                  <div className="border border-gray-100 p-4 rounded-lg bg-white">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Selected piece</p>
                    <img src={resolveImageUrl(productImage)} alt={productName} className="w-full max-h-72 object-contain" />
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={generate} 
                      disabled={isGenerating} 
                      className="flex-1 bg-[#0B1220] text-white py-4 text-xs font-bold tracking-widest uppercase flex justify-center items-center gap-2 disabled:opacity-60 hover:bg-[#1a253a] transition-colors rounded-lg"
                    >
                      {isGenerating ? <><Loader2 size={16} className="animate-spin" /> Creating fitting…</> : <><Check size={16} /> Create Fitting</>}
                    </button>
                    <button onClick={reset} className="px-5 border border-gray-200 hover:bg-gray-50 transition-colors rounded-lg flex items-center justify-center">
                      <RefreshCw size={18} />
                    </button>
                  </div>
                  <div className="flex gap-2 text-xs text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <Info size={16} className="shrink-0 mt-0.5 text-blue-600" />
                    <p>Your original photo stays in this session. The generated fitting is returned only for your preview.</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-5 border border-red-200 bg-red-50 text-red-700 text-sm p-4 flex items-start gap-3 rounded-lg">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            
            <input ref={fileInputRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
