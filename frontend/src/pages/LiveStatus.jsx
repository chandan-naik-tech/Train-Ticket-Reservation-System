import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, Navigation, Clock, AlertCircle } from 'lucide-react';
import api from '../utils/api';

export default function LiveStatus() {
  const [searchParams] = useSearchParams();
  const paramTrainNumber = searchParams.get('trainNumber') || '';

  const [trainNumber, setTrainNumber] = useState(paramTrainNumber);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [liveData, setLiveData] = useState(null);

  useEffect(() => {
    if (paramTrainNumber) {
      handleFetchLiveStatus(paramTrainNumber);
    }
  }, [paramTrainNumber]);

  const handleFetchLiveStatus = async (numberToFetch) => {
    if (!numberToFetch) return;
    setLoading(true);
    setError(null);
    setLiveData(null);

    try {
      const response = await api.get(`/trains/live/${numberToFetch}`);
      setLiveData(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Could not fetch live status. Please check the train number.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveStatus = async (e) => {
    e.preventDefault();
    handleFetchLiveStatus(trainNumber);
  };



  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[calc(100vh-80px)]">
      <div className="text-center space-y-4 mb-10">
        <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-railway-accent to-blue-500 uppercase tracking-tight">
          Where is my Train?
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto font-medium">
          Enter your 5-digit train number to get real-time GPS simulated location, running status, and platform details.
        </p>
      </div>

      <div className="glass-card p-6 md:p-8 rounded-3xl border border-gray-800 shadow-2xl shadow-blue-900/10 mb-8">
        <form onSubmit={fetchLiveStatus} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <TrainIcon className="h-6 w-6 text-railway-accent" />
            </div>
            <input
              type="text"
              value={trainNumber}
              onChange={(e) => setTrainNumber(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl glass-input text-lg font-bold placeholder:font-normal placeholder:text-gray-500 focus:ring-2 focus:ring-railway-accent/50"
              placeholder="Enter Train Name or Number (e.g. Rajdhani or 10010060)"
              maxLength={20}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !trainNumber}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-railway-accent hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
          >
            {loading ? (
              <span className="animate-pulse">Locating...</span>
            ) : (
              <>
                <Search size={20} />
                <span>Track Train</span>
              </>
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="glass-card bg-red-950/20 border-red-900/50 p-6 rounded-2xl flex items-start space-x-4 mb-8">
          <AlertCircle className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-red-400 font-bold mb-1">Train Not Found</h4>
            <p className="text-red-300/80 text-sm">{error}</p>
          </div>
        </div>
      )}

      {liveData && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Card */}
          <div className="glass-card p-6 md:p-8 rounded-3xl border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-railway-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            
            <div className="relative z-10">
              <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold uppercase rounded-lg mb-3">
                Live Status
              </div>
              <h2 className="text-3xl font-black text-white mb-1">
                {liveData.train.number} - {liveData.train.name}
              </h2>
              <div className="flex items-center space-x-2 text-gray-400 font-medium">
                <Navigation size={16} className="text-railway-accent" />
                <span>{liveData.liveStatus.statusMessage}</span>
              </div>
            </div>

            <div className="relative z-10 flex space-x-8">
              <div className="text-center">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Delay Prediction</p>
                <div className={`text-2xl font-black ${liveData.liveStatus.delay > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {liveData.liveStatus.delay > 0 ? `+${liveData.liveStatus.delay}m` : 'On Time'}
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Live Speed</p>
                <div className="text-2xl font-black text-white flex items-baseline justify-center space-x-1">
                  <span>{liveData.liveStatus.currentSpeed}</span>
                  <span className="text-xs text-gray-400 font-bold">km/h</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Analytics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-3xl border border-gray-800 bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
              <div className="absolute top-2 right-2 text-railway-accent opacity-20"><Clock size={48} /></div>
              <h4 className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">Next Stop ETA</h4>
              <p className="text-3xl font-black text-white">{liveData.liveStatus.nextStationEta || '--:--'}</p>
              <p className="text-xs text-emerald-400 mt-2 flex items-center"><Navigation size={12} className="mr-1" /> Dynamic AI Prediction</p>
            </div>
            
            <div className="glass-card p-6 rounded-3xl border border-gray-800 bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
              <div className="absolute top-2 right-2 text-blue-500 opacity-20"><MapPin size={48} /></div>
              <h4 className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">Current Weather</h4>
              <p className="text-xl font-bold text-white mt-1">{liveData.liveStatus.weatherCondition}</p>
              <p className="text-xs text-blue-400 mt-2">Live Route Conditions</p>
            </div>

            <div className="glass-card p-6 rounded-3xl border border-gray-800 bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
              <div className="absolute top-2 right-2 text-yellow-500 opacity-20"><AlertCircle size={48} /></div>
              <h4 className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">AI Status Analysis</h4>
              <p className="text-sm font-semibold text-white mt-1">
                {liveData.liveStatus.aiDelayPredict < 0 ? 
                  `Train is running optimally. Expected to recover ${Math.abs(liveData.liveStatus.aiDelayPredict)} mins of time.` : 
                  liveData.liveStatus.aiDelayPredict > 0 ? 
                  `Heavy traffic ahead. AI predicts additional +${liveData.liveStatus.aiDelayPredict}m delay.` :
                  `Train is maintaining scheduled speed profile.`}
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="glass-card p-6 md:p-10 rounded-3xl border border-gray-800">
            <h3 className="text-lg font-bold text-white uppercase mb-8 flex items-center space-x-2 border-b border-gray-800 pb-4">
              <MapPin size={20} className="text-railway-accent" />
              <span>Route Journey</span>
            </h3>

            <div className="relative border-l-2 border-gray-800 ml-4 md:ml-8 space-y-8 pb-4">
              {liveData.routes.map((stop, index) => {
                const isPast = index <= liveData.liveStatus.currentStationIndex;
                const isCurrent = index === liveData.liveStatus.currentStationIndex || 
                                  (index === 0 && liveData.liveStatus.currentStationIndex === -1 && stop.departure_time);

                return (
                  <div key={index} className="relative pl-8 md:pl-12 transition-all duration-300 hover:-translate-y-1">
                    {/* Node */}
                    <div 
                      className={`absolute -left-[11px] top-1.5 w-5 h-5 rounded-full border-4 flex items-center justify-center transition-colors duration-500
                        ${isCurrent ? 'border-blue-500 bg-white animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                        : isPast ? 'border-railway-accent bg-railway-accent' 
                        : 'border-gray-700 bg-gray-900'}`}
                    >
                      {isPast && !isCurrent && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                    </div>

                    <div className={`p-4 rounded-2xl border ${isCurrent ? 'bg-blue-900/20 border-blue-500/30' : 'bg-slate-900/40 border-gray-800/50'}`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className={`text-base md:text-lg font-bold break-words ${isCurrent ? 'text-blue-400' : isPast ? 'text-white' : 'text-gray-400'}`}>
                            {stop.name} <span className="text-sm font-mono opacity-60 ml-1 inline-block">{stop.code}</span>
                          </h4>
                          <p className="text-xs text-gray-500 uppercase font-bold mt-1 tracking-wider">
                            Distance: <span className="text-gray-400">{stop.distance} km</span>
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm font-bold">
                          <div className="text-center">
                            <p className="text-[10px] text-gray-600 uppercase mb-0.5">Arrival</p>
                            <p className={isPast ? 'text-gray-300' : 'text-gray-500'}>
                              {stop.arrival_time || '--:--'}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-gray-600 uppercase mb-0.5">Departure</p>
                            <p className={isPast ? 'text-gray-300' : 'text-gray-500'}>
                              {stop.departure_time || '--:--'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TrainIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="16" height="16" x="4" y="3" rx="2" />
      <path d="M4 11h16" />
      <path d="M12 3v8" />
      <path d="m8 19-2 3" />
      <path d="m18 22-2-3" />
      <path d="M8 15h0" />
      <path d="M16 15h0" />
    </svg>
  );
}
