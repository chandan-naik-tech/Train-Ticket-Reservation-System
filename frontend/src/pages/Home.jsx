import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Calendar, Users, Award, ShieldAlert, BadgeCheck, Star, Bot } from 'lucide-react';
import api from '../utils/api';

export default function Home() {
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  
  // Form states
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [classType, setClassType] = useState('3A');
  const [quota, setQuota] = useState('General');

  // Autocomplete helpers
  const [srcSuggestions, setSrcSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);

  useEffect(() => {
    // Load station lists
    const loadStations = async () => {
      try {
        const res = await api.get('/trains/stations');
        setStations(res.data);
      } catch (err) {
        console.error('Error fetching stations', err);
      }
    };
    loadStations();

    // Default tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const handleSrcChange = (val) => {
    setSource(val);
    if (!val) {
      setSrcSuggestions([]);
      return;
    }
    const filtered = stations.filter(s => 
      s.name.toLowerCase().includes(val.toLowerCase()) || 
      s.code.toLowerCase().includes(val.toLowerCase()) ||
      s.city.toLowerCase().includes(val.toLowerCase())
    ).slice(0, 5);
    setSrcSuggestions(filtered);
  };

  const handleDestChange = (val) => {
    setDestination(val);
    if (!val) {
      setDestSuggestions([]);
      return;
    }
    const filtered = stations.filter(s => 
      s.name.toLowerCase().includes(val.toLowerCase()) || 
      s.code.toLowerCase().includes(val.toLowerCase()) ||
      s.city.toLowerCase().includes(val.toLowerCase())
    ).slice(0, 5);
    setDestSuggestions(filtered);
  };

  const selectSource = (station) => {
    setSource(`${station.name} (${station.code})`);
    setSrcSuggestions([]);
  };

  const selectDest = (station) => {
    setDestination(`${station.name} (${station.code})`);
    setDestSuggestions([]);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!source || !destination) {
      alert('Please fill out source and destination.');
      return;
    }
    navigate(`/search?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&date=${date}&classType=${classType}&quota=${quota}`);
  };

  return (
    <div className="relative min-h-screen">
      {/* 1. Hero Section with realistic train background */}
      <div 
        className="relative w-full min-h-[90vh] flex flex-col items-center justify-center py-20 px-6 bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(to bottom, rgba(3, 7, 18, 0.4) 0%, rgba(3, 7, 18, 0.98) 100%), url('/train_bg.jpg')` }}
      >
        {/* Animated Headline */}
        <div className="max-w-4xl text-center space-y-6 mb-12">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 bg-railway-navy/40 border border-railway-accent/30 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider text-railway-accent text-transform uppercase"
          >
            <span>🚆 Indian Railways AI Passenger Platform</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-none"
          >
            Next Generation Booking with <br className="hidden md:inline" />
            <span className="bg-gradient-to-r from-railway-accent via-railway-gold to-white bg-clip-text text-transparent">
              RailVerse AI
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-lg text-gray-300 max-w-2xl mx-auto"
          >
            Predict waitlists, visual coach mapping, custom voice entries, carbon comparison, and real-time routes in one responsive window.
          </motion.p>
        </div>

        {/* 2. Glassmorphic Booking Widget */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-5xl w-full glass-card p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl"
        >
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            
            {/* Source */}
            <div className="relative flex flex-col space-y-2">
              <label className="text-xs text-gray-400 font-semibold flex items-center space-x-1.5">
                <MapPin size={14} className="text-railway-accent" />
                <span>From Station</span>
              </label>
              <input
                type="text"
                placeholder="Station name/code..."
                value={source}
                onChange={(e) => handleSrcChange(e.target.value)}
                className="w-full py-3 px-4 rounded-xl glass-input text-sm"
                required
              />
              {srcSuggestions.length > 0 && (
                <div className="absolute top-[100%] left-0 w-full bg-slate-900 border border-gray-800 rounded-xl mt-1.5 shadow-2xl z-20 overflow-hidden">
                  {srcSuggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => selectSource(s)}
                      className="w-full text-left py-2.5 px-4 text-xs hover:bg-railway-navy/40 transition-colors"
                    >
                      <p className="font-semibold text-white">{s.name}</p>
                      <p className="text-[10px] text-gray-400">{s.city}, {s.state} ({s.code})</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Destination */}
            <div className="relative flex flex-col space-y-2">
              <label className="text-xs text-gray-400 font-semibold flex items-center space-x-1.5">
                <MapPin size={14} className="text-railway-gold" />
                <span>To Station</span>
              </label>
              <input
                type="text"
                placeholder="Station name/code..."
                value={destination}
                onChange={(e) => handleDestChange(e.target.value)}
                className="w-full py-3 px-4 rounded-xl glass-input text-sm"
                required
              />
              {destSuggestions.length > 0 && (
                <div className="absolute top-[100%] left-0 w-full bg-slate-900 border border-gray-800 rounded-xl mt-1.5 shadow-2xl z-20 overflow-hidden">
                  {destSuggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => selectDest(s)}
                      className="w-full text-left py-2.5 px-4 text-xs hover:bg-railway-navy/40 transition-colors"
                    >
                      <p className="font-semibold text-white">{s.name}</p>
                      <p className="text-[10px] text-gray-400">{s.city}, {s.state} ({s.code})</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date */}
            <div className="flex flex-col space-y-2">
              <label className="text-xs text-gray-400 font-semibold flex items-center space-x-1.5">
                <Calendar size={14} className="text-railway-accent" />
                <span>Date of Journey</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full py-3 px-4 rounded-xl glass-input text-sm"
                required
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full py-3.5 glass-btn rounded-xl text-sm font-semibold flex items-center justify-center space-x-2"
            >
              <Search size={16} />
              <span>Search Trains</span>
            </button>

          </form>

          {/* Quick config settings */}
          <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-white/5 text-xs text-gray-400 justify-between items-center">
            <div className="flex space-x-6">
              <div className="flex items-center space-x-2">
                <span>Class:</span>
                <select 
                  value={classType} 
                  onChange={(e) => setClassType(e.target.value)}
                  className="bg-slate-900 border border-gray-800 rounded px-2.5 py-1 text-gray-300 focus:outline-none"
                >
                  <option value="CC">AC Chair Car (CC)</option>
                  <option value="EC">Exec. Chair Car (EC)</option>
                  <option value="1A">AC First Class (1A)</option>
                  <option value="2A">AC 2-Tier (2A)</option>
                  <option value="3A">AC 3-Tier (3A)</option>
                  <option value="SL">Sleeper Class (SL)</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <span>Quota:</span>
                <select 
                  value={quota} 
                  onChange={(e) => setQuota(e.target.value)}
                  className="bg-slate-900 border border-gray-800 rounded px-2.5 py-1 text-gray-300 focus:outline-none"
                >
                  <option value="General">General</option>
                  <option value="Tatkal">Tatkal</option>
                  <option value="Ladies">Ladies</option>
                  <option value="Senior Citizen">Senior Citizen</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-1.5 text-railway-accent">
              <Bot size={14} />
              <span>AI recommendations loaded based on seasonal bookings</span>
            </div>
          </div>

        </motion.div>
      </div>

      {/* 3. Animated Train graphics moving across screen */}
      <div className="relative w-full h-12 bg-slate-950/80 border-y border-gray-900 overflow-hidden flex items-center">
        {/* Track Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_2px,transparent_2px)] bg-[size:10px_100%]"></div>
        <div className="absolute w-full h-[2px] bg-gray-800 bottom-2.5"></div>
        <div className="absolute w-full h-[2px] bg-gray-800 bottom-3.5"></div>

        {/* Animated Vande Bharat train */}
        <div className="absolute animate-train flex items-center space-x-0.5">
          <div className="w-16 h-4 bg-gradient-to-r from-blue-700 to-white rounded-r-full flex items-center justify-end pr-2 border-r border-blue-400 shadow-lg shadow-blue-500/20">
            <span className="w-2.5 h-1 bg-yellow-400 rounded-sm"></span>
          </div>
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="w-12 h-4 bg-gradient-to-r from-white via-blue-900 to-white border-x border-gray-500 flex justify-around items-center">
              <div className="w-2 h-1.5 bg-gray-800 rounded-sm"></div>
              <div className="w-2 h-1.5 bg-gray-800 rounded-sm"></div>
            </div>
          ))}
          <div className="w-10 h-3.5 bg-blue-900 rounded-l-md"></div>
        </div>
      </div>

      {/* 4. Live Statistics Section */}
      <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-card p-6 rounded-2xl border border-gray-850 flex items-center space-x-5">
          <div className="p-4 rounded-xl bg-railway-accent/20 text-railway-accent">
            <Users size={28} />
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-white">50,000+</h3>
            <p className="text-sm text-gray-400">Daily tickets booked securely</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-gray-850 flex items-center space-x-5">
          <div className="p-4 rounded-xl bg-railway-gold/20 text-railway-gold">
            <Award size={28} />
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-white">96.8%</h3>
            <p className="text-sm text-gray-400">AI confirmation accuracy</p>
          </div>
        </div>
        <div className="glass-card p-6 rounded-2xl border border-gray-850 flex items-center space-x-5">
          <div className="p-4 rounded-xl bg-emerald-500/20 text-emerald-400">
            <BadgeCheck size={28} />
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-white">Instant</h3>
            <p className="text-sm text-gray-400">Refund checks to RailVerse Wallet</p>
          </div>
        </div>
      </div>

      {/* 5. Popular Routes Section */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Trending Indian Routes</h2>
        <p className="text-sm text-gray-400 mb-8">Jump into direct searches for India\'s busiest hubs</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { from: 'Mumbai (MMCT)', to: 'New Delhi (NDLS)', img: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&q=80&w=400', speed: 'Rajdhani - 15h' },
            { from: 'Bengaluru (SBC)', to: 'Chennai (MAS)', img: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&q=80&w=400', speed: 'Vande Bharat - 4h 30m' },
            { from: 'Delhi (NDLS)', to: 'Varanasi (BSB)', img: 'https://images.unsplash.com/photo-1561361513-2d000a50f0db?auto=format&fit=crop&q=80&w=400', speed: 'Vande Bharat - 8h' }
          ].map((route, i) => (
            <div 
              key={i} 
              onClick={() => navigate(`/search?source=${encodeURIComponent(route.from)}&destination=${encodeURIComponent(route.to)}`)}
              className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer border border-gray-850 shadow-md flex items-end p-5"
            >
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url('${route.img}')` }}></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
              
              <div className="relative z-10 w-full flex justify-between items-end">
                <div>
                  <p className="text-xs font-semibold text-railway-accent uppercase">{route.speed}</p>
                  <h4 className="text-sm font-bold text-white mt-1">{route.from} ➔ {route.to}</h4>
                </div>
                <span className="text-[10px] bg-railway-gold text-railway-dark font-extrabold px-2 py-0.5 rounded-full">Popular</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. AI travel planner call to action */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="relative w-full p-8 md:p-12 bg-gradient-to-r from-railway-blue via-railway-navy to-slate-900 rounded-3xl border border-railway-accent/30 overflow-hidden flex flex-col md:flex-row items-center justify-between">
          <div className="space-y-4 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center space-x-1 bg-railway-gold/20 text-railway-gold text-xs font-bold px-3 py-1 rounded-full border border-railway-gold/30">
              <Bot size={12} />
              <span>Smart Travel Itineraries</span>
            </div>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-white">Let AI plan your next vacation!</h3>
            <p className="text-sm text-gray-300">Enter your beginning and final stations, select your theme, and get full Day-to-Day plans, sightseeing spots, and carbon savings reports instantly.</p>
          </div>
          <button
            onClick={() => navigate('/ai-planner')}
            className="mt-6 md:mt-0 px-8 py-3.5 bg-railway-gold text-railway-dark hover:bg-white rounded-xl text-sm font-bold shadow-lg shadow-railway-gold/25 transition-all transform hover:-translate-y-0.5 active:scale-95"
          >
            Launch AI Planner
          </button>
        </div>
      </div>

      {/* 7. Reviews Section */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-center">Loved by Indian Travelers</h2>
        <p className="text-sm text-gray-400 mb-12 text-center">Read feedback from our frequent commuters</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { name: 'Amit Sharma', role: 'Business Consultant', text: 'I booked the New Delhi Vande Bharat. The AI waitlist confirmation predictor was 98% accurate! Recommended to everyone.', rating: 5 },
            { name: 'Sunitha Rao', role: 'College Professor', text: 'Excellent seat recommendation feature. Assessed my age and automatically allocated a lower berth close to the doors.', rating: 5 },
            { name: 'Pankaj Deshmukh', role: 'Software Engineer', text: 'The interface is beautiful and extremely fast compared to other portals. Refund credited to wallet in under 10 seconds.', rating: 5 }
          ].map((rev, i) => (
            <div key={i} className="glass-card p-6 rounded-2xl border border-gray-850 flex flex-col justify-between">
              <div className="flex space-x-1 mb-4 text-railway-gold">
                {Array.from({ length: rev.rating }).map((_, r) => (
                  <Star key={r} size={14} className="fill-current" />
                ))}
              </div>
              <p className="text-xs text-gray-300 italic leading-relaxed mb-6">"{rev.text}"</p>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-railway-navy flex items-center justify-center font-bold text-xs text-railway-accent">
                  {rev.name[0]}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white">{rev.name}</h5>
                  <p className="text-[10px] text-gray-500">{rev.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
