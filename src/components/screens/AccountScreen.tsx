import { useState } from 'react';
import { motion } from 'framer-motion';
import { AuthPayload } from '../../types';

interface AccountScreenProps {
  onSubmit?: (payload: AuthPayload, mode: 'login' | 'signup') => void; // Optional callback for when form is submitted
}

export function AccountScreen({ onSubmit }: AccountScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(''); // For signup
  const [isFocused, setIsFocused] = useState<string | null>(null);
  const [isSignup, setIsSignup] = useState(false);

  const handleSubmit = () => {
    const mode: 'login' | 'signup' = isSignup ? 'signup' : 'login';
    const payload: AuthPayload = {
      username,
      password,
      email,
    };
    onSubmit?.(payload);
  };

  const handleGoogleAuth = () => {
    // TODO: Implement Google OAuth
    console.log('Google authentication not yet implemented');
  };

  return (
    <div className="h-screen overflow-y-auto flex items-center justify-center px-16 relative">
      {/* Login Card with Premium Glassmorphism */}
      <motion.div 
        className="relative z-10 w-full max-w-md"
        style={{
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(25px)',
          border: 'none',
          boxShadow: '0 0 50px 0 #990024',
          padding: '64px 48px',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Scanline Texture Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.03) 0px, transparent 1px, transparent 2px)',
            backgroundSize: '100% 2px',
            opacity: 1,
          }}
        />
        {/* Header */}
        <div className="text-center mb-12">
          <div 
            className="w-20 h-20 mx-auto border-2 flex items-center justify-center mb-6"
            style={{
              borderColor: '#ff003c',
              boxShadow: '0 0 16px rgba(255, 0, 60, 0.3)',
            }}
          >
            <div 
              className="font-mono text-sm font-black"
              style={{ color: '#ff003c' }}
            >
              SS
            </div>
          </div>
          <h2 
            className="text-6xl leading-[0.85] font-black tracking-tighter uppercase mb-4"
            style={{ 
              fontFamily: 'Impact, "Anton", "Teko", sans-serif',
              color: '#ff003c',
              textShadow: '0 0 20px rgba(255, 0, 60, 0.5)',
            }}
          >
            ACCESS
          </h2>
          <p className="font-mono text-[10px] text-gray-500 tracking-wider">
            AUTHENTICATION_REQUIRED
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Username Field - Filled Style */}
          <div className="relative">
            <label className="font-mono text-[10px] text-gray-500 tracking-wider block mb-3">
              USERNAME
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setIsFocused('username')}
              onBlur={() => setIsFocused(null)}
              className="w-full px-5 py-4 font-mono text-sm text-white outline-none transition-all duration-300"
              style={{
                backgroundColor: '#111111',
                border: 'none',
                borderBottom: isFocused === 'username' ? '2px solid #FF003C' : '2px solid transparent',
              }}
              placeholder="ENTER_USERNAME"
            />
            <style>{`
              input::placeholder {
                color: rgba(255, 255, 255, 0.4);
              }
            `}</style>
          </div>

          {/* Email Field (for signup) - Filled Style */}
          {isSignup && (
            <div className="relative">
              <label className="font-mono text-[10px] text-gray-500 tracking-wider block mb-3">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsFocused('email')}
                onBlur={() => setIsFocused(null)}
                className="w-full px-5 py-4 font-mono text-sm text-white outline-none transition-all duration-300"
                style={{
                  backgroundColor: '#111111',
                  border: 'none',
                  borderBottom: isFocused === 'email' ? '2px solid #FF003C' : '2px solid transparent',
                }}
                placeholder="ENTER_EMAIL"
              />
            </div>
          )}

          {/* Password Field - Filled Style */}
          <div className="relative">
            <label className="font-mono text-[10px] text-gray-500 tracking-wider block mb-3">
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setIsFocused('password')}
              onBlur={() => setIsFocused(null)}
              className="w-full px-5 py-4 font-mono text-sm text-white outline-none transition-all duration-300"
              style={{
                backgroundColor: '#111111',
                border: 'none',
                borderBottom: isFocused === 'password' ? '2px solid #FF003C' : '2px solid transparent',
              }}
              placeholder="ENTER_PASSWORD"
            />
          </div>

          {/* Primary Button - Solid Electric Red */}
          <motion.button 
            onClick={handleSubmit}
            className="w-full py-5 font-mono text-sm font-bold transition-all duration-300"
            style={{
              backgroundColor: '#FF003C',
              color: '#000000',
              border: 'none',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSignup ? 'CREATE_ACCOUNT' : 'INITIALIZE_LINK'}
          </motion.button>

          {/* Google Sign-On - Tactical Ghost Button */}
          <motion.button 
            onClick={handleGoogleAuth}
            className="w-full py-4 font-mono text-sm transition-all duration-300 flex items-center justify-center gap-3"
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #333333',
              color: '#ffffff',
            }}
            whileHover={{ 
              borderColor: '#666666',
              scale: 1.01,
            }}
            whileTap={{ scale: 0.99 }}
          >
            {/* Google G Icon - Monochrome White */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#ffffff"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#ffffff"/>
              <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z" fill="#ffffff"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#ffffff"/>
            </svg>
            <span>AUTHENTICATE_WITH_GOOGLE</span>
          </motion.button>
        </div>

        {/* Footer - in flow so it stays inside the black card */}
        <div 
          className="px-0 text-center"
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            marginTop: '40px',
            paddingTop: '32px',
            paddingBottom: '24px',
          }}
        >
          <button 
            onClick={() => setIsSignup(!isSignup)}
            className="font-mono text-[10px] text-gray-500 tracking-wider hover:text-[#ff003c] transition-colors block w-full"
            style={{ marginBottom: '20px' }}
          >
            {isSignup ? 'ALREADY_HAVE_ACCOUNT?' : 'CREATE_NEW_ACCOUNT?'}
          </button>
          {!isSignup && (
            <button className="font-mono text-[10px] text-gray-500 tracking-wider hover:text-[#ff003c] transition-colors block w-full">
              FORGOT_CREDENTIALS?
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}