import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Wallet, History, Bell, MessageSquare, ArrowRight, XCircle, Download, CreditCard, Star, RefreshCw } from 'lucide-react';
import api from '../utils/api';

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, refreshProfile, addFunds } = useContext(AuthContext);
  
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Wallet deposit
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);

  // Feedback form
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, notifsRes] = await Promise.all([
        api.get('/bookings/history'),
        api.get('/bookings/notifications')
      ]);
      setBookings(bookingsRes.data);
      setNotifications(notifsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Deposit funds handler
  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;

    setDepositing(true);
    try {
      await addFunds(parseFloat(depositAmount));
      setDepositAmount('');
      alert('Wallet loaded successfully! Updated balance.');
      loadDashboardData();
    } catch (err) {
      console.error(err);
      alert('Error adding funds to wallet.');
    } finally {
      setDepositing(false);
    }
  };

  // Cancellation handler
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this ticket? 100% refund will be credited back to your RailVerse Wallet.')) {
      return;
    }

    try {
      const res = await api.post('/bookings/cancel', { bookingId });
      alert(res.data.message);
      await refreshProfile();
      loadDashboardData();
    } catch (err) {
      console.error(err);
      alert('Error cancelling booking.');
    }
  };

  // Submit Feedback handler
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      await api.post('/bookings/feedback', { rating, comments });
      alert('Feedback submitted! A confirmation notification has been dispatched.');
      setComments('');
      loadDashboardData();
    } catch (err) {
      console.error(err);
      alert('Error submitting feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 min-h-screen">
      
      {/* Welcome Banner */}
      <div className="glass-card p-6 rounded-3xl border border-gray-850 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Namaste, {user?.full_name}!</h1>
          <p className="text-xs text-gray-400">Manage bookings, check wallet transaction history, and send service ratings.</p>
        </div>
        
        {/* Profile overview quick stats */}
        <div className="flex space-x-6">
          <div className="text-left">
            <span className="text-[10px] text-gray-500 uppercase font-semibold">User Role</span>
            <p className="text-xs font-bold text-white uppercase">{user?.role}</p>
          </div>
          <div className="text-left border-l border-gray-800 pl-6">
            <span className="text-[10px] text-gray-500 uppercase font-semibold">Aadhaar (ID)</span>
            <p className="text-xs font-bold text-white">****{user?.aadhaar?.slice(-4)}</p>
          </div>
          <div className="text-left border-l border-gray-800 pl-6">
            <span className="text-[10px] text-gray-500 uppercase font-semibold font-mono">Wallet</span>
            <p className="text-xs font-black text-railway-gold">₹{parseFloat(user?.wallet_balance || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="flex flex-col space-y-2">
          {[
            { id: 'bookings', label: 'My Bookings', icon: History },
            { id: 'wallet', label: 'Wallet Manager', icon: Wallet },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'feedback', label: 'Submit Feedback', icon: MessageSquare }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 px-5 py-3.5 rounded-2xl border text-xs font-bold transition-all text-left ${
                  activeTab === tab.id
                    ? 'bg-railway-navy/30 border-railway-accent text-railway-accent shadow-md shadow-railway-accent/10'
                    : 'bg-slate-950/40 border-gray-850 text-gray-400 hover:text-white hover:border-gray-700'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
          
          <button
            onClick={() => loadDashboardData()}
            className="flex items-center justify-center space-x-1.5 mt-4 text-[10px] text-gray-500 hover:text-white transition-colors"
          >
            <RefreshCw size={12} />
            <span>Sync Stats</span>
          </button>
        </div>

        {/* Tab Content Display Area */}
        <div className="lg:col-span-3">
          
          {/* TAB 1: Bookings list */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Booking History</h2>
              
              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="w-8 h-8 border-4 border-railway-accent border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-20 border border-gray-850 rounded-2xl bg-slate-950/20">
                  <History size={40} className="mx-auto text-gray-700 mb-3" />
                  <p className="text-xs text-gray-400">No ticket records found.</p>
                </div>
              ) : (
                bookings.map((booking) => (
                  <div key={booking.id} className="glass-card p-6 rounded-3xl border border-gray-850 space-y-4">
                    <div className="flex flex-wrap items-center justify-between border-b border-gray-800/60 pb-3 gap-3">
                      <div>
                        <span className="text-[10px] text-gray-500">PNR NUMBER</span>
                        <p className="text-sm font-extrabold font-mono text-white">{booking.pnr}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500">JOURNEY DATE</span>
                        <p className="text-xs font-semibold text-white">{new Date(booking.journey_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500">FARE CHARGED</span>
                        <p className="text-xs font-bold text-railway-gold">₹{parseFloat(booking.total_fare).toFixed(2)}</p>
                      </div>
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          booking.status === 'Booked' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[10px] text-railway-accent font-semibold">{booking.train_type}</span>
                        <p className="font-bold text-white">{booking.train_number} - {booking.train_name}</p>
                        <p className="text-[10px] text-gray-400">{booking.source_code} ➔ {booking.dest_code}</p>
                      </div>

                      {/* Control options */}
                      <div className="flex space-x-3">
                        <button
                          onClick={() => navigate(`/search?pnr=${booking.pnr}`)}
                          className="px-3.5 py-1.8 bg-railway-navy/30 border border-railway-accent/30 hover:border-railway-accent rounded-lg text-[10px] font-bold text-railway-accent flex items-center space-x-1"
                        >
                          <Download size={12} />
                          <span>View/Download</span>
                        </button>
                        
                        {booking.status === 'Booked' && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="px-3.5 py-1.8 bg-red-950/20 border border-red-900/50 hover:border-red-500 rounded-lg text-[10px] font-bold text-red-400 flex items-center space-x-1"
                          >
                            <XCircle size={12} />
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: Wallet Manager */}
          {activeTab === 'wallet' && (
            <div className="glass-card p-6 rounded-3xl border border-gray-850 space-y-8">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Wallet Manager</h2>
                <p className="text-xs text-gray-400">Load digital cash to perform fast transaction checkouts with one click.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Balance card */}
                <div className="p-6 bg-slate-950/40 border border-gray-900 rounded-2xl space-y-4">
                  <div className="flex items-center space-x-3 text-railway-gold">
                    <Wallet size={24} />
                    <span className="text-xs font-semibold text-gray-300">Net Balance Available</span>
                  </div>
                  <h3 className="text-3xl font-black text-white">₹{parseFloat(user?.wallet_balance || 0).toFixed(2)}</h3>
                  <p className="text-[10px] text-gray-500">No interest, full checkout liquidity.</p>
                </div>

                {/* Form load balance */}
                <form onSubmit={handleDepositSubmit} className="space-y-4">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-semibold">Load Funds Amount (INR)</label>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="py-2.5 px-3.5 rounded-xl glass-input text-xs"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={depositing}
                    className="w-full py-2.8 bg-railway-accent rounded-xl text-xs font-bold text-white flex items-center justify-center space-x-1.5"
                  >
                    <CreditCard size={14} />
                    <span>{depositing ? 'Processing payment...' : 'Deposit to Wallet'}</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: Notifications log */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">My Alerts</h2>

              {notifications.length === 0 ? (
                <div className="text-center py-20 border border-gray-850 rounded-2xl bg-slate-950/20">
                  <Bell size={40} className="mx-auto text-gray-700 mb-3" />
                  <p className="text-xs text-gray-400">All caught up! No recent notifications.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className="p-4 bg-slate-950/30 border border-gray-850 rounded-2xl space-y-1 flex items-start space-x-3.5">
                    <div className="p-2 rounded-lg bg-railway-navy text-railway-accent mt-0.5">
                      <Bell size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{notif.title}</h4>
                      <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{notif.message}</p>
                      <span className="text-[9px] text-gray-500 font-mono mt-1 block">
                        {new Date(notif.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: Submit Feedback */}
          {activeTab === 'feedback' && (
            <div className="glass-card p-6 rounded-3xl border border-gray-850 space-y-6">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Rate our Platform</h2>
                <p className="text-xs text-gray-400">Send us comments or suggestions. Submissions execute triggers that post internal notifications.</p>
              </div>

              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-semibold">Overall Rating (1 to 5 Stars)</label>
                  <div className="flex space-x-2.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="text-railway-gold p-1"
                      >
                        <Star size={24} className={star <= rating ? 'fill-current' : 'opacity-30'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-semibold">Comments</label>
                  <textarea
                    rows={4}
                    placeholder="Write your suggestions..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="py-2.5 px-3.5 rounded-xl glass-input text-xs"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="py-2.5 px-6 bg-railway-gold text-railway-dark hover:bg-white rounded-xl text-xs font-bold shadow-md shadow-railway-gold/15 transition-all"
                >
                  {submittingFeedback ? 'Posting review...' : 'Submit Feedback'}
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
