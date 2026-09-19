import React from 'react';
import { Train, Info, Shield, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full glass-card mt-20 border-t border-gray-800 py-12 px-8 flex flex-col items-center">
      <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-4 gap-10 border-b border-gray-800/60 pb-10">
        
        {/* Brand */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-3 text-xl font-bold">
            <div className="bg-railway-accent/20 p-2 rounded-lg text-railway-accent">
              <Train size={20} />
            </div>
            <span>Rail<span className="text-railway-accent">Verse</span> AI</span>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            The next-generation Indian Railways reservation platform. Harnessing the power of AI to provide confirmation predictions, travel suggestions, and smart seat allocations.
          </p>
        </div>

        {/* Services */}
        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Core Systems</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><a href="#" className="hover:text-railway-accent">AI Waitlist Forecasting</a></li>
            <li><a href="#" className="hover:text-railway-accent">AI Dynamic Route Planner</a></li>
            <li><a href="#" className="hover:text-railway-accent">Smart Coach Visualizer</a></li>
            <li><a href="#" className="hover:text-railway-accent">Voice-Assisted Ticket Search</a></li>
          </ul>
        </div>

        {/* Safety & Help */}
        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Security & Trust</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-center space-x-2">
              <Shield size={14} className="text-railway-accent" />
              <span>Secure JWT Auth</span>
            </li>
            <li className="flex items-center space-x-2">
              <ShieldCheck size={14} className="text-railway-gold" />
              <span>MySQL Transaction-Safe</span>
            </li>
            <li><a href="#" className="hover:text-railway-accent">Help Desk (24x7)</a></li>
            <li><a href="#" className="hover:text-railway-accent">Refund Policy</a></li>
          </ul>
        </div>

        {/* Featured Zones */}
        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Popular Zones</h4>
          <p className="text-sm text-gray-400 leading-relaxed">
            Connecting Northern (NR), Western (WR), Southern (SR), East Coast (ECoR), Konkan Railway, and the high-speed Vande Bharat network.
          </p>
        </div>

      </div>

      <div className="max-w-7xl w-full flex flex-col sm:flex-row items-center justify-between mt-8 text-xs text-gray-500">
        <span>© {new Date().getFullYear()} RailVerse AI. All rights reserved. (DBMS Project Requirement compliant)</span>
        <div className="flex items-center space-x-1.5 mt-4 sm:mt-0">
          <span>Made for Indian Railways travelers with</span>
          <Heart size={12} className="text-red-500 fill-current animate-pulse" />
        </div>
      </div>
    </footer>
  );
}
