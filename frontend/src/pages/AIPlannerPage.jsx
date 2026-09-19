import React, { useState, useEffect } from 'react';
import { Bot, MapPin, Compass, ShieldCheck, Landmark, Utensils, Home, CalendarDays, Sparkles } from 'lucide-react';
import api from '../utils/api';

export default function AIPlannerPage() {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [preference, setPreference] = useState('History');
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);

  // Autocomplete states
  const [stations, setStations] = useState([]);
  const [srcSuggestions, setSrcSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);

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

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    if (!source || !destination) return;

    setLoading(true);
    setItinerary(null);

    try {
      const res = await api.post('/ai/plan', {
        source,
        destination,
        preferences: preference
      });
      setItinerary(res.data);
    } catch (err) {
      console.error(err);
      alert('Error constructing itinerary. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 min-h-screen">
      
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-3.5 mb-10">
        <div className="inline-flex items-center space-x-1.5 bg-railway-gold/10 border border-railway-gold/30 px-3.5 py-1.5 rounded-full text-[10px] font-bold text-railway-gold uppercase">
          <Bot size={14} className="animate-bounce" />
          <span>Interactive Tourism Engine</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white">AI Travel Planner</h1>
        <p className="text-xs text-gray-400">
          Enter your destinations, select your trip vibe, and let our ML model generate personalized itineraries, carbon comparisons, and local dining advice.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form panel Column */}
        <div className="glass-card p-6 rounded-3xl border border-gray-850 h-fit space-y-6">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <Compass className="text-railway-accent" size={18} />
            <span>Configure Trip</span>
          </h3>

          <form onSubmit={handlePlanSubmit} className="space-y-4">
            <div className="relative flex flex-col space-y-1.5">
              <label className="text-[10px] text-gray-400 font-semibold uppercase">Source Hub</label>
              <input
                type="text"
                placeholder="e.g. Bengaluru"
                value={source}
                onChange={(e) => handleSrcChange(e.target.value)}
                className="py-2.5 px-3.5 rounded-xl glass-input text-xs"
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

            <div className="relative flex flex-col space-y-1.5">
              <label className="text-[10px] text-gray-400 font-semibold uppercase">Destination City</label>
              <input
                type="text"
                placeholder="e.g. Goa"
                value={destination}
                onChange={(e) => handleDestChange(e.target.value)}
                className="py-2.5 px-3.5 rounded-xl glass-input text-xs"
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

            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] text-gray-400 font-semibold uppercase">Travel Vibe</label>
              <select
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
                className="py-2.5 px-3.5 rounded-xl glass-input text-xs focus:bg-slate-950"
              >
                <option value="History">Historical / Heritage</option>
                <option value="Pilgrim">Spiritual / Pilgrim</option>
                <option value="Nature">Eco-Tourism / Nature</option>
                <option value="Adventure">Thrills & Adventure</option>
                <option value="Foodie">Gastronomy / Foodie</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 glass-btn rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Drafting Itinerary...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Generate AI Itinerary</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Dynamic AI outputs Column */}
        <div className="lg:col-span-2 space-y-8">
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-10 h-10 border-4 border-railway-accent border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-400">Consulting geographical charts and local dining indexes...</p>
            </div>
          )}

          {!loading && !itinerary && (
            <div className="text-center py-24 border border-dashed border-gray-850 rounded-3xl bg-slate-950/10">
              <Bot size={48} className="mx-auto text-gray-700 mb-3.5" />
              <h4 className="text-sm font-bold text-white">No active plan generated</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">Fill in the configurations on the left sidebar to generate custom travel timelines.</p>
            </div>
          )}

          {itinerary && (
            <div className="space-y-8">
              
              {/* Destination brief */}
              <div className="glass-card p-6 rounded-3xl border border-gray-850 space-y-3">
                <h2 className="text-lg font-black text-white flex items-center space-x-2">
                  <MapPin className="text-railway-gold" size={20} />
                  <span>Welcome to {itinerary.destination}</span>
                </h2>
                <p className="text-xs text-gray-300 leading-relaxed">{itinerary.description}</p>
              </div>

              {/* Local Sightseeing & Food guides */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Spots */}
                <div className="p-5 bg-slate-950/40 border border-gray-850 rounded-2xl space-y-3.5">
                  <div className="flex items-center space-x-2 text-railway-accent">
                    <Landmark size={18} />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Top Spots</h4>
                  </div>
                  <ul className="space-y-1 text-xs text-gray-400">
                    {itinerary.spots.map((spot, i) => (
                      <li key={i} className="flex items-start space-x-1.5">
                        <span className="text-railway-gold">•</span>
                        <span>{spot}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Dine */}
                <div className="p-5 bg-slate-950/40 border border-gray-850 rounded-2xl space-y-3.5">
                  <div className="flex items-center space-x-2 text-railway-accent">
                    <Utensils size={18} />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Must Dine</h4>
                  </div>
                  <ul className="space-y-1 text-xs text-gray-400">
                    {itinerary.restaurants.map((rest, i) => (
                      <li key={i} className="flex items-start space-x-1.5">
                        <span className="text-railway-gold">•</span>
                        <span>{rest}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Lodging */}
                <div className="p-5 bg-slate-950/40 border border-gray-850 rounded-2xl space-y-3.5">
                  <div className="flex items-center space-x-2 text-railway-accent">
                    <Home size={18} />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Stay Tips</h4>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{itinerary.stay}</p>
                </div>

              </div>

              {/* Timeline Itinerary Section */}
              <div className="glass-card p-6 rounded-3xl border border-gray-850 space-y-6">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2 border-b border-gray-850 pb-3">
                  <CalendarDays className="text-railway-gold" size={18} />
                  <span>Suggested Day-to-Day Timeline</span>
                </h3>

                <div className="relative border-l border-gray-800 ml-3.5 space-y-6 pt-2">
                  {itinerary.suggestedItinerary.map((dayPlan) => (
                    <div key={dayPlan.day} className="relative pl-7">
                      {/* Timeline dot */}
                      <div className="absolute -left-2 top-1 w-4 h-4 rounded-full bg-slate-950 border-2 border-railway-accent flex items-center justify-center font-bold text-[9px] text-railway-accent">
                        {dayPlan.day}
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Day {dayPlan.day}: {dayPlan.title}</h4>
                        <p className="text-[11px] text-gray-400 leading-relaxed">{dayPlan.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
