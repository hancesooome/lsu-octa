import React, { useState } from 'react';
import { X } from 'lucide-react';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [role, setRole] = useState<'student' | 'librarian'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      if (response.ok) {
        const user = await response.json();
        onLogin(user);
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-lsu-green-deep/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md glass-panel p-10 md:p-12 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-lsu-green-deep via-lsu-green-primary to-lsu-gold"></div>
            
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-theme-muted hover:text-lsu-green-primary transition-colors bg-white/10 rounded-full"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-10">
              <h2 className="text-3xl font-serif font-medium text-theme-title mb-2">Institutional Access</h2>
              <p className="text-theme-muted font-light">Secure login for LSU OCTA members</p>
            </div>

            <div className="flex p-1.5 bg-lsu-green-deep/5 rounded-2xl mb-8">
              <button
                onClick={() => setRole('student')}
                className={`flex-1 py-2.5 text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all duration-300 ${
                  role === 'student' 
                    ? 'bg-white text-lsu-green-deep shadow-sm' 
                    : 'text-lsu-muted hover:text-lsu-green-deep'
                }`}
              >
                Student
              </button>
              <button
                onClick={() => setRole('librarian')}
                className={`flex-1 py-2.5 text-xs font-mono font-bold uppercase tracking-widest rounded-xl transition-all duration-300 ${
                  role === 'librarian' 
                    ? 'bg-white text-lsu-green-deep shadow-sm' 
                    : 'text-lsu-muted hover:text-lsu-green-deep'
                }`}
              >
                Librarian
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="section-label !mb-0 ml-1">Academic Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'student' ? 'student@lsu.edu.ph' : 'librarian@lsu.edu.ph'}
                  className="w-full input-glass"
                />
              </div>
              <div className="space-y-2">
                <label className="section-label !mb-0 ml-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full input-glass"
                />
              </div>

              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-xs text-center font-medium bg-red-50 py-2 rounded-lg"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-4 mt-4 text-sm font-mono font-bold uppercase tracking-[0.2em]"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button className="text-xs text-theme-muted font-light hover:text-lsu-green-primary transition-colors">
                Trouble signing in? <span className="font-medium underline">Contact Support</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
