import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, X, RotateCcw, Check, Move, Maximize2, Minimize2, Loader2, Sparkles, Info } from 'lucide-react';

interface VirtualTryOnProps {
  productImage: string;
  productName: string;
  onClose: () => void;
}

export default function VirtualTryOn({ productImage, productName, onClose }: VirtualTryOnProps) {
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    setIsLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setUserImage(canvas.toDataURL('image/png'));
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUserImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const reset = () => {
    setUserImage(null);
    stopCamera();
    setScale(1);
    setRotation(0);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
    >
      <div className="relative w-full max-w-4xl bg-white h-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-xl md:text-2xl font-serif font-bold text-brand-dark flex items-center">
              <Sparkles className="mr-2 text-brand-gold" size={24} />
              AI Virtual Try-On
            </h2>
            <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Previewing: {productName}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-brand-dark"
          >
            <X size={24} />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-grow relative bg-gray-50 flex items-center justify-center overflow-hidden">
          {!userImage && !isCameraActive && (
            <div className="text-center space-y-8 p-8 max-w-md">
              <div className="w-20 h-20 bg-brand-cream rounded-full flex items-center justify-center mx-auto text-brand-gold">
                <Camera size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-brand-dark">Ready for your fitting?</h3>
                <p className="text-sm text-gray-500">Upload a photo or use your camera to see how this piece looks on you.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={startCamera}
                  disabled={isLoading}
                  className="flex items-center justify-center space-x-2 bg-brand-dark text-white py-4 px-6 text-xs font-bold tracking-widest uppercase hover:bg-brand-gold transition-all disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
                  <span>Use Camera</span>
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center space-x-2 border border-brand-dark text-brand-dark py-4 px-6 text-xs font-bold tracking-widest uppercase hover:bg-brand-dark hover:text-white transition-all"
                >
                  <Upload size={18} />
                  <span>Upload Photo</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <p className="text-[10px] text-gray-400 italic">Your photo is processed locally and never stored on our servers.</p>
            </div>
          )}

          {isCameraActive && (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-8 flex space-x-4">
                <button 
                  onClick={capturePhoto}
                  className="w-16 h-16 bg-white rounded-full border-4 border-brand-gold flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                  <div className="w-12 h-12 bg-brand-dark rounded-full"></div>
                </button>
                <button 
                  onClick={stopCamera}
                  className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
          )}

          {userImage && (
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img 
                src={userImage} 
                alt="User" 
                className="max-w-full max-h-full object-contain opacity-80" 
              />
              
              {/* Draggable Clothing Item */}
              <motion.div 
                drag
                dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }}
                style={{ scale, rotate: rotation }}
                className="absolute z-10 cursor-move group"
              >
                <img 
                  src={productImage || "https://picsum.photos/seed/luxury/400/500"} 
                  alt={productName} 
                  className="w-64 h-auto pointer-events-none drop-shadow-2xl"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-brand-dark text-white text-[10px] py-1 px-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap flex items-center">
                  <Move size={12} className="mr-1" /> Drag to position
                </div>
              </motion.div>

              {/* Controls Overlay */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-4 bg-white/90 backdrop-blur-md p-4 rounded-full shadow-2xl border border-white/20">
                <div className="flex items-center space-x-2 border-r border-gray-200 pr-4">
                  <button 
                    onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Zoom Out"
                  >
                    <Minimize2 size={20} />
                  </button>
                  <span className="text-xs font-bold w-12 text-center">{Math.round(scale * 100)}%</span>
                  <button 
                    onClick={() => setScale(s => Math.min(2, s + 0.1))}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Zoom In"
                  >
                    <Maximize2 size={20} />
                  </button>
                </div>
                
                <div className="flex items-center space-x-2 border-r border-gray-200 pr-4">
                  <button 
                    onClick={() => setRotation(r => r - 15)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Rotate Left"
                  >
                    <RotateCcw size={20} className="scale-x-[-1]" />
                  </button>
                  <button 
                    onClick={() => setRotation(r => r + 15)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Rotate Right"
                  >
                    <RotateCcw size={20} />
                  </button>
                </div>

                <button 
                  onClick={reset}
                  className="p-2 hover:bg-red-50 text-red-500 rounded-full transition-colors"
                  title="Reset Photo"
                >
                  <RotateCcw size={20} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-4 bg-brand-cream/30 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-gray-500">
              <Info size={16} />
              <p className="text-[10px] uppercase tracking-widest font-bold">Tip: Drag the clothing item to align it with your body.</p>
            </div>
            {userImage && (
              <button 
                onClick={() => {
                  // In a real app, we might save this or share it
                  alert("Preview saved to your session!");
                }}
                className="flex items-center space-x-2 bg-brand-dark text-white py-2 px-6 text-[10px] font-bold tracking-widest uppercase hover:bg-brand-gold transition-all"
              >
                <Check size={14} />
                <span>Looks Great</span>
              </button>
            )}
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </motion.div>
  );
}
