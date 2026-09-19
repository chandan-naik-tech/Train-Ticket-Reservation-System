import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Train, User, Lock, ShieldAlert } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, adminLogin, user } = useContext(AuthContext);

  const redirectParam = searchParams.get('redirect') || '';

  const [isAdmin, setIsAdmin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isAdmin) {
        await adminLogin(username, password);
        navigate('/admin');
      } else {
        await login(username, password);
        if (redirectParam === 'booking') {
          // Send back to the booking query parameters if previously interrupted
          const rawBooking = localStorage.getItem('temp_booking');
          if (rawBooking) {
            navigate('/payment');
          } else {
            navigate('/search');
          }
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid username or password.');
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
          <h2 className="text-2xl font-black tracking-tight text-white">
            {isAdmin ? 'Admin Console' : 'Sign in to RailVerse'}
          </h2>
          <p className="text-xs text-gray-400">
            {isAdmin ? 'Enter root privileges configuration credentials' : 'Quickly search, book and plan your rail journey'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 text-red-400 rounded-xl text-xs text-center">
            {error}
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
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-gray-400 font-semibold uppercase">Password</label>
              <Link to="/forgot-password" className="text-[10px] text-railway-accent hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
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
            {loading ? 'Verifying profile...' : isAdmin ? 'Access Portal' : 'Login'}
          </button>
        </form>

        {/* Separator / Mode toggles */}
        <div className="border-t border-gray-800/80 pt-4 flex flex-col space-y-3.5 text-center text-xs text-gray-400">
          <div>
            {!isAdmin ? (
              <button 
                onClick={() => { setIsAdmin(true); setError(''); }}
                className="text-red-400 hover:underline flex items-center justify-center space-x-1 mx-auto font-semibold"
              >
                <ShieldAlert size={12} />
                <span>Admin Login</span>
              </button>
            ) : (
              <button 
                onClick={() => { setIsAdmin(false); setError(''); }}
                className="text-railway-accent hover:underline font-semibold"
              >
                Passenger Login
              </button>
            )}
          </div>
          
          <p>
            New to RailVerse?{' '}
            <Link to="/register" className="text-white font-semibold hover:underline">
              Create an Account
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
