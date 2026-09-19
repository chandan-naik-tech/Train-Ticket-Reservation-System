import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Train, Clock, ArrowRight, UserCheck, AlertTriangle, Users, TrendingUp, X, CheckCircle, FileText, Navigation, Edit2, Trash2 } from 'lucide-react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

// Chart.js imports
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Search parameters
  const paramSource = searchParams.get('source') || '';
  const paramDest = searchParams.get('destination') || '';
  const paramDate = searchParams.get('date') || '';
  const paramClass = searchParams.get('classType') || '3A';
  const paramQuota = searchParams.get('quota') || 'General';
  const paramTime = searchParams.get('time') || 'All';
  const paramPnr = searchParams.get('pnr') || '';

  // Local state
  const [source, setSource] = useState(paramSource);
  const [destination, setDestination] = useState(paramDest);
  const [date, setDate] = useState(paramDate);
  const [classType, setClassType] = useState(paramClass);
  const [quota, setQuota] = useState(paramQuota);
  const [timeFilter, setTimeFilter] = useState(paramTime);

  const [loading, setLoading] = useState(false);
  const [trains, setTrains] = useState([]);
  const [isAlternative, setIsAlternative] = useState(false);
  const [pnrResult, setPnrResult] = useState(null);

  // Autocomplete states
  const [stations, setStations] = useState([]);
  const [srcSuggestions, setSrcSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);

  // Train Search by Number/Name States
  const [trainQuery, setTrainQuery] = useState('');
  const [trainQueryResults, setTrainQueryResults] = useState([]);
  const [searchingTrain, setSearchingTrain] = useState(false);

  // AI Modal States
  const [activeAIModal, setActiveAIModal] = useState(null); // { type: 'waitlist'|'crowd'|'fare', train }
  const [aiData, setAiData] = useState(null);

  // Load results on mount or param update
  useEffect(() => {
    if (paramPnr) {
      fetchPNR();
    } else if (paramSource && paramDest) {
      fetchTrains();
    }
  }, [searchParams]);

  useEffect(() => {
    const loadStations = async () => {
      try {
        const res = await api.get('/trains/stations');
        setStations(res.data);
      } catch (err) {
        console.error('Error fetching stations', err);
      }
    };
    loadStations();
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

  const fetchTrains = async () => {
    setLoading(true);
    setPnrResult(null);
    try {
      const res = await api.get('/trains/search', {
        params: { source: paramSource, destination: paramDest, date: paramDate, classType: paramClass, quota: paramQuota }
      });
      setTrains(res.data.trains || []);
      setIsAlternative(res.data.isAlternative || false);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 404) {
        setTrains([]); // Just show no trains found
      } else {
        alert('Error fetching train results. Please check your spelling and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchPNR = async () => {
    setLoading(true);
    setTrains([]);
    try {
      const res = await api.get(`/bookings/pnr/${paramPnr}`);
      setPnrResult(res.data);
    } catch (err) {
      console.error(err);
      alert('PNR not found or invalid.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrain = async (id) => {
    if (window.confirm('Are you sure you want to completely remove this train from the database?')) {
      try {
        await api.delete(`/admin/trains/${id}`);
        fetchTrains(); // Refresh the list
      } catch (err) {
        console.error(err);
        alert('Failed to delete train. Make sure you have admin permissions.');
      }
    }
  };

  const handleRefineSearch = (e) => {
    e.preventDefault();
    setSearchParams({ source, destination, date, classType, quota, time: timeFilter });
  };

  const handleSearchByTrain = async (e) => {
    e.preventDefault();
    if (!trainQuery) return;
    setSearchingTrain(true);
    try {
      const res = await api.get(`/trains/searchByTrain?query=${trainQuery}`);
      setTrainQueryResults(res.data.trains || []);
      // clear other results
      setTrains([]);
      setPnrResult(null);
    } catch (err) {
      console.error(err);
      alert('Error finding train.');
    } finally {
      setSearchingTrain(false);
    }
  };

  // Launch AI Waitlist Predictor
  const handleAIWaitlist = async (train) => {
    setActiveAIModal({ type: 'waitlist', train });
    setAiData(null);
    try {
      const res = await api.post('/ai/waitlist', {
        trainNumber: train.number,
        date: paramDate || new Date().toISOString().split('T')[0],
        wlCount: train.waitingList || 5
      });
      setAiData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Launch AI Crowd Predictor
  const handleAICrowd = async (train) => {
    setActiveAIModal({ type: 'crowd', train });
    setAiData(null);
    try {
      const res = await api.post('/ai/crowd', {
        trainNumber: train.number,
        date: paramDate || new Date().toISOString().split('T')[0]
      });
      setAiData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Launch AI Fare Predictor
  const handleAIFare = async (train) => {
    setActiveAIModal({ type: 'fare', train });
    setAiData(null);
    try {
      const res = await api.post('/ai/fare', {
        trainNumber: train.number,
        baseFare: train.fare
      });
      setAiData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Setup data for Chart.js
  const getChartData = () => {
    if (!aiData || !aiData.trend) return {};
    return {
      labels: aiData.trend.map(t => t.day),
      datasets: [
        {
          label: 'Fare Estimate (₹)',
          data: aiData.trend.map(t => t.fare),
          borderColor: '#008dd5',
          backgroundColor: 'rgba(0, 141, 213, 0.2)',
          borderWidth: 2,
          pointBackgroundColor: '#f1c40f',
          tension: 0.3
        }
      ]
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 min-h-screen">
      
      {!pnrResult && (
        <>
          {/* Search refinement bar */}
        {/* Search By Train Name / Number */}
        <div className="glass-card mb-6 p-4 rounded-3xl border border-gray-800 shadow-xl max-w-3xl mx-auto flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full relative">
            <Train className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Train Name or Number (e.g. 10010060, Rajdhani)"
              value={trainQuery}
              onChange={(e) => setTrainQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl glass-input focus:ring-2 focus:ring-railway-accent"
              onKeyDown={(e) => e.key === 'Enter' && handleSearchByTrain(e)}
            />
          </div>
          <button 
            onClick={handleSearchByTrain}
            disabled={searchingTrain || !trainQuery}
            className="w-full md:w-auto px-6 py-3 bg-railway-accent hover:bg-railway-accent/90 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center disabled:opacity-50"
          >
            {searchingTrain ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Search size={18} className="mr-2" />}
            Find Train
          </button>
        </div>

        {/* Route Search Form Container */}
        <form onSubmit={handleRefineSearch} className="glass-card p-4 rounded-2xl border border-gray-800 flex flex-wrap gap-4 items-end shadow-2xl relative z-10">
          <div className="relative flex-1 min-w-[200px]">
            <label className="text-[10px] text-gray-400 font-semibold mb-1 block">Source Station</label>
            <input
              type="text"
              value={source}
              onChange={(e) => handleSrcChange(e.target.value)}
              className="w-full py-2 px-3 rounded-lg glass-input text-xs"
              required
            />
            {srcSuggestions.length > 0 && (
              <div className="absolute top-[100%] left-0 w-full bg-slate-900 border border-gray-800 rounded-xl mt-1.5 shadow-2xl z-20 overflow-hidden">
                {srcSuggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectSource(s)}
                    className="w-full text-left py-2 px-3.5 text-xs hover:bg-railway-navy/40 transition-colors"
                  >
                    <p className="font-semibold text-white">{s.name}</p>
                    <p className="text-[10px] text-gray-400">{s.city}, {s.state} ({s.code})</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <label className="text-[10px] text-gray-400 font-semibold mb-1 block">Destination Station</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => handleDestChange(e.target.value)}
              className="w-full py-2 px-3 rounded-lg glass-input text-xs"
              required
            />
            {destSuggestions.length > 0 && (
              <div className="absolute top-[100%] left-0 w-full bg-slate-900 border border-gray-800 rounded-xl mt-1.5 shadow-2xl z-20 overflow-hidden">
                {destSuggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectDest(s)}
                    className="w-full text-left py-2 px-3.5 text-xs hover:bg-railway-navy/40 transition-colors"
                  >
                    <p className="font-semibold text-white">{s.name}</p>
                    <p className="text-[10px] text-gray-400">{s.city}, {s.state} ({s.code})</p>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="w-[150px]">
            <label className="text-[10px] text-gray-400 font-semibold mb-1 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full py-2 px-3 rounded-lg glass-input text-xs"
              required
            />
          </div>
          <div className="w-[120px]">
            <label className="text-[10px] text-gray-400 font-semibold mb-1 block">Class</label>
            <select
              value={classType}
              onChange={(e) => setClassType(e.target.value)}
              className="w-full py-2 px-2.5 rounded-lg glass-input text-xs focus:bg-slate-900"
            >
              <option value="CC">CC</option>
              <option value="EC">EC</option>
              <option value="1A">1A</option>
              <option value="2A">2A</option>
              <option value="3A">3A</option>
              <option value="SL">SL</option>
            </select>
          </div>
          <div className="w-[120px]">
            <label className="text-[10px] text-gray-400 font-semibold mb-1 block">Dep. Time</label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full py-2 px-2.5 rounded-lg glass-input text-xs focus:bg-slate-900"
            >
              <option value="All">Any Time</option>
              <option value="Morning">Morning (06-12)</option>
              <option value="Afternoon">Afternoon (12-17)</option>
              <option value="Evening">Evening (17-21)</option>
              <option value="Night">Night (21-06)</option>
            </select>
          </div>
          <button type="submit" className="py-2.2 px-6 glass-btn rounded-lg text-xs font-bold flex items-center space-x-1.5">
            <Search size={14} />
            <span>Update</span>
          </button>
        </form>
        </>
      )}

      {/* PNR DETAILS VIEW */}
      {pnrResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-3xl mx-auto glass-card border border-railway-accent/30 rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-railway-blue to-railway-navy p-6 flex justify-between items-center border-b border-gray-850">
            <div>
              <span className="text-xs bg-railway-gold text-railway-dark font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                {pnrResult.status}
              </span>
              <h2 className="text-xl font-extrabold text-white mt-2">PNR: {pnrResult.pnr}</h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Date of Booking</p>
              <p className="text-sm font-semibold text-white">{new Date(pnrResult.booking_date).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Train details */}
            <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-gray-800">
              <div>
                <span className="text-[10px] text-railway-accent font-semibold">{pnrResult.train_type}</span>
                <h3 className="font-extrabold text-sm">{pnrResult.train_number} - {pnrResult.train_name}</h3>
              </div>
              <div className="flex items-center space-x-6 text-xs">
                <div className="text-right">
                  <p className="font-bold text-white">{pnrResult.source_code}</p>
                  <p className="text-[10px] text-gray-400">{pnrResult.source_city}</p>
                </div>
                <ArrowRight size={14} className="text-gray-500" />
                <div>
                  <p className="font-bold text-white">{pnrResult.dest_code}</p>
                  <p className="text-[10px] text-gray-400">{pnrResult.dest_city}</p>
                </div>
              </div>
            </div>

            {/* Passengers Grid */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Passenger Allotment</h4>
              <div className="space-y-3">
                {pnrResult.passengers.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3.5 bg-slate-950/40 border border-gray-850 rounded-xl">
                    <div>
                      <p className="text-xs font-bold text-white">{p.name} ({p.age}, {p.gender})</p>
                      <p className="text-[10px] text-gray-500">Aadhaar: **** **** {p.aadhaar.slice(-4)}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mr-2 ${
                        p.status === 'CNF' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {p.status}
                      </span>
                      <span className="text-xs font-mono font-bold text-railway-gold">Coach {p.coach_number} / Seat {p.seat_number} ({p.seat_type})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Receipt & QR layout */}
            <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-gray-850 gap-6">
              <div className="space-y-1 text-xs">
                <p className="text-gray-400">Total Transaction Fare:</p>
                <p className="text-lg font-black text-white">₹{parseFloat(pnrResult.total_fare).toFixed(2)}</p>
                <p className="text-[10px] text-emerald-400 flex items-center">
                  <CheckCircle size={10} className="mr-1" />
                  <span>Wallet Transaction Success</span>
                </p>
              </div>

              {/* QR Code */}
              <div className="flex items-center space-x-4 bg-white p-3.5 rounded-2xl shadow-inner shadow-gray-200">
                <svg className="w-24 h-24 text-slate-900" viewBox="0 0 100 100">
                  {/* Simplistic mock QR code layout */}
                  <rect width="25" height="25" fill="currentColor" />
                  <rect x="75" width="25" height="25" fill="currentColor" />
                  <rect y="75" width="25" height="25" fill="currentColor" />
                  <rect x="35" y="35" width="30" height="30" fill="currentColor" />
                  <rect x="15" y="45" width="10" height="15" fill="currentColor" />
                  <rect x="45" y="15" width="15" height="10" fill="currentColor" />
                  <rect x="75" y="45" width="20" height="10" fill="currentColor" />
                  <rect x="75" y="75" width="15" height="15" fill="currentColor" />
                </svg>
                <div className="text-slate-950 max-w-[120px]">
                  <p className="text-[9px] font-black tracking-wider uppercase">RailVerse Ticket Verification</p>
                  <p className="text-[8px] text-slate-500 mt-1">Scan at railway gate terminals for boarding access.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TRAIN SEARCH RESULTS LIST */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="w-10 h-10 border-4 border-railway-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-400">Locating high-speed trains running on schedule...</p>
        </div>
      )}

      {isAlternative && trains.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-950/20 border border-yellow-800/40 rounded-2xl flex items-center space-x-3 text-xs text-yellow-400">
          <AlertTriangle size={18} />
          <span>No direct trains found on searched route. Showing recommended alternative routes below:</span>
        </div>
      )}

      {!loading && !pnrResult && trains.length === 0 && trainQueryResults.length === 0 && (
        <div className="text-center py-20 bg-slate-950/20 border border-gray-850 rounded-2xl">
          <Train size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-bold">No Trains Found</h3>
          <p className="text-xs text-gray-400 mt-1">Refine your dates or search and check again.</p>
        </div>
      )}

      {/* TRAIN QUERY RESULTS */}
      {trainQueryResults.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white mb-4">Direct Train Search Results</h3>
          {trainQueryResults.map(train => (
             <motion.div
               key={train.id}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="glass-card p-6 rounded-3xl border border-gray-850 shadow-xl"
             >
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-4 mb-4">
                 <div>
                   <h3 className="text-2xl font-black text-white">{train.number} - {train.name}</h3>
                   <p className="text-sm text-railway-accent mt-1">Runs On: {train.runs_on}</p>
                 </div>
                 <div className="flex space-x-3">
                   <button 
                     onClick={() => navigate(`/live?trainNumber=${train.number}`)}
                     className="px-4 py-2 border border-railway-accent text-railway-accent rounded-xl hover:bg-railway-accent/10 transition flex items-center font-bold text-sm"
                   >
                     <Navigation size={16} className="mr-2" /> Live Tracker
                   </button>
                    <button 
                      onClick={() => navigate(`/booking?trainId=${train.id}&date=${new Date(new Date().setDate(new Date().getDate()+1)).toISOString().split('T')[0]}&classType=3A&quota=General&fare=950`)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition flex items-center font-bold text-sm"
                    >
                      Book Ticket
                    </button>
                 </div>
               </div>
               
               <div className="flex items-center justify-between">
                 <div className="text-center md:text-left flex-1 min-w-0 pr-2">
                   <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Source</p>
                   <p className="text-xl font-bold text-white truncate">{train.source_code}</p>
                   <p className="text-sm text-gray-400 break-words line-clamp-2">{train.source_name}</p>
                   <p className="text-lg font-mono text-gray-300 mt-1">{train.departure_time}</p>
                 </div>
                 
                 <div className="w-24 md:flex-1 flex flex-col items-center justify-center px-2">
                   <span className="text-[10px] bg-slate-800 text-gray-300 px-3 py-1 rounded-full border border-gray-700 mb-2 font-bold tracking-wider">{train.duration}</span>
                   <div className="w-full flex items-center">
                     <div className="w-2 h-2 rounded-full bg-railway-accent"></div>
                     <div className="flex-1 border-b border-dashed border-gray-600 mx-1"></div>
                     <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                   </div>
                 </div>

                 <div className="text-center md:text-right flex-1 min-w-0 pl-2">
                   <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Destination</p>
                   <p className="text-xl font-bold text-white truncate">{train.dest_code}</p>
                   <p className="text-sm text-gray-400 break-words line-clamp-2">{train.dest_name}</p>
                   <p className="text-lg font-mono text-gray-300 mt-1">{train.arrival_time}</p>
                 </div>
               </div>
             </motion.div>
          ))}
        </div>
      )}

      {!loading && !pnrResult && trains.length > 0 && (
        <div className="space-y-6">
          {trains.filter(train => {
            if (timeFilter === 'All') return true;
            const hour = parseInt(train.departure_time.split(':')[0]);
            if (timeFilter === 'Morning') return hour >= 6 && hour < 12;
            if (timeFilter === 'Afternoon') return hour >= 12 && hour < 17;
            if (timeFilter === 'Evening') return hour >= 17 && hour < 21;
            if (timeFilter === 'Night') return hour >= 21 || hour < 6;
            return true;
          }).map((train) => (
            <motion.div
              key={train.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 rounded-3xl border border-gray-850 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl relative overflow-hidden group"
            >
              {/* Left Column: Train Info */}
              <div className="space-y-2 flex-1 relative">
                
                {/* Admin Quick Actions */}
                {user?.role === 'admin' && (
                  <div className="absolute -top-4 -left-4 flex space-x-1">
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigate('/admin'); }}
                      title="Edit Train (via Admin Portal)"
                      className="p-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 rounded border border-blue-500/30 transition shadow-lg"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteTrain(train.id); }}
                      title="Remove Train"
                      className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded border border-red-500/30 transition shadow-lg"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold text-railway-gold bg-railway-gold/10 border border-railway-gold/20 px-2 py-0.5 rounded uppercase mt-2">
                    {train.type}
                  </span>
                  <span className="text-xs text-gray-500 font-mono mt-2">#{train.number}</span>
                </div>
                <h3 className="text-lg font-extrabold text-white group-hover:text-railway-accent transition-colors">
                  {train.name}
                </h3>
                
                {/* Station timings */}
                <div className="flex items-center space-x-5 text-xs text-gray-300 pt-1">
                  <div>
                    <p className="font-extrabold text-white">{train.departure_time.slice(0, 5)}</p>
                    <p className="text-[10px] text-gray-500">{train.source_name}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] text-gray-500 bg-gray-900 border border-gray-850 px-2 py-0.5 rounded-full">{train.duration}</span>
                    <div className="w-16 h-[1px] bg-gray-800 relative my-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-railway-accent absolute left-0 -top-0.5"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-railway-gold absolute right-0 -top-0.5"></div>
                    </div>
                  </div>
                  <div>
                    <p className="font-extrabold text-white">{train.arrival_time.slice(0, 5)}</p>
                    <p className="text-[10px] text-gray-500">{train.dest_name}</p>
                  </div>
                </div>
              </div>

              {/* Middle Column: Seats & Fares */}
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-slate-950/40 border border-gray-850 rounded-2xl text-center min-w-[120px]">
                  <p className="text-[9px] font-bold text-gray-400 uppercase">{train.selectedClass}</p>
                  
                  {train.availableSeats > 0 ? (
                    <p className="text-sm font-black text-emerald-400 mt-1">AVBL {train.availableSeats}</p>
                  ) : (
                    <p className="text-sm font-black text-yellow-500 mt-1">WL {train.waitingList}</p>
                  )}
                  
                  <p className="text-xs font-extrabold text-white mt-1.5">₹{train.fare}</p>
                </div>
              </div>

              {/* Right Column: AI Utilities & Book Button */}
              <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto">
                <div className="flex gap-2">
                  {train.waitingList > 0 && (
                    <button
                      onClick={() => handleAIWaitlist(train)}
                      className="flex-1 sm:flex-none px-3.5 py-2 bg-railway-navy/30 border border-railway-accent/30 hover:border-railway-accent rounded-xl text-[10px] font-bold text-railway-accent flex items-center justify-center space-x-1"
                    >
                      <UserCheck size={12} />
                      <span>AI Waitlist %</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleAICrowd(train)}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-900 border border-gray-800 hover:border-white rounded-xl text-[10px] font-bold text-gray-300 flex items-center justify-center space-x-1"
                  >
                    <Users size={12} />
                    <span>AI Crowd</span>
                  </button>
                  <button
                    onClick={() => handleAIFare(train)}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-900 border border-gray-800 hover:border-white rounded-xl text-[10px] font-bold text-gray-300 flex items-center justify-center space-x-1"
                  >
                    <TrendingUp size={12} />
                    <span>AI Fare Forecast</span>
                  </button>
                </div>

                <button
                  onClick={() => navigate(`/booking?trainId=${train.id}&date=${paramDate}&classType=${train.selectedClass}&quota=${train.selectedQuota}&fare=${train.fare}&coach=${train.coach}`)}
                  className="w-full py-2.5 glass-btn rounded-xl text-xs font-bold"
                >
                  Book Ticket
                </button>
              </div>

            </motion.div>
          ))}
        </div>
      )}

      {/* AI MODALS OVERLAYS */}
      <AnimatePresence>
        {activeAIModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="max-w-md w-full glass-card border border-gray-800 rounded-3xl p-6 relative overflow-hidden"
            >
              <button 
                onClick={() => setActiveAIModal(null)} 
                className="absolute top-4 right-4 text-gray-500 hover:text-white p-1"
              >
                <X size={18} />
              </button>

              {/* Waitlist predictability */}
              {activeAIModal.type === 'waitlist' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-railway-accent">
                    <UserCheck size={20} />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider">AI Waitlist Predictor</h3>
                  </div>
                  
                  <p className="text-xs text-gray-400">
                    Predicting probability of ticket confirmation for <b>{activeAIModal.train.name}</b>.
                  </p>

                  {aiData ? (
                    <div className="space-y-5 pt-3">
                      {/* Percent Circle */}
                      <div className="flex flex-col items-center">
                        <div className="relative w-28 h-28 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="56" cy="56" r="48" stroke="#1f2937" strokeWidth="6" fill="transparent" />
                            <circle 
                              cx="56" 
                              cy="56" 
                              r="48" 
                              stroke="#008dd5" 
                              strokeWidth="8" 
                              fill="transparent" 
                              strokeDasharray={2 * Math.PI * 48}
                              strokeDashoffset={2 * Math.PI * 48 * (1 - aiData.probability / 100)}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute text-center">
                            <p className="text-2xl font-black text-white">{aiData.probability}%</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase">Confirm Prob.</p>
                          </div>
                        </div>

                        <p className={`text-sm font-extrabold mt-3.5 ${aiData.color}`}>
                          Confirmation Chance: {aiData.status}
                        </p>
                      </div>

                      <div className="bg-slate-950/60 p-4 rounded-2xl border border-gray-900 space-y-2 text-xs">
                        <p className="font-semibold text-gray-300">Decision Rationale:</p>
                        <p className="text-[11px] text-gray-400 leading-relaxed">{aiData.message}</p>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Weighted Factors Considered:</p>
                        {aiData.factors.map((f, i) => (
                          <div key={i} className="text-[10px] text-gray-400 flex items-center space-x-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-railway-accent"></div>
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-xs text-gray-500">
                      <div className="w-6 h-6 border-2 border-railway-accent border-t-transparent rounded-full animate-spin mb-3"></div>
                      <span>Analyzing historical PNR cancel logs...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Crowd density predictor */}
              {activeAIModal.type === 'crowd' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-railway-accent">
                    <Users size={20} />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider">AI Crowd Forecaster</h3>
                  </div>

                  <p className="text-xs text-gray-400">
                    Predicting passenger boarding density and coach seat occupancy indices.
                  </p>

                  {aiData ? (
                    <div className="space-y-4 pt-3">
                      {/* Bar indicator */}
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1.5">
                          <span>Crowd Density Index</span>
                          <span>{aiData.crowdPercentage}%</span>
                        </div>
                        <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${aiData.color} rounded-full`}
                            style={{ width: `${aiData.crowdPercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-950/60 border border-gray-900 rounded-2xl">
                        <h4 className="text-xs font-extrabold text-white">Status: {aiData.status}</h4>
                        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{aiData.message}</p>
                      </div>

                      <p className="text-[10px] text-gray-500 italic">Calculated based on booking speed, holiday calendars, and coach category.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-xs text-gray-500">
                      <div className="w-6 h-6 border-2 border-railway-accent border-t-transparent rounded-full animate-spin mb-3"></div>
                      <span>Retrieving station boarding load ratios...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Fare charts predictor */}
              {activeAIModal.type === 'fare' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-railway-accent">
                    <TrendingUp size={20} />
                    <h3 className="font-extrabold text-sm uppercase tracking-wider">AI Fare Trend Analysis</h3>
                  </div>

                  <p className="text-xs text-gray-400">
                    Projected class base fares for the next 7 days.
                  </p>

                  {aiData ? (
                    <div className="space-y-4 pt-2">
                      <div className="h-[200px] w-full bg-slate-950/60 p-2.5 rounded-2xl border border-gray-900">
                        <Line 
                          data={getChartData()} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                              x: { grid: { color: 'rgba(255,255,255,0.04)' } },
                              y: { grid: { color: 'rgba(255,255,255,0.04)' } }
                            }
                          }} 
                        />
                      </div>
                      <div className="p-3 bg-railway-gold/10 border border-railway-gold/20 text-railway-gold text-[10px] rounded-xl leading-relaxed">
                        <b>Advice:</b> {aiData.advice}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-xs text-gray-500">
                      <div className="w-6 h-6 border-2 border-railway-accent border-t-transparent rounded-full animate-spin mb-3"></div>
                      <span>Simulating future booking speeds...</span>
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
