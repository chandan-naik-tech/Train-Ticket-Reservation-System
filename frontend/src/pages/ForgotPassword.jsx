import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Train, User, Mail, Lock } from 'lucide-react';
import api from '../utils/api';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', {
        username,
        email,
        newPassword
      });
      setSuccess(res.data.message);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Verification failed. Double check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="relative min-h-[85vh] flex items-center justify-center py-12 px-6 bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(to bottom, rgba(3, 7, 18, 0.7) 0%, rgba(3, 7, 18, 0.95) 100%), url('/train_bg.jpg')` }}
    >
      <div className="max-w-md w-full glass-card border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="bg-railway-accent/20 p-3 rounded-2xl text-railway-accent w-fit mx-auto">
            <Train size={28} />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">Reset Account Password</h2>
          <p className="text-xs text-gray-400">Provide registered account username and email to setup new password</p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-400 rounded-xl text-xs text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs text-center">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] text-gray-400 font-semibold uppercase">Username</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
                required
              />
              <User size={14} className="absolute left-3.5 top-3.5 text-gray-500" />
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[10px] text-gray-400 font-semibold uppercase">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
                required
              />
              <Mail size={14} className="absolute left-3.5 top-3.5 text-gray-500" />
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[10px] text-gray-400 font-semibold uppercase">New Password</label>
            <div className="relative">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs"
                required
              />
              <Lock size={14} className="absolute left-3.5 top-3.5 text-gray-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 glass-btn rounded-xl text-xs font-bold uppercase tracking-wider"
          >
            {loading ? 'Validating credentials...' : 'Reset Password'}
          </button>
        </form>

        <div className="border-t border-gray-800/80 pt-4 text-center text-xs text-gray-400">
          <p>
            Remembered password?{' '}
            <Link to="/login" className="text-white font-semibold hover:underline">
              Login here
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
