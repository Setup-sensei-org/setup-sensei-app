import { useState } from 'react';
import { AuthPayload } from '../../types';

interface AccountScreenProps {
  onSubmit?: (payload: AuthPayload) => void; // Optional callback for when form is submitted
}

export function AccountScreen({ onSubmit }: AccountScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(''); // For signup
  const [isFocused, setIsFocused] = useState<string | null>(null);
  const [isSignup, setIsSignup] = useState(false);

  const handleSubmit = () => {
    const payload: AuthPayload = {
      username,
      password,
      ...(isSignup && { email }), // Include email only for signup
    };
    onSubmit?.(payload);
  };

  return (
    <div className="h-screen overflow-y-auto flex items-center justify-center px-16 relative">
      {/* Dimmed Biometric Background with parallax */}
      <svg viewBox="0 0 400 600" className="absolute inset-0 w-full h-auto max-h-screen opacity-5">
        {/* Head */}
        <ellipse cx="200" cy="60" rx="40" ry="50" fill="none" stroke="#ff003c" strokeWidth="1" />
        {/* Neck */}
        <line x1="200" y1="110" x2="200" y2="140" stroke="#ff003c" strokeWidth="2" />
        {/* Torso */}
        <rect x="160" y="140" width="80" height="120" fill="none" stroke="#ff003c" strokeWidth="2" />
        {/* Left Arm */}
        <line x1="160" y1="140" x2="100" y2="200" stroke="#ff003c" strokeWidth="2" />
        <line x1="100" y1="200" x2="80" y2="280" stroke="#ff003c" strokeWidth="2" />
        {/* Right Arm */}
        <line x1="240" y1="140" x2="300" y2="200" stroke="#ff003c" strokeWidth="2" />
        <line x1="300" y1="200" x2="320" y2="280" stroke="#ff003c" strokeWidth="2" />
        {/* Left Leg */}
        <line x1="180" y1="260" x2="170" y2="400" stroke="#ff003c" strokeWidth="2" />
        <line x1="170" y1="400" x2="160" y2="560" stroke="#ff003c" strokeWidth="2" />
        {/* Right Leg */}
        <line x1="220" y1="260" x2="230" y2="400" stroke="#ff003c" strokeWidth="2" />
        <line x1="230" y1="400" x2="240" y2="560" stroke="#ff003c" strokeWidth="2" />
      </svg>

      {/* Login Card with Glassmorphism */}
      <div 
        className="relative z-10 w-full max-w-md border p-12"
        style={{
          background: 'rgba(10, 10, 10, 0.85)',
          backdropFilter: 'blur(20px)',
          borderColor: '#ff003c',
          borderWidth: '1px',
          boxShadow: '0 0 40px rgba(255, 0, 60, 0.2)',
        }}
      >
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
          {/* Username Field */}
          <div>
            <label className="font-mono text-[10px] text-gray-500 tracking-wider block mb-3">
              USERNAME
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setIsFocused('username')}
              onBlur={() => setIsFocused(null)}
              className="w-full bg-transparent border px-5 py-4 font-mono text-sm text-white outline-none transition-all duration-300"
              style={{
                borderColor: isFocused === 'username' ? '#ff003c' : '#333333',
                boxShadow: isFocused === 'username' ? '0 0 16px rgba(255, 0, 60, 0.3)' : 'none',
              }}
              placeholder="ENTER_USERNAME"
            />
          </div>

          {/* Email Field (for signup) */}
          {isSignup && (
            <div>
              <label className="font-mono text-[10px] text-gray-500 tracking-wider block mb-3">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsFocused('email')}
                onBlur={() => setIsFocused(null)}
                className="w-full bg-transparent border px-5 py-4 font-mono text-sm text-white outline-none transition-all duration-300"
                style={{
                  borderColor: isFocused === 'email' ? '#ff003c' : '#333333',
                  boxShadow: isFocused === 'email' ? '0 0 16px rgba(255, 0, 60, 0.3)' : 'none',
                }}
                placeholder="ENTER_EMAIL"
              />
            </div>
          )}

          {/* Password Field */}
          <div>
            <label className="font-mono text-[10px] text-gray-500 tracking-wider block mb-3">
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setIsFocused('password')}
              onBlur={() => setIsFocused(null)}
              className="w-full bg-transparent border px-5 py-4 font-mono text-sm text-white outline-none transition-all duration-300"
              style={{
                borderColor: isFocused === 'password' ? '#ff003c' : '#333333',
                boxShadow: isFocused === 'password' ? '0 0 16px rgba(255, 0, 60, 0.3)' : 'none',
              }}
              placeholder="ENTER_PASSWORD"
            />
          </div>

          {/* Submit Button */}
          <button 
            onClick={handleSubmit}
            className="w-full border-2 py-5 font-mono text-sm transition-all duration-300 hover:scale-[1.02] active:scale-95"
            style={{
              borderColor: '#ff003c',
              color: '#ff003c',
              background: 'transparent',
              boxShadow: '0 0 20px rgba(255, 0, 60, 0.4)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ff003c';
              e.currentTarget.style.color = '#000000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#ff003c';
            }}
          >
            {isSignup ? 'CREATE_ACCOUNT' : 'INITIALIZE_LINK'}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-10 pt-8 border-t text-center space-y-3" style={{ borderColor: '#1a1a1a' }}>
          <button 
            onClick={() => setIsSignup(!isSignup)}
            className="font-mono text-[10px] text-gray-500 tracking-wider hover:text-[#ff003c] transition-colors block w-full"
          >
            {isSignup ? 'ALREADY_HAVE_ACCOUNT?' : 'CREATE_NEW_ACCOUNT?'}
          </button>
          {!isSignup && (
            <button className="font-mono text-[10px] text-gray-500 tracking-wider hover:text-[#ff003c] transition-colors">
              FORGOT_CREDENTIALS?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}