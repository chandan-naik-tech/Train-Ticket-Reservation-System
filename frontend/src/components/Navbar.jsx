import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Train, User, LogOut, Wallet, Bot, Search, BarChart, Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [pnrSearch, setPnrSearch] = useState('');

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
      document.documentElement.classList.add('light');
      document.body.classList.add('light');
      return false;
    } else {
      document.documentElement.classList.remove('light');
      document.body.classList.remove('light');
      return true;
    }
  });

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.add('light');
      document.body.classList.add('light');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.remove('light');
      document.body.classList.remove('light');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  const handlePnrSearchSubmit = (e) => {
    e.preventDefault();
    if (pnrSearch.trim().length === 10) {
      navigate(`/search?pnr=${pnrSearch.trim()}`);
      setPnrSearch('');
    } else {
      alert('Please enter a valid 10-digit PNR number.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full glass-card border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      {/* Brand logo */}
      <Link to="/" className="flex items-center space-x-3 text-2xl font-bold tracking-tight text-white hover:opacity-90">
        <div className="bg-gradient-to-tr from-railway-accent to-railway-gold p-2 rounded-xl text-railway-dark glow-glow">
          <Train size={24} className="animate-pulse" />
        </div>
        <span>
          Rail<span className="text-railway-accent">Verse</span>
          <span className="text-xs font-semibold px-2 py-0.5 bg-railway-gold text-railway-dark rounded-full ml-1.5 align-middle">AI</span>
        </span>
      </Link>

      {/* PNR search box */}
      <form onSubmit={handlePnrSearchSubmit} className="hidden md:flex items-center relative max-w-xs w-full mx-6">
        <input
          type="text"
          placeholder="Track 10-digit PNR..."
          value={pnrSearch}
          onChange={(e) => setPnrSearch(e.target.value)}
          maxLength={10}
          className="w-full pl-10 pr-4 py-2 text-sm rounded-xl glass-input placeholder-gray-500"
        />
        <Search size={16} className="absolute left-3.5 text-gray-500" />
      </form>

      {/* Nav Menu */}
      <div className="flex items-center space-x-6">
        <Link to="/" className="hover:text-railway-accent transition-colors font-medium">Home</Link>
        <Link to="/search" className="hover:text-railway-accent transition-colors font-medium">Search Trains</Link>
        <Link to="/live" className="text-railway-accent hover:text-railway-gold font-medium transition-colors relative flex items-center space-x-1">
          <span className="absolute -top-1 -right-2 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span>Live Status</span>
        </Link>
        <Link to="/ai-planner" className="flex items-center space-x-1.5 text-railway-gold hover:text-white transition-colors font-medium">
          <Bot size={16} />
          <span>AI Planner</span>
        </Link>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="text-gray-400 hover:text-railway-accent transition-colors p-2 hover:bg-slate-800/40 rounded-xl flex items-center justify-center"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-indigo-600" />}
        </button>

        {user ? (
          <div className="flex items-center space-x-6">
            {/* Admin link */}
            {user.role === 'admin' ? (
              <Link to="/admin" className="flex items-center space-x-1.5 text-red-400 hover:text-white transition-colors font-semibold bg-red-950/40 px-3.5 py-1.5 rounded-lg border border-red-900/50">
                <BarChart size={16} />
                <span>Admin Portal</span>
              </Link>
            ) : (
              /* Wallet balance */
              <div className="hidden lg:flex items-center space-x-2 bg-railway-navy/40 px-3.5 py-1.5 rounded-xl border border-railway-navy/60">
                <Wallet size={16} className="text-railway-gold" />
                <span className="text-sm font-semibold text-railway-gold">₹{parseFloat(user.wallet_balance).toFixed(2)}</span>
              </div>
            )}

            {/* Dashboard / User link */}
            <Link to="/dashboard" className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-3.5 py-1.5 rounded-xl transition-all border border-gray-700">
              <User size={16} className="text-railway-accent" />
              <span className="text-sm text-gray-300 font-medium hidden sm:inline">{user.full_name || user.username}</span>
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Logout"
              className="text-gray-400 hover:text-red-400 transition-colors p-2 hover:bg-red-950/20 rounded-xl"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Link to="/login" className="text-gray-300 hover:text-white transition-colors px-4 py-2 font-medium">
              Login
            </Link>
            <Link to="/register" className="glass-btn px-4.5 py-2.2 rounded-xl text-sm font-semibold">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
