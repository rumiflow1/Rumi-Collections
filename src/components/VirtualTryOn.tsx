import React,{useEffect,useRef,useState}from 'react';
import {motion}from 'motion/react';
import {Camera,Upload,X,Loader2,Check,Info,RefreshCw}from 'lucide-react';
import {tryOnApi} from '../services/api';
import {resolveImageUrl} from '../lib/utils';

interface VirtualTryOnProps{productImage:string;productName:string;onClose:()=>void;}

const fileToDataUrl=(file:File)=>new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Photo could not be read'));reader.readAsDataURL(file);});
const remoteToDataUrl=async(url:string)=>{
  const response=await fetch(resolveImageUrl(url));
  if(!response.ok)throw new Error('Garment image could not be loaded');
  const blob=await response.blob();
  return fileToDataUrl(new File([blob],'garment-image',{type:blob.type||'image/jpeg'}));
};

export default function VirtualTryOn({productImage,productName,onClose}:VirtualTryOnProps){
  const[userImage,setUserImage]=useState<string|null>(null);
  const[resultImage,setResultImage]=useState<string|null>(null);
  const[isCameraActive,setIsCameraActive]=useState(false);
  const[isGenerating,setIsGenerating]=useState(false);
  const[error,setError]=useState('');
  const videoRef=useRef<HTMLVideoElement>(null);const canvasRef=useRef<HTMLCanvasElement>(null);const fileInputRef=useRef<HTMLInputElement>(null);

  const stopCamera=()=>{const stream=videoRef.current?.srcObject as MediaStream|null;if(stream)stream.getTracks().forEach(track=>track.stop());if(videoRef.current)videoRef.current.srcObject=null;setIsCameraActive(false);};
  useEffect(()=>()=>stopCamera(),[]);
  const startCamera=async()=>{setError('');try{const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'}});if(videoRef.current){videoRef.current.srcObject=stream;setIsCameraActive(true);}}catch{setError('Camera access was not available. You can upload a photo instead.');}};
  const capture=()=>{const video=videoRef.current,canvas=canvasRef.current;if(!video||!canvas)return;canvas.width=video.videoWidth;canvas.height=video.videoHeight;const ctx=canvas.getContext('2d');if(!ctx)return;ctx.drawImage(video,0,0,canvas.width,canvas.height);setUserImage(canvas.toDataURL('image/jpeg',.92));setResultImage(null);stopCamera();};
  const onUpload=async(e:React.ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];if(!file)return;setError('');setResultImage(null);try{setUserImage(await fileToDataUrl(file));}catch{setError('That photo could not be opened.');}};
  const generate=async()=>{if(!userImage)return;setIsGenerating(true);setError('');try{const garment=await remoteToDataUrl(productImage);const response=await tryOnApi.generate(userImage,garment,productName);const image=response.data?.image;if(!image)throw new Error('No fitting image was returned');setResultImage(image);}catch(err:any){setError(err?.response?.data?.error||err?.message||'The virtual fitting could not be completed. Please try another clear photo.');}finally{setIsGenerating(false);}};
  const reset=()=>{setUserImage(null);setResultImage(null);setError('');stopCamera();};

  return <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 md:p-8">
    <div className="relative w-full max-w-5xl bg-white max-h-[92vh] overflow-y-auto shadow-2xl">
      <div className="sticky top-0 z-20 p-5 md:p-7 border-b border-gray-100 flex justify-between items-center bg-white">
        <div><h2 className="text-xl md:text-2xl font-serif font-bold text-brand-dark">Virtual Fitting</h2><p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">{productName}</p></div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X size={24}/></button>
      </div>
      <div className="p-5 md:p-8">
        {!userImage&&!isCameraActive&&<div className="max-w-lg mx-auto text-center py-10 space-y-7"><div className="w-20 h-20 rounded-full bg-brand-cream flex items-center justify-center mx-auto text-brand-gold"><Camera size={38}/></div><div><h3 className="text-lg font-semibold text-brand-dark">Start your fitting</h3><p className="text-sm text-gray-500 mt-2 leading-6">Use a clear, front-facing photo. The fitting service creates a new preview with the selected piece naturally worn on the body.</p></div><div className="grid sm:grid-cols-2 gap-3"><button onClick={startCamera} className="bg-brand-dark text-white py-4 text-xs font-bold tracking-widest uppercase flex justify-center items-center gap-2"><Camera size={17}/>Use camera</button><button onClick={()=>fileInputRef.current?.click()} className="border border-brand-dark py-4 text-xs font-bold tracking-widest uppercase flex justify-center items-center gap-2"><Upload size={17}/>Upload photo</button></div></div>}
        {isCameraActive&&<div className="space-y-4"><div className="relative bg-black aspect-[3/4] max-h-[65vh] overflow-hidden"><video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain"/><div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-3"><button onClick={capture} className="w-14 h-14 bg-white rounded-full border-4 border-brand-gold"/><button onClick={stopCamera} className="px-5 bg-black/60 text-white text-xs font-bold uppercase tracking-widest">Cancel</button></div></div></div>}
        {userImage&&!isCameraActive&&<div className="grid lg:grid-cols-2 gap-6 items-start"><div className="border border-gray-100 p-3 bg-gray-50"><img src={resultImage||userImage} alt="Fitting preview" className="w-full max-h-[65vh] object-contain bg-white"/>{resultImage&&<div className="mt-3 text-center text-[10px] tracking-widest uppercase text-green-700 font-bold">Fitting preview generated</div>}</div><div className="space-y-5"><div className="border border-gray-100 p-4"><p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Selected piece</p><img src={resolveImageUrl(productImage)} alt={productName} className="w-full max-h-72 object-contain"/></div><div className="flex gap-3"><button onClick={generate} disabled={isGenerating} className="flex-1 bg-brand-dark text-white py-4 text-xs font-bold tracking-widest uppercase flex justify-center items-center gap-2 disabled:opacity-60">{isGenerating?<><Loader2 size={17} className="animate-spin"/>Creating fitting…</>:<><Check size={17}/>Create fitting</>}</button><button onClick={reset} className="px-5 border border-gray-200"><RefreshCw size={18}/></button></div><div className="flex gap-2 text-xs text-gray-500"><Info size={16} className="shrink-0 mt-0.5"/><p>Your original photo stays in this session. The generated fitting is returned only for your preview.</p></div></div></div>}
        {error&&<div className="mt-5 border border-red-200 bg-red-50 text-red-700 text-sm p-4">{error}</div>}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={onUpload} className="hidden"/>
      </div>
      <canvas ref={canvasRef} className="hidden"/>
    </div>
  </motion.div>;
}