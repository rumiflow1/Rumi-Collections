import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAppContext } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';
import { authApi } from '../services/api';
import { Mail, Lock, User as UserIcon, ArrowRight, Chrome, AlertCircle, Eye, EyeOff, Key, ShieldCheck } from 'lucide-react';

/**
 * SOVEREIGN AUTHENTICATION INTERFACE - LUXURY EDITION
 * Features: Multi-step Identity Recovery, Show Password, and Master Sync.
 */
export default function Auth() {
  const { SiteConfig } = useConfig();
  const authConfig = SiteConfig?.auth || {
    loginTitle: 'Sign In',
    loginSubtitle: 'Welcome to our store.',
    signupTitle: 'Sign Up',
    signupSubtitle: 'Create Your Style Identity',
    recoveryTitle: 'Reset Password',
    recoverySubtitleEmail: 'Enter email and we will send you a reset link.',
    recoverySubtitleCode: 'A verification code was sent to your email.',
    recoverySubtitleReset: 'Create new password',
    leftImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=2070'
  };

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Luxury Identity Recovery States
  const [forgotStep, setForgotStep] = useState<'none' | 'email' | 'code' | 'reset'>('none');
  const [resetCode, setResetCode] = useState('');
  const [timer, setTimer] = useState(0);

  const { user, isSuperAdmin, loading: authLoading, loginWithGoogle, loginWithEmail, signupWithEmail, reportActivityToBackend } = useAuth();
  const { addToast } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // FIX 1: Added '!loading' and '!authLoading' condition here.
  // Ab yeh tab tak redirect nahi karega jab tak Backend ko email send na ho jaye!
  useEffect(() => {
    if (user && !loading && !authLoading) {
      // Automatic Redirection based on Identity
      const isHardcodedAdmin = user.email === 'admin@rumi.com' || sessionStorage.getItem('hardcodedAdmin') === 'true';
      
      if (isSuperAdmin || isHardcodedAdmin) {
        console.log("🚀 [ADMIN REDIRECT]: Navigating to Sovereign Dashboard");
        navigate('/admin', { replace: true });
      } else {
        const from = (location.state as any)?.from?.pathname || '/profile';
        navigate(from, { replace: true });
      }
    }
  }, [user, isSuperAdmin, navigate, location, loading, authLoading]);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true); // FIX 2: Added loading state to prevent premature navigation
    try {
      const result = await loginWithGoogle();

      // FIX 3: Dynamically check if Google user is actually new or returning
      const isNewUser = (result as any)?._tokenResponse?.isNewUser || 
                       (result?.user?.metadata?.creationTime === result?.user?.metadata?.lastSignInTime);

      // Sync handled by onAuthStateChanged in useAuth
      
      addToast('Success. Redirecting...', 'success');
      
      // Immediate redirection check
      const isHardcodedAdmin = result.user.email === 'admin@rumi.com';
      if (isHardcodedAdmin) {
        navigate('/admin', { replace: true });
      } else {
        const from = (location.state as any)?.from?.pathname || '/profile';
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message);
      addToast('Google Authority Verification Failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const result = await loginWithEmail(email, password);
        // Sync handled by onAuthStateChanged in useAuth
        addToast('Identity Authenticated. Redirecting...', 'success');
        
        // Immediate redirection
        if (email === 'admin@rumi.com') {
          navigate('/admin', { replace: true });
        } else {
          const from = (location.state as any)?.from?.pathname || '/profile';
          navigate(from, { replace: true });
        }
      } else {
        if (!name || !phone) throw new Error('Identity details incomplete.');
        if (password.length < 6) throw new Error('Security threshold requires 6+ characters.');
        
        const result = await signupWithEmail(email, password, name, phone);
        // Sync handled by onAuthStateChanged in useAuth
        addToast('Account Created. Redirecting...', 'success');
        
        // Immediate redirection
        const from = (location.state as any)?.from?.pathname || '/profile';
        navigate(from, { replace: true });
      }
      
    } catch (err: any) {
      let msg = err.message;
      if (err.code === 'auth/wrong-password') msg = 'Invalid credentials for this identity.';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false); // FIX 4: Jab API call complete ho jayegi tab loading false hogi aur redirect chalega!
    }
  };

  // --- LUXURY FORGOT PASSWORD HANDLER (Connected to Master Backend) ---
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (forgotStep === 'email') {
        await authApi.forgotPassword(email);
        setForgotStep('code');
        setTimer(60);
        addToast('Security key dispatched to your atelier email.', 'success');
      } else if (forgotStep === 'code') {
        if (resetCode.length !== 6) throw new Error('Invalid 6-digit code provided.');
        await authApi.verifyCode(email, resetCode);
        setForgotStep('reset');
      } else if (forgotStep === 'reset') {
        if (password !== confirmPassword) throw new Error('Security keys do not match.');
        await authApi.resetPassword(email, resetCode, password);
        addToast('Identity Credentials Updated.', 'success');
        setForgotStep('none');
        setIsLogin(true);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message;
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- UI FOR IDENTITY RECOVERY ---
  if (forgotStep !== 'none') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB] p-4">
        <div className="max-w-md w-full bg-white shadow-2xl p-10 border border-gray-100">
          <div className="text-center mb-10">
            <ShieldCheck className="mx-auto text-[#C5A059] mb-6" size={54} />
            <h1 className="text-2xl font-serif tracking-[0.2em] uppercase">{authConfig.recoveryTitle}</h1>
            <p className="text-gray-400 text-[10px] mt-2 uppercase tracking-widest">
              {forgotStep === 'email' ? authConfig.recoverySubtitleEmail :
               forgotStep === 'code' ? authConfig.recoverySubtitleCode : 
               authConfig.recoverySubtitleReset}
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-8">
            {forgotStep === 'email' && (
              <div className="relative border-b border-gray-200">
                <Mail className="absolute left-0 top-3 text-gray-400" size={16} />
                <input type="email" placeholder="Identity Email" className="w-full pl-8 py-3 focus:outline-none text-sm" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            )}

            {forgotStep === 'code' && (
              <div className="space-y-4 text-center">
                <input type="text" maxLength={6} placeholder="000000" className="w-full text-center text-3xl tracking-[0.6em] font-serif border-b py-4 focus:outline-none" value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g, ''))} required />
                {timer > 0 ? (
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Key Valid for {timer}s</p>
                ) : (
                  <button type="button" onClick={() => setForgotStep('email')} className="text-xs text-[#C5A059] font-bold underline">Resend Key</button>
                )}
              </div>
            )}

            {forgotStep === 'reset' && (
              <div className="space-y-6">
                <div className="relative border-b border-gray-200">
                  <Lock className="absolute left-0 top-3 text-gray-400" size={16} />
                  <input type={showPassword ? "text" : "password"} placeholder="New Private Key" className="w-full pl-8 py-3 focus:outline-none text-sm" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
                <div className="relative border-b border-gray-200">
                  <Lock className="absolute left-0 top-3 text-gray-400" size={16} />
                  <input type={showPassword ? "text" : "password"} placeholder="Confirm Key" className="w-full pl-8 py-3 focus:outline-none text-sm" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-black text-white py-4 uppercase tracking-[0.3em] text-xs font-bold hover:opacity-80">
              {loading ? 'Processing...' : 'Continue'}
            </button>

            <button type="button" onClick={() => setForgotStep('none')} className="w-full text-[10px] text-gray-400 uppercase tracking-widest hover:text-black">Back to login</button>
          </form>
        </div>
      </div>
    );
  }

  // --- MAIN UI RENDERING ---
  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-[#FDFCFB]">
      <div className="max-w-6xl w-full bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] flex flex-col md:flex-row overflow-hidden border border-gray-100">
        {/* Left Side: Editorial Backdrop */}
        <div className="hidden md:block md:w-1/2 relative bg-black">
          <img src={authConfig.leftImage} alt="Luxury" className="absolute inset-0 w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 flex flex-col justify-end p-16 text-white bg-gradient-to-t from-black/80 to-transparent">
            <h2 className="text-5xl font-serif leading-tight mb-4">{authConfig.signupSubtitle}</h2>
            <p className="text-[10px] tracking-[0.5em] uppercase opacity-70">Exclusive Account Access</p>
          </div>
        </div>

        {/* Right Side: Identity Interface */}
        <div className="w-full md:w-1/2 p-10 md:p-20 flex flex-col justify-center">
          <div className="mb-12 text-center md:text-left">
            <h1 className="text-3xl font-serif font-bold text-black mb-2 uppercase tracking-[0.1em]">{isLogin ? authConfig.loginTitle : authConfig.signupTitle}</h1>
            <p className="text-gray-400 text-xs uppercase tracking-widest">{authConfig.loginSubtitle}</p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border-l-2 border-red-500 flex items-center gap-3 text-red-700 text-xs">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {!isLogin && (
              <>
                <div className="relative border-b border-gray-200">
                  <UserIcon className="absolute left-0 top-3 text-gray-400" size={16} />
                  <input type="text" placeholder="Identity Name" className="w-full pl-8 py-3 focus:outline-none text-sm" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="relative border-b border-gray-200">
                  <AlertCircle className="absolute left-0 top-3 text-gray-400" size={16} />
                  <input type="tel" placeholder="Mobile Number" className="w-full pl-8 py-3 focus:outline-none text-sm" value={phone} onChange={e => setPhone(e.target.value)} required />
                </div>
              </>
            )}

            <div className="relative border-b border-gray-200">
              <Mail className="absolute left-0 top-3 text-gray-400" size={16} />
              <input type="email" placeholder="Identity Email" className="w-full pl-8 py-3 focus:outline-none text-sm" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            <div className="relative border-b border-gray-200">
              <Lock className="absolute left-0 top-3 text-gray-400" size={16} />
              <input type={showPassword ? "text" : "password"} placeholder="Private Key" className="w-full pl-8 pr-10 py-3 focus:outline-none text-sm" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-0 top-3 text-gray-400 hover:text-black transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button type="button" onClick={() => setForgotStep('email')} className="text-[10px] font-bold text-[#C5A059] uppercase tracking-[0.2em] hover:underline">Forgot Password?</button>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-black text-white py-5 uppercase tracking-[0.4em] text-[10px] font-bold hover:opacity-90 transition-all flex items-center justify-center gap-4 group">
              {loading ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Sign Up')}
              <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </form>

          <div className="mt-12">
            <div className="relative flex items-center justify-center mb-8">
              <div className="border-t border-gray-100 w-full"></div>
              <span className="bg-white px-6 text-[10px] text-gray-400 uppercase tracking-[0.3em] absolute italic">OR PROCEED VIA</span>
            </div>

            <button onClick={handleGoogleLogin} className="w-full border border-gray-200 py-4 flex items-center justify-center gap-4 hover:bg-gray-50 transition-colors text-[10px] font-bold uppercase tracking-widest">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <p className="mt-12 text-center text-[10px] text-gray-400 uppercase tracking-widest">
            {isLogin ? "New to our store?" : "Already have an account?"}{' '}
            <button onClick={() => setIsLogin(!isLogin)} className="text-[#C5A059] font-bold underline ml-2">
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
