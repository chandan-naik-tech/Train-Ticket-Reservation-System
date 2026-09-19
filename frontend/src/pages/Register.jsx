import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Train, User, Lock, Mail, Phone, Fingerprint } from 'lucide-react';
import api from '../utils/api';

export default function Register() {
  const navigate = useNavigate();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [role, setRole] = useState('user');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Core Form validations
    if (role === 'user') {
      if (aadhaar.length !== 12 || isNaN(aadhaar)) {
        setError('Please provide a valid 12-digit Aadhaar number.');
        return;
      }
      if (phone.length < 10) {
        setError('Please provide a valid phone number.');
        return;
      }
    }

    setLoading(true);

    try {
      if (role === 'admin') {
        await api.post('/auth/admin/register', {
          username,
          email,
          password
        });
      } else {
        await api.post('/auth/register', {
          username,
          email,
          password,
          full_name: fullName,
          phone,
          aadhaar
        });
      }
      setSuccess(`${role === 'admin' ? 'Admin' : 'Passenger'} account created successfully! Loading login form...`);
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="relative min-h-[90vh] flex items-center justify-center py-12 px-6 bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(to bottom, rgba(3, 7, 18, 0.7) 0%, rgba(3, 7, 18, 0.95) 100%), url('/train_bg.jpg')` }}
    >
      <div className="max-w-lg w-full glass-card border border-white/10 rounded-3xl p-8 space-y-6 shadow-2xl">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="bg-railway-accent/20 p-3 rounded-2xl text-railway-accent w-fit mx-auto">
            <Train size={28} />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">Create {role === 'admin' ? 'Admin' : 'Passenger'} Account</h2>
          <p className="text-xs text-gray-400">Join RailVerse AI to access smart bookings and visual coach mappings</p>
        </div>

        {/* Role Toggle */}
        <div className="flex bg-slate-900/50 p-1 rounded-xl border border-gray-800 w-full max-w-xs mx-auto mb-4">
          <button
            type="button"
            onClick={() => setRole('user')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${role === 'user' ? 'bg-railway-accent text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            Passenger
          </button>
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${role === 'admin' ? 'bg-red-500/20 text-red-400 shadow-md border border-red-500/30' : 'text-gray-400 hover:text-white'}`}
          >
            Administrator
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-400 rounded-xl text-xs text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs text-center animate-pulse">
            {success}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="flex flex-col space-y-1">
            <label className="text-[10px] text-gray-400 font-semibold uppercase">Username</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Unique username..."
                className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
                required
              />
              <User size={12} className="absolute left-3.5 top-3.5 text-gray-500" />
            </div>
          </div>

          <div className="flex flex-col space-y-1">
            <label className="text-[10px] text-gray-400 font-semibold uppercase">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@email.com"
                className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
                required
              />
              <Mail size={12} className="absolute left-3.5 top-3.5 text-gray-500" />
            </div>
          </div>

          {role === 'user' && (
            <>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-gray-400 font-semibold uppercase">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="As in ID card..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
                    required={role === 'user'}
                  />
                  <User size={12} className="absolute left-3.5 top-3.5 text-gray-500" />
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-gray-400 font-semibold uppercase">Contact Phone</label>
                <div className="relative">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Mobile number..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
                    required={role === 'user'}
                  />
                  <Phone size={12} className="absolute left-3.5 top-3.5 text-gray-500" />
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-gray-400 font-semibold uppercase">Aadhaar ID (12-Digit)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={aadhaar}
                    maxLength={12}
                    onChange={(e) => setAadhaar(e.target.value)}
                    placeholder="National Identity ID..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
                    required={role === 'user'}
                  />
                  <Fingerprint size={12} className="absolute left-3.5 top-3.5 text-gray-500" />
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col space-y-1">
            <label className="text-[10px] text-gray-400 font-semibold uppercase">Security Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full pl-10 pr-4 py-2 rounded-xl glass-input text-xs"
                required
              />
              <Lock size={12} className="absolute left-3.5 top-3.5 text-gray-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.8 glass-btn rounded-xl text-xs font-bold uppercase col-span-2 tracking-wider mt-3"
          >
            {loading ? 'Creating database profile...' : 'Register Profile'}
          </button>

        </form>

        <div className="border-t border-gray-800/80 pt-4 text-center text-xs text-gray-400">
          <p>
            Already registered?{' '}
            <Link to="/login" className="text-white font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
