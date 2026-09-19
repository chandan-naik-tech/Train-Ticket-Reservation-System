import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Wallet, CreditCard, Landmark, CheckCircle, Ticket, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import api from '../utils/api';

export default function PaymentPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useContext(AuthContext);
  const [bookingData, setBookingData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Wallet');
  
  // Payment detail forms
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');

  const [loading, setLoading] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState(null); // { pnr, bookingId }

  useEffect(() => {
    const raw = localStorage.getItem('temp_booking');
    if (!raw) {
      navigate('/');
      return;
    }
    setBookingData(JSON.parse(raw));
  }, []);

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!bookingData) return;

    if (paymentMethod === 'Wallet' && parseFloat(user.wallet_balance) < bookingData.totalFare) {
      alert('Insufficient wallet balance. Please select another method or fund your wallet.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/bookings/book', {
        trainId: bookingData.trainId,
        sourceId: bookingData.sourceId,
        destId: bookingData.destId,
        journeyDate: bookingData.journeyDate,
        quota: bookingData.quota,
        classType: bookingData.classType,
        totalFare: bookingData.totalFare,
        passengers: bookingData.passengers,
        paymentMethod: paymentMethod
      });

      // Update user context (updates wallet balance)
      await refreshProfile();

      // Clear temp booking data
      localStorage.removeItem('temp_booking');

      setSuccessReceipt({
        pnr: res.data.pnr,
        bookingId: res.data.bookingId,
        totalFare: bookingData.totalFare
      });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Transaction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!bookingData) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 min-h-screen">
      
      {!successReceipt ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Payment Method Selector */}
          <div className="md:col-span-2 space-y-6">
            <div className="glass-card p-6 rounded-3xl border border-gray-850">
              <h2 className="text-lg font-bold text-white mb-6">Choose Payment Method</h2>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { id: 'Wallet', label: 'Wallet', icon: Wallet },
                  { id: 'Card', label: 'Card', icon: CreditCard },
                  { id: 'UPI', label: 'UPI / QR', icon: Landmark }
                ].map(method => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                        paymentMethod === method.id
                          ? 'bg-railway-navy/30 border-railway-accent text-railway-accent shadow-md shadow-railway-accent/15'
                          : 'bg-slate-950/40 border-gray-850 text-gray-400 hover:text-white'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="text-xs font-semibold mt-2">{method.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Input forms */}
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                
                {paymentMethod === 'Wallet' && (
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-gray-900 space-y-3">
                    <p className="text-xs text-gray-400">Available RailVerse Wallet balance:</p>
                    <p className="text-xl font-black text-railway-gold">₹{parseFloat(user.wallet_balance).toFixed(2)}</p>
                    
                    {parseFloat(user.wallet_balance) < bookingData.totalFare ? (
                      <p className="text-[10px] text-red-400 font-bold">❌ Balance is insufficient for this ticket booking.</p>
                    ) : (
                      <p className="text-[10px] text-emerald-400 font-medium">✓ Secure processing using MySQL transaction locks.</p>
                    )}
                  </div>
                )}

                {paymentMethod === 'Card' && (
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] text-gray-400 font-semibold">Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="As on credit card..."
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="py-2 px-3 rounded-lg glass-input text-xs"
                        required
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] text-gray-400 font-semibold">Card Number</label>
                      <input
                        type="text"
                        placeholder="16-digit card number..."
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="py-2 px-3 rounded-lg glass-input text-xs"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] text-gray-400 font-semibold">Expiration</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="py-2 px-3 rounded-lg glass-input text-xs"
                          required
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-[10px] text-gray-400 font-semibold">CVV</label>
                        <input
                          type="password"
                          placeholder="***"
                          maxLength={3}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="py-2 px-3 rounded-lg glass-input text-xs"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'UPI' && (
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] text-gray-400 font-semibold">UPI ID</label>
                      <input
                        type="text"
                        placeholder="e.g. name@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="py-2 px-3 rounded-lg glass-input text-xs"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 text-center uppercase tracking-wide">Or scan QR code at checkout</p>
                  </div>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 glass-btn rounded-xl text-sm font-bold flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing Database Transaction...</span>
                      </>
                    ) : (
                      <>
                        <span>Pay ₹{bookingData.totalFare.toFixed(2)} & Generate Ticket</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>

          {/* Booking Summary Column */}
          <div className="glass-card p-6 rounded-3xl border border-gray-850 h-fit space-y-6">
            <h3 className="text-sm font-bold text-white border-b border-gray-800 pb-3">Booking Details</h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Class Type:</span>
                <span className="text-white font-semibold">{bookingData.classType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Quota:</span>
                <span className="text-white font-semibold">{bookingData.quota}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Passengers:</span>
                <span className="text-white font-semibold">{bookingData.passengers.length} Persons</span>
              </div>
              {bookingData.selectedSeats.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Selected Seats:</span>
                  <span className="text-railway-gold font-semibold">
                    {bookingData.selectedSeats.map(s => s.seatNumber).join(', ')}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-white pt-4 border-t border-gray-800">
                <span>Total Amount:</span>
                <span className="text-railway-gold">₹{bookingData.totalFare.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950/40 rounded-xl border border-gray-900 flex items-center space-x-2.5 text-[10px] text-gray-400">
              <ShieldCheck className="text-railway-accent" size={16} />
              <span>Full SSL Data Encryption & MySQL Transaction Security.</span>
            </div>
          </div>
        </div>
      ) : (
        /* PAYMENT RECEIPT SUCCESS OVERLAY */
        <div className="max-w-md mx-auto glass-card p-8 rounded-3xl border border-emerald-500/30 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={36} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Payment Confirmed</h2>
            <p className="text-xs text-gray-400">Your ticket has been generated in database</p>
          </div>

          <div className="p-4 bg-slate-950/60 border border-gray-900 rounded-2xl text-left space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Ticket PNR:</span>
              <span className="text-white font-bold font-mono tracking-wider">{successReceipt.pnr}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Booking ID:</span>
              <span className="text-white font-mono">#{successReceipt.bookingId}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">Amount Charged:</span>
              <span className="text-railway-gold font-bold">₹{successReceipt.totalFare.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => navigate(`/search?pnr=${successReceipt.pnr}`)}
              className="flex-1 py-3 bg-railway-navy/30 border border-railway-accent text-railway-accent hover:bg-railway-accent hover:text-white rounded-xl text-xs font-bold transition-all"
            >
              View Ticket PNR
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-3 glass-btn rounded-xl text-xs font-bold"
            >
              Dashboard
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
