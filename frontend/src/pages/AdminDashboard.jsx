import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { BarChart3, ShieldAlert, Train, BookOpen, Users, Plus, Edit2, Trash2, X, MapPin } from 'lucide-react';
import api from '../utils/api';

// Chart.js imports
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Title, Tooltip, Legend);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('analytics');
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [stations, setStations] = useState([]);
  const [trains, setTrains] = useState([]);
  
  const [loading, setLoading] = useState(true);

  // User Management State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editUserData, setEditUserData] = useState({ full_name: '', email: '', phone: '', aadhaar: '', wallet_balance: '' });

  // Train Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState('add'); // 'add' or 'edit'
  const [editId, setEditId] = useState(null);
  const [trainNumber, setTrainNumber] = useState('');
  const [trainName, setTrainName] = useState('');
  const [trainType, setTrainType] = useState('Express');
  const [sourceText, setSourceText] = useState('');
  const [destText, setDestText] = useState('');
  const [depTime, setDepTime] = useState('');
  const [arrTime, setArrTime] = useState('');
  const [duration, setDuration] = useState('');
  const [runsOn, setRunsOn] = useState('Mon,Tue,Wed,Thu,Fri,Sat,Sun');
  const [stops, setStops] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, trainsRes, usersRes, bookingsRes, stationsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/trains'),
        api.get('/admin/users'),
        api.get('/admin/bookings'),
        api.get('/trains/stations')
      ]);
      setStats(statsRes.data);
      setTrains(trainsRes.data);
      setUsersList(usersRes.data);
      setBookingsList(bookingsRes.data);
      setStations(stationsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Add Train handler
  const handleTrainSubmit = async (e) => {
    e.preventDefault();
    
    if (!sourceText.trim() || !destText.trim()) {
      alert('Source and destination stations cannot be empty.');
      return;
    }

    const payload = {
      number: trainNumber,
      name: trainName,
      type: trainType,
      sourceText: sourceText.trim(),
      destText: destText.trim(),
      departure_time: depTime,
      arrival_time: arrTime,
      duration: duration,
      runs_on: runsOn,
      stops: stops
    };

    try {
      if (formType === 'add') {
        await api.post('/admin/trains', payload);
        alert('Train and full route successfully mapped and activated!');
      } else {
        await api.put(`/admin/trains/${editId}`, payload);
        alert('Train and route successfully updated!');
      }
      setShowAddForm(false);
      resetForm();
      loadAdminData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error saving train details.');
    }
  };

  const addStop = () => {
    setStops([...stops, { station: '', arrival: '', departure: '', distance: '' }]);
  };
  
  const updateStop = (index, field, value) => {
    const newStops = [...stops];
    newStops[index][field] = value;
    setStops(newStops);
  };
  
  const removeStop = (index) => {
    setStops(stops.filter((_, i) => i !== index));
  };

  // Open Edit Form
  const openEditForm = async (train) => {
    setFormType('edit');
    setEditId(train.id);
    setTrainNumber(train.number);
    setTrainName(train.name);
    setTrainType(train.type);
    
    const s = stations.find(st => st.id === train.source_station_id);
    const d = stations.find(st => st.id === train.destination_station_id);
    setSourceText(s ? `${s.name} (${s.code})` : '');
    setDestText(d ? `${d.name} (${d.code})` : '');
    
    setDepTime(train.departure_time);
    setArrTime(train.arrival_time);
    setDuration(train.duration);
    setRunsOn(train.runs_on);
    setRunsOn(train.runs_on);
    
    // Fetch intermediate routes
    try {
      const res = await api.get(`/trains/${train.id}`);
      const trainDetails = res.data;
      if (trainDetails.routes && trainDetails.routes.length > 2) {
        // Intermediates are from index 1 to length-2
        const intermediates = trainDetails.routes.slice(1, -1).map(r => ({
          station: `${r.station_name} (${r.station_code})`,
          arrival: r.arrival_time ? r.arrival_time.substring(0, 5) : '',
          departure: r.departure_time ? r.departure_time.substring(0, 5) : '',
          distance: r.distance || ''
        }));
        setStops(intermediates);
      } else {
        setStops([]);
      }
    } catch (e) {
      console.error(e);
      setStops([]);
    }

    setShowAddForm(true);
  };

  const handleCreateReturnJourney = async (train) => {
    setFormType('add');
    
    // Auto-generate return train number (e.g., 10010060 -> 10010061)
    let newNumber = parseInt(train.number);
    if (!isNaN(newNumber)) {
      newNumber = (newNumber % 2 === 0) ? newNumber + 1 : newNumber - 1;
    } else {
      newNumber = train.number + '-R';
    }
    
    setTrainNumber(newNumber.toString());
    setTrainName(train.name.includes('Return') ? train.name : train.name + ' Return');
    setTrainType(train.type);
    
    // Swap Source and Destination
    const s = stations.find(st => st.id === train.source_station_id);
    const d = stations.find(st => st.id === train.destination_station_id);
    setSourceText(d ? `${d.name} (${d.code})` : '');
    setDestText(s ? `${s.name} (${s.code})` : '');
    
    // Swap timings logic is complex, we just set duration and let them adjust times
    setDepTime('');
    setArrTime('');
    setDuration(train.duration);
    setRunsOn(train.runs_on);
    
    // Fetch intermediate routes, and reverse them
    try {
      const res = await api.get(`/trains/${train.id}`);
      const trainDetails = res.data;
      if (trainDetails.routes && trainDetails.routes.length > 2) {
        const intermediates = trainDetails.routes.slice(1, -1).reverse().map(r => ({
          station: `${r.station_name} (${r.station_code})`,
          arrival: '', // Clear arrival/departure because they need to be entered backwards
          departure: '',
          distance: '' // distances change directionally
        }));
        setStops(intermediates);
      } else {
        setStops([]);
      }
    } catch (e) {
      console.error(e);
      setStops([]);
    }

    setShowAddForm(true);
  };

  // Delete Train
  const handleDeleteTrain = async (id) => {
    if (!window.confirm('Are you sure you want to delete this train? This action removes all mapped coaches, seats, routes, and bookings.')) {
      return;
    }
    try {
      await api.delete(`/admin/trains/${id}`);
      alert('Train deleted successfully from system.');
      loadAdminData();
    } catch (err) {
      console.error(err);
      alert('Error deleting train.');
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Cancel this booking and issue a refund to the passenger?')) return;
    try {
      await api.put(`/admin/bookings/${id}/cancel`);
      alert('Booking cancelled and refunded.');
      loadAdminData();
    } catch (e) { alert('Error cancelling booking'); }
  };

  const handleDeleteBooking = async (id) => {
    if (!window.confirm('Permanently delete this booking record?')) return;
    try {
      await api.delete(`/admin/bookings/${id}`);
      alert('Booking deleted.');
      loadAdminData();
    } catch (e) { alert('Error deleting booking'); }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user and all their records permanently?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      alert('User deleted.');
      loadAdminData();
    } catch (e) { alert('Error deleting user'); }
  };

  const openEditUser = (u) => {
    setEditUser(u);
    setEditUserData({ full_name: u.full_name, email: u.email, phone: u.phone, aadhaar: u.aadhaar, wallet_balance: u.wallet_balance });
    setShowUserModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/admin/users/${editUser.id}`, editUserData);
      alert('User updated.');
      setShowUserModal(false);
      loadAdminData();
    } catch (e) { alert('Error updating user'); }
  };

  const resetForm = () => {
    setFormType('add');
    setEditId(null);
    setTrainNumber('');
    setTrainName('');
    setTrainType('Express');
    setSourceText('');
    setDestText('');
    setDepTime('');
    setArrTime('');
    setDuration('');
    setRunsOn('Mon,Tue,Wed,Thu,Fri,Sat,Sun');
    setStops([]);
  };

  // Chart configs
  const getLineData = () => {
    if (!stats || !stats.bookingsTrend) return { labels: [], datasets: [] };
    return {
      labels: stats.bookingsTrend.map(b => new Date(b.date).toLocaleDateString(undefined, { weekday: 'short' })),
      datasets: [
        {
          label: 'Daily Bookings',
          data: stats.bookingsTrend.map(b => b.count),
          borderColor: '#008dd5',
          backgroundColor: 'rgba(0, 141, 213, 0.1)',
          fill: true,
          tension: 0.3
        }
      ]
    };
  };

  const getDoughnutData = () => {
    if (!stats || !stats.revenueByType) return { labels: [], datasets: [] };
    return {
      labels: stats.revenueByType.map(r => r.type),
      datasets: [
        {
          data: stats.revenueByType.map(r => parseFloat(r.revenue)),
          backgroundColor: ['#008dd5', '#f1c40f', '#e74c3c', '#2ecc71', '#9b59b6', '#34495e'],
          borderWidth: 0
        }
      ]
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="w-8 h-8 border-4 border-railway-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 min-h-screen">
      
      {/* Title banner */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-10 pb-6 border-b border-gray-800">
        <div>
          <div className="flex items-center space-x-2 text-red-500 font-extrabold tracking-wider uppercase text-xs">
            <ShieldAlert size={16} />
            <span>Admin Control Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1.5">RailVerse AI System Manager</h1>
        </div>

        {/* Tab triggers */}
        <div className="flex space-x-3.5 bg-slate-950 p-1.5 rounded-xl border border-gray-900">
          {[
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'trains', label: 'Trains Directory', icon: Train },
            { id: 'bookings', label: 'Bookings Logs', icon: BookOpen },
            { id: 'users', label: 'Passenger Database', icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setShowAddForm(false); }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-railway-navy text-railway-accent border border-railway-accent/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENTS */}

      {/* 1. ANALYTICS */}
      {activeTab === 'analytics' && stats && (
        <div className="space-y-10">
          {/* Key KPI blocks */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Bookings', val: stats.kpis.totalBookings, color: 'text-white' },
              { label: 'Total Gross Revenue', val: `₹${stats.kpis.totalRevenue.toFixed(2)}`, color: 'text-railway-gold' },
              { label: 'Total Registered Passengers', val: stats.kpis.totalUsers, color: 'text-railway-accent' },
              { label: 'Active Mapped Trains', val: stats.kpis.totalTrains, color: 'text-white' }
            ].map((kpi, idx) => (
              <div key={idx} className="glass-card p-6 rounded-2xl border border-gray-850">
                <span className="text-[10px] text-gray-500 font-bold uppercase">{kpi.label}</span>
                <p className={`text-xl sm:text-2xl font-black mt-2 ${kpi.color}`}>{kpi.val}</p>
              </div>
            ))}
          </div>

          {/* Charts container */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Bookings graph */}
            <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-gray-850">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Bookings Activity Trend (7 Days)</h3>
              <div className="h-[250px] w-full bg-slate-950/40 rounded-2xl border border-gray-900/60 p-2.5">
                <Line 
                  data={getLineData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { grid: { color: 'rgba(255,255,255,0.03)' } },
                      y: { grid: { color: 'rgba(255,255,255,0.03)' } }
                    }
                  }}
                />
              </div>
            </div>

            {/* Category revenue chart */}
            <div className="glass-card p-6 rounded-3xl border border-gray-850 flex flex-col justify-between">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Revenue share by Train Type</h3>
              <div className="h-[200px] flex items-center justify-center">
                <Doughnut 
                  data={getDoughnutData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 }, color: '#9ca3af' } } }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Popular routes table */}
          <div className="glass-card p-6 rounded-3xl border border-gray-850">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Top 5 Booked Trains</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-gray-300">
                <thead className="text-[10px] text-gray-500 uppercase border-b border-gray-800">
                  <tr>
                    <th className="pb-3">Train No</th>
                    <th className="pb-3">Train Name</th>
                    <th className="pb-3 text-right">Completed Bookings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850">
                  {stats.popularRoutes.map((route, i) => (
                    <tr key={i} className="hover:bg-slate-900/40">
                      <td className="py-3.5 font-mono text-railway-accent font-bold">#{route.number}</td>
                      <td className="py-3.5 text-white font-semibold">{route.name}</td>
                      <td className="py-3.5 text-right font-black text-white">{route.bookings_count} bookings</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. MANAGE TRAINS */}
      {activeTab === 'trains' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Trains Directory</h2>
            {!showAddForm && (
              <button
                onClick={() => { resetForm(); setShowAddForm(true); }}
                className="py-1.8 px-4 bg-railway-accent rounded-lg text-xs font-bold flex items-center space-x-1"
              >
                <Plus size={14} />
                <span>Add Train</span>
              </button>
            )}
          </div>

          {showAddForm && (
            <div className="glass-card p-6 rounded-3xl border border-gray-800 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-gray-850">
                <h3 className="text-xs font-bold uppercase text-railway-gold">{formType === 'add' ? 'Add New Train' : 'Edit Train details'}</h3>
                <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              {/* Form entries */}
              <form onSubmit={handleTrainSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Train Number (5-Digit)</label>
                  <input
                    type="text"
                    value={trainNumber}
                    onChange={(e) => setTrainNumber(e.target.value)}
                    className="py-2 px-3 rounded-lg glass-input text-xs"
                    required
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Train Name</label>
                  <input
                    type="text"
                    value={trainName}
                    onChange={(e) => setTrainName(e.target.value)}
                    className="py-2 px-3 rounded-lg glass-input text-xs"
                    required
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Train Type</label>
                  <input
                    type="text"
                    list="train-types"
                    value={trainType}
                    onChange={(e) => setTrainType(e.target.value)}
                    className="py-2 px-3 rounded-lg glass-input text-xs focus:bg-slate-950"
                    placeholder="Enter or select train type"
                    required
                  />
                  <datalist id="train-types">
                    <option value="Vande Bharat" />
                    <option value="Rajdhani" />
                    <option value="Shatabdi" />
                    <option value="Tejas" />
                    <option value="Duronto" />
                    <option value="Express" />
                  </datalist>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Source Station</label>
                  <input
                    list="station-list"
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    className="py-2 px-3 rounded-lg glass-input text-xs focus:bg-slate-950"
                    placeholder="Type to search..."
                    required
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Destination Station</label>
                  <input
                    list="station-list"
                    value={destText}
                    onChange={(e) => setDestText(e.target.value)}
                    className="py-2 px-3 rounded-lg glass-input text-xs focus:bg-slate-950"
                    placeholder="Type to search..."
                    required
                  />
                </div>
                <datalist id="station-list">
                  {stations.map(s => (
                    <option key={s.id} value={`${s.name} (${s.code})`} />
                  ))}
                </datalist>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Departure Time</label>
                  <input
                    type="time"
                    value={depTime}
                    onChange={(e) => setDepTime(e.target.value)}
                    className="py-2 px-3 rounded-lg glass-input text-xs"
                    required
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Arrival Time</label>
                  <input
                    type="time"
                    value={arrTime}
                    onChange={(e) => setArrTime(e.target.value)}
                    className="py-2 px-3 rounded-lg glass-input text-xs"
                    required
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] text-gray-500 font-bold uppercase">Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 05h 30m"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="py-2 px-3 rounded-lg glass-input text-xs"
                    required
                  />
                </div>
                {/* Intermediate Stops Route Builder */}
                <div className="col-span-3 mt-4 bg-slate-900/50 p-4 rounded-xl border border-gray-800">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-bold uppercase text-white flex items-center space-x-2">
                      <MapPin size={14} className="text-railway-accent" />
                      <span>Intermediate Route Stops</span>
                    </h4>
                    <button type="button" onClick={addStop} className="py-1.5 px-3 bg-gray-800 hover:bg-gray-700 text-white text-[10px] font-bold rounded uppercase">
                      + Add Stop
                    </button>
                  </div>
                  {stops.length === 0 ? (
                    <p className="text-xs text-gray-500 italic text-center py-4">No intermediate stops. Train will run directly from source to destination.</p>
                  ) : (
                    <div className="space-y-3">
                      {stops.map((stop, index) => (
                        <div key={index} className="flex flex-wrap md:flex-nowrap gap-3 items-end p-3 bg-slate-950/50 rounded-lg border border-gray-850">
                          <div className="flex-1 min-w-[150px] flex flex-col space-y-1">
                            <label className="text-[10px] text-gray-500 font-bold uppercase">Station</label>
                            <input list="station-list" value={stop.station} onChange={(e) => updateStop(index, 'station', e.target.value)} className="py-2 px-3 rounded-lg glass-input text-xs" placeholder="e.g. Bhatkal (BTJL)" required />
                          </div>
                          <div className="w-[100px] flex flex-col space-y-1">
                            <label className="text-[10px] text-gray-500 font-bold uppercase">Arrival</label>
                            <input type="time" value={stop.arrival} onChange={(e) => updateStop(index, 'arrival', e.target.value)} className="py-2 px-3 rounded-lg glass-input text-xs" required />
                          </div>
                          <div className="w-[100px] flex flex-col space-y-1">
                            <label className="text-[10px] text-gray-500 font-bold uppercase">Departure</label>
                            <input type="time" value={stop.departure} onChange={(e) => updateStop(index, 'departure', e.target.value)} className="py-2 px-3 rounded-lg glass-input text-xs" required />
                          </div>
                          <div className="w-[100px] flex flex-col space-y-1">
                            <label className="text-[10px] text-gray-500 font-bold uppercase">Dist (KM)</label>
                            <input type="number" value={stop.distance} onChange={(e) => updateStop(index, 'distance', e.target.value)} className="py-2 px-3 rounded-lg glass-input text-xs" placeholder="From Source" required />
                          </div>
                          <button type="button" onClick={() => removeStop(index)} className="p-2 bg-red-950/30 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors h-[34px]">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-1 col-span-3">
                  <button type="submit" className="py-2.5 bg-railway-accent rounded-xl text-xs font-bold text-white uppercase mt-4">
                    Save Train Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Trains list */}
          <div className="glass-card p-6 rounded-3xl border border-gray-850">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-gray-300">
                <thead className="text-[10px] text-gray-500 uppercase border-b border-gray-800">
                  <tr>
                    <th className="pb-3">Train</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Source</th>
                    <th className="pb-3">Destination</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850">
                  {trains.map((train) => (
                    <tr key={train.id} className="hover:bg-slate-900/40">
                      <td className="py-3.5">
                        <span className="font-mono text-railway-accent font-bold">#{train.number}</span>
                        <p className="text-white font-bold mt-0.5">{train.name}</p>
                      </td>
                      <td className="py-3.5 uppercase">{train.type}</td>
                      <td className="py-3.5">{train.source_name}</td>
                      <td className="py-3.5">{train.dest_name}</td>
                      <td className="py-3.5 text-right space-x-2">
                        <button
                          onClick={() => openEditForm(train)}
                          className="py-1 px-3 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded text-xs font-bold transition-colors"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => handleDeleteTrain(train.id)}
                          className="py-1 px-3 bg-red-900/30 text-red-400 hover:bg-red-600 hover:text-white rounded text-xs font-bold transition-colors"
                        >
                          Remove
                        </button>
                        <button
                          onClick={() => handleCreateReturnJourney(train)}
                          className="py-1 px-3 bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white rounded text-xs font-bold transition-colors mt-1 md:mt-0"
                        >
                          Return Train
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. MANAGE BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="glass-card p-6 rounded-3xl border border-gray-850 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Bookings logs database</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-gray-300">
              <thead className="text-[10px] text-gray-500 uppercase border-b border-gray-800">
                <tr>
                  <th className="pb-3">PNR</th>
                  <th className="pb-3">Passenger</th>
                  <th className="pb-3">Train</th>
                  <th className="pb-3">Journey Date</th>
                  <th className="pb-3">Fare Charged</th>
                  <th className="pb-3 text-right">Status & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-850">
                {bookingsList.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-900/40">
                    <td className="py-3.5 font-mono text-railway-accent font-bold">#{booking.pnr}</td>
                    <td className="py-3.5 text-white font-bold">{booking.user_name}</td>
                    <td className="py-3.5">
                      <span>{booking.train_number} - {booking.train_name}</span>
                      <p className="text-[9px] text-gray-500 uppercase">{booking.source_code} ➔ {booking.dest_code}</p>
                    </td>
                    <td className="py-3.5">{new Date(booking.journey_date).toLocaleDateString()}</td>
                    <td className="py-3.5 font-bold text-railway-gold">₹{parseFloat(booking.total_fare).toFixed(2)}</td>
                    <td className="py-3.5 text-right space-x-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full mr-2 ${
                        booking.status === 'Booked' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {booking.status}
                      </span>
                      {booking.status === 'Booked' && (
                        <button onClick={() => handleCancelBooking(booking.id)} className="text-orange-400 hover:text-orange-300 text-[10px] font-bold bg-orange-500/10 hover:bg-orange-500/20 px-2 py-1 rounded border border-orange-500/20">Cancel</button>
                      )}
                      <button onClick={() => handleDeleteBooking(booking.id)} className="text-red-400 hover:text-red-300 text-[10px] font-bold bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded border border-red-500/20">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MANAGE USERS */}
      {activeTab === 'users' && (
        <div className="glass-card p-6 rounded-3xl border border-gray-850 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Registered passengers database</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-gray-300">
              <thead className="text-[10px] text-gray-500 uppercase border-b border-gray-800">
                <tr>
                  <th className="pb-3">Username</th>
                  <th className="pb-3">Full Name</th>
                  <th className="pb-3">Email & Contact</th>
                  <th className="pb-3">Aadhaar Number</th>
                  <th className="pb-3 text-right">Wallet Balance</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-850">
                {usersList.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-900/40">
                    <td className="py-3.5 text-railway-accent font-bold">@{usr.username}</td>
                    <td className="py-3.5 text-white font-bold">{usr.full_name}</td>
                    <td className="py-3.5">
                      <p>{usr.email}</p>
                      <p className="text-[9px] text-gray-500 font-mono">{usr.phone || 'No phone'}</p>
                    </td>
                    <td className="py-3.5 font-mono">{usr.aadhaar}</td>
                    <td className="py-3.5 text-right font-black text-railway-gold">₹{parseFloat(usr.wallet_balance).toFixed(2)}</td>
                    <td className="py-3.5 text-right space-x-2">
                      <button onClick={() => openEditUser(usr)} className="p-1.5 hover:bg-slate-800 text-gray-400 hover:text-white rounded">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDeleteUser(usr.id)} className="p-1.5 hover:bg-red-950/20 text-gray-500 hover:text-red-400 rounded">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="glass-card w-full max-w-md p-6 rounded-3xl border border-gray-800 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-850">
              <h3 className="text-sm font-bold uppercase text-white">Edit Passenger Details</h3>
              <button onClick={() => setShowUserModal(false)} className="text-gray-500 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Full Name</label>
                <input type="text" value={editUserData.full_name} onChange={(e) => setEditUserData({...editUserData, full_name: e.target.value})} className="py-2 px-3 rounded-lg glass-input text-xs" required />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Email</label>
                <input type="email" value={editUserData.email} onChange={(e) => setEditUserData({...editUserData, email: e.target.value})} className="py-2 px-3 rounded-lg glass-input text-xs" required />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Phone</label>
                <input type="text" value={editUserData.phone} onChange={(e) => setEditUserData({...editUserData, phone: e.target.value})} className="py-2 px-3 rounded-lg glass-input text-xs" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Aadhaar Number</label>
                <input type="text" value={editUserData.aadhaar} onChange={(e) => setEditUserData({...editUserData, aadhaar: e.target.value})} className="py-2 px-3 rounded-lg glass-input text-xs" />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-gray-500 font-bold uppercase">Wallet Balance (₹)</label>
                <input type="number" step="0.01" value={editUserData.wallet_balance} onChange={(e) => setEditUserData({...editUserData, wallet_balance: e.target.value})} className="py-2 px-3 rounded-lg glass-input text-xs" required />
              </div>
              <button type="submit" className="w-full py-2.5 bg-railway-accent rounded-xl text-xs font-bold text-white uppercase mt-2">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
