
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AIChatbot from './components/AIChatbot';

// Pages
import Home from './pages/Home';
import Search from './pages/Search';
import BookingPage from './pages/Booking';
import PaymentPage from './pages/Payment';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import AIPlannerPage from './pages/AIPlannerPage';
import LiveStatus from './pages/LiveStatus';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          {/* Global Navigation Header */}
          <Navbar />
          
          {/* Main Display Page content */}
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/live" element={<LiveStatus />} />
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/payment" element={<PaymentPage />} />
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/ai-planner" element={<AIPlannerPage />} />
            </Routes>
          </main>

          {/* Floating AI Chatbot Assistant */}
          <AIChatbot />

          {/* Footer information bar */}
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
