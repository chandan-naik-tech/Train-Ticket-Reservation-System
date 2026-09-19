import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Train3DView from '../components/Train3DView';
import { Train, User, Plus, Trash2, Mic, Bot, Sparkles, Leaf, Share2, Wallet, CreditCard } from 'lucide-react';
import api from '../utils/api';

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshProfile, loading } = useContext(AuthContext);

  // Train details from query
  const trainId = searchParams.get('trainId') || '';
  const date = searchParams.get('date') || '';
  const classType = searchParams.get('classType') || '3A';
  const quota = searchParams.get('quota') || 'General';
  const singleFare = parseFloat(searchParams.get('fare')) || 950;

  // Local state
  const [train, setTrain] = useState(null);
  const [passengers, setPassengers] = useState([{ name: '', age: '', gender: 'Male', aadhaar: '', seatPreference: 'No Preference' }]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  
  // Custom features state
  const [familyMode, setFamilyMode] = useState(false);
  const [splitPayment, setSplitPayment] = useState(false);

  useEffect(() => {
    if (loading) return; // Wait for auth check to complete
    if (!user) {
      navigate('/login?redirect=booking');
      return;
    }
    fetchTrainDetails();
  }, [trainId, user, loading]);

  const fetchTrainDetails = async () => {
    try {
      const res = await api.get(`/trains/detail/${trainId}`);
      setTrain(res.data.train);
    } catch (err) {
      console.error(err);
    }
  };

  // Add / Remove passenger row
  const addPassenger = () => {
    setPassengers([...passengers, { name: '', age: '', gender: 'Male', aadhaar: '', seatPreference: 'No Preference' }]);
  };

  const removePassenger = (index) => {
    if (passengers.length === 1) return;
    const updated = [...passengers];
    updated.splice(index, 1);
    setPassengers(updated);
  };

  const handlePassengerChange = (index, field, val) => {
    const updated = [...passengers];
    updated[index][field] = val;
    setPassengers(updated);
  };

  // Load AI Seat Recommendations
  const loadAIRecommendations = async () => {
    try {
      const res = await api.post('/ai/recommend-seat', { passengers });
      setAiRecommendations(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger recommendation recalculation when passenger counts/ages change
  useEffect(() => {
    if (passengers.length > 0 && passengers[0].name !== '') {
      const delayDebounceFn = setTimeout(() => {
        loadAIRecommendations();
      }, 800);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [passengers]);

  // Web Speech API Voice Booking handler
  const startVoiceBooking = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice booking is not supported in this browser. Please use Chrome or Brave.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (e) => {
      console.error(e);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log('Voice Command Received:', transcript);
      
      // Parse speech patterns: e.g. "add passenger amit age 28 gender male aadhaar 123456789012"
      // Or "passenger sunita age 65 female"
      const nameMatch = transcript.match(/passenger\s+([a-zA-Z\s]+?)\s+age/);
      const ageMatch = transcript.match(/age\s+(\d+)/);
      const genderMatch = transcript.match(/(male|female)/i);
      const aadhaarMatch = transcript.match(/aadhaar\s+(\d{12})/);

      const parsedPassenger = {
        name: nameMatch ? nameMatch[1].trim().replace(/^\w/, (c) => c.toUpperCase()) : 'Voice User',
        age: ageMatch ? ageMatch[1] : '30',
        gender: genderMatch ? (genderMatch[0].toLowerCase() === 'female' ? 'Female' : 'Male') : 'Male',
        aadhaar: aadhaarMatch ? aadhaarMatch[1] : '123456789012',
        seatPreference: 'No Preference'
      };

      // Populate first blank row or append new row
      if (passengers[0].name === '') {
        setPassengers([parsedPassenger]);
      } else {
        setPassengers([...passengers, parsedPassenger]);
      }
    };

    recognition.start();
  };

  // Seat selection from 3D visualizer
  const handleSeatSelection = (coach, seatNumber, type) => {
    if (coach === 'clear') {
      setSelectedSeats([]);
      return;
    }

    const exists = selectedSeats.some(s => s.coach === coach && s.seatNumber === seatNumber);
    if (exists) {
      setSelectedSeats(selectedSeats.filter(s => !(s.coach === coach && s.seatNumber === seatNumber)));
    } else {
      if (selectedSeats.length >= passengers.length) {
        // Remove oldest selection and add new
        setSelectedSeats([...selectedSeats.slice(1), { coach, seatNumber, type }]);
      } else {
        setSelectedSeats([...selectedSeats, { coach, seatNumber, type }]);
      }
    }
  };

  // Family Autofill mode helper
  const toggleFamilyMode = () => {
    setFamilyMode(!familyMode);
    if (!familyMode) {
      setPassengers([
        { name: 'Rajesh Kumar', age: '45', gender: 'Male', aadhaar: '123456789012', seatPreference: 'Lower' },
        { name: 'Suman Kumar', age: '40', gender: 'Female', aadhaar: '987654321098', seatPreference: 'Window' },
        { name: 'Aarav Kumar', age: '10', gender: 'Male', aadhaar: '567812349012', seatPreference: 'Upper' }
      ]);
    } else {
      setPassengers([{ name: '', age: '', gender: 'Male', aadhaar: '', seatPreference: 'No Preference' }]);
    }
  };

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    
    // Validations
    for (let p of passengers) {
      if (!p.name || !p.age || !p.aadhaar || p.aadhaar.length !== 12) {
        alert('Please complete all passenger details with a valid 12-digit Aadhaar.');
        return;
      }
    }

    const totalFare = singleFare * passengers.length;
    
    // Store in temp local storage to pass to Payment page
    localStorage.setItem('temp_booking', JSON.stringify({
      trainId,
      sourceId: train.source_station_id,
      destId: train.destination_station_id,
      journeyDate: date,
      quota,
      classType,
      totalFare,
      passengers,
      selectedSeats
    }));

    navigate('/payment');
  };

  if (!train) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="w-8 h-8 border-4 border-railway-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalFare = singleFare * passengers.length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 min-h-screen grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* LEFT COLUMN: Passenger Forms & Interactive Modules */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* Train Details Summary banner */}
        <div className="glass-card p-6 rounded-3xl border border-gray-850 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-railway-navy/40 p-3 rounded-2xl text-railway-accent">
              <Train size={24} />
            </div>
            <div>
              <span className="text-[10px] text-railway-gold font-bold uppercase">{train.type}</span>
              <h3 className="font-extrabold text-base text-white">{train.number} - {train.name}</h3>
              <p className="text-xs text-gray-400">Class: {classType} | Quota: {quota} | Date: {date}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Departure</p>
            <p className="text-sm font-bold text-white">{train.departure_time.slice(0, 5)}</p>
          </div>
        </div>

        {/* Passenger details container */}
        <div className="glass-card p-6 rounded-3xl border border-gray-850 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <User size={18} className="text-railway-accent" />
              <span>Passenger Details</span>
            </h2>

            {/* Smart Add utilities */}
            <div className="flex space-x-3.5">
              {/* Voice Booking button */}
              <button
                onClick={startVoiceBooking}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isListening
                    ? 'bg-red-950/40 border-red-500 text-red-500 animate-pulse'
                    : 'bg-railway-navy/20 border-railway-accent/30 text-railway-accent hover:bg-railway-accent/15'
                }`}
              >
                <Mic size={14} />
                <span>{isListening ? 'Listening...' : 'Voice Book'}</span>
              </button>

              {/* Family Mode toggle */}
              <button
                onClick={toggleFamilyMode}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  familyMode
                    ? 'bg-railway-gold/10 border-railway-gold text-railway-gold'
                    : 'bg-slate-900 border-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <Sparkles size={12} />
                <span>Family Mode</span>
              </button>
            </div>
          </div>

          {/* Forms listing */}
          <div className="space-y-6">
            {passengers.map((p, idx) => (
              <div key={idx} className="p-5 bg-slate-950/30 border border-gray-850 rounded-2xl space-y-4 relative">
                
                {/* Delete row */}
                {passengers.length > 1 && (
                  <button
                    onClick={() => removePassenger(idx)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                {/* Index banner */}
                <p className="text-xs text-railway-accent font-extrabold">Passenger #{idx + 1}</p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Name */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] text-gray-400 font-semibold">Full Name</label>
                    <input
                      type="text"
                      placeholder="As in Aadhaar card..."
                      value={p.name}
                      onChange={(e) => handlePassengerChange(idx, 'name', e.target.value)}
                      className="py-2 px-3 rounded-lg glass-input text-xs"
                      required
                    />
                  </div>

                  {/* Age */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] text-gray-400 font-semibold">Age</label>
                    <input
                      type="number"
                      placeholder="e.g. 35"
                      value={p.age}
                      onChange={(e) => handlePassengerChange(idx, 'age', e.target.value)}
                      className="py-2 px-3 rounded-lg glass-input text-xs"
                      required
                    />
                  </div>

                  {/* Gender */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] text-gray-400 font-semibold">Gender</label>
                    <select
                      value={p.gender}
                      onChange={(e) => handlePassengerChange(idx, 'gender', e.target.value)}
                      className="py-2.5 px-3 rounded-lg glass-input text-xs focus:bg-slate-950"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Aadhaar */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] text-gray-400 font-semibold">Aadhaar (12-Digit)</label>
                    <input
                      type="text"
                      placeholder="123456789012"
                      value={p.aadhaar}
                      maxLength={12}
                      onChange={(e) => handlePassengerChange(idx, 'aadhaar', e.target.value)}
                      className="py-2 px-3 rounded-lg glass-input text-xs"
                      required
                    />
                  </div>
                </div>

                {/* Recommendations info text */}
                {aiRecommendations[idx] && (
                  <div className="flex items-center space-x-2 text-[10px] text-railway-gold bg-railway-gold/5 p-2 rounded-lg border border-railway-gold/15">
                    <Bot size={12} />
                    <span><b>Smart Berth:</b> {aiRecommendations[idx].recommendedBerth} - {aiRecommendations[idx].rationale}</span>
                  </div>
                )}

              </div>
            ))}
          </div>

          <button
            onClick={addPassenger}
            className="w-full py-2.5 bg-slate-900 border border-gray-800 hover:border-gray-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 text-gray-300"
          >
            <Plus size={14} />
            <span>Add Passenger</span>
          </button>

        </div>

        {/* 3D COACH LAYOUT VIEWER */}
        <div className="glass-card p-6 rounded-3xl border border-gray-850 space-y-4">
          <h3 className="text-sm font-bold text-white">Smart Coach & Seat Selector</h3>
          <Train3DView 
            selectedSeats={selectedSeats} 
            onSeatSelect={handleSeatSelection}
            classType={classType}
          />
        </div>

      </div>

      {/* RIGHT COLUMN: Fare details & Add-ons */}
      <div className="space-y-8">
        
        {/* Carbon Footprint Offset Widget */}
        <div className="glass-card p-6 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-railway-blue/40 to-emerald-950/20">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center space-x-2">
            <Leaf size={16} />
            <span>Green Travel Index</span>
          </h3>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            By choosing to travel on our semi-high speed railway instead of air travel or private cars, you are making a positive environmental impact:
          </p>

          <div className="grid grid-cols-3 gap-3 text-center mt-4">
            <div className="p-2 bg-slate-950/40 rounded-xl border border-gray-800">
              <span className="text-[10px] text-gray-500 uppercase">RailVerse</span>
              <p className="text-xs font-bold text-emerald-400 mt-1">12 kg CO₂</p>
            </div>
            <div className="p-2 bg-slate-950/40 rounded-xl border border-gray-800">
              <span className="text-[10px] text-gray-500 uppercase">Airlines</span>
              <p className="text-xs font-bold text-red-400 mt-1">140 kg CO₂</p>
            </div>
            <div className="p-2 bg-slate-950/40 rounded-xl border border-gray-800">
              <span className="text-[10px] text-gray-500 uppercase">Road Cars</span>
              <p className="text-xs font-bold text-yellow-500 mt-1">98 kg CO₂</p>
            </div>
          </div>
          <p className="text-[10px] text-emerald-400 text-center font-bold mt-4.5">🌱 Net Savings: {128 * passengers.length}kg carbon offset!</p>
        </div>

        {/* Pricing Card summary */}
        <div className="glass-card p-6 rounded-3xl border border-gray-850 space-y-6">
          <h3 className="text-sm font-bold text-white border-b border-gray-800 pb-3">Fare Summary</h3>

          <div className="space-y-3 text-xs text-gray-400">
            <div className="flex justify-between">
              <span>Base Fare ({passengers.length} passengers):</span>
              <span className="text-white">₹{(singleFare * passengers.length).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Catering Charges (IRS):</span>
              <span className="text-white">₹0.00 (Incl.)</span>
            </div>
            <div className="flex justify-between">
              <span>Dynamic Reservation Fees:</span>
              <span className="text-white">₹0.00</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white pt-3 border-t border-gray-800">
              <span>Total Fare:</span>
              <span className="text-railway-gold">₹{totalFare.toFixed(2)}</span>
            </div>
          </div>

          {/* Split payment logic */}
          <div className="border-t border-gray-800 pt-4 space-y-3">
            <label className="flex items-center space-x-2.5 text-xs text-gray-300 cursor-pointer">
              <input 
                type="checkbox"
                checked={splitPayment}
                onChange={() => setSplitPayment(!splitPayment)}
                className="w-4 h-4 rounded text-railway-accent bg-slate-900 border-gray-800"
              />
              <span>Split Payment among friends</span>
            </label>

            {splitPayment && (
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-gray-900 space-y-3">
                <p className="text-[10px] text-gray-400">Dividing total fare by {passengers.length} members:</p>
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-white">Individual Split:</span>
                  <span className="text-railway-accent">₹{(totalFare / passengers.length).toFixed(2)} / person</span>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Mock share link generated! Copied to clipboard.')}
                  className="w-full py-1.5 bg-railway-navy/30 border border-railway-accent/25 hover:border-railway-accent rounded-lg text-[10px] font-bold text-railway-accent flex items-center justify-center space-x-1.5"
                >
                  <Share2 size={12} />
                  <span>Share Split UPI links</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleCheckoutSubmit}
            className="w-full py-3.5 glass-btn rounded-xl text-sm font-bold flex items-center justify-center space-x-2"
          >
            <CreditCard size={16} />
            <span>Proceed to Payment</span>
          </button>
        </div>

      </div>

    </div>
  );
}
