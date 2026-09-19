import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Armchair, Rotate3d, CheckCircle2 } from 'lucide-react';

export default function Train3DView({ selectedSeats = [], onSeatSelect, classType = '3A' }) {
  const [activeCoach, setActiveCoach] = useState('B1');
  const [rotateX, setRotateX] = useState(15);
  const [rotateY, setRotateY] = useState(-10);

  // Mock seat layout inside our active coach
  // 15 seats per coach
  const seatsData = Array.from({ length: 15 }, (_, i) => {
    const seatNum = i + 1;
    // Static booked state for rendering variety (e.g. seats 3, 7, 12 are booked)
    const isBooked = [3, 7, 12].includes(seatNum);
    
    let type = 'Lower';
    if (seatNum % 3 === 1) type = 'Window';
    else if (seatNum % 3 === 2) type = 'Lower';
    else type = 'Upper';

    return {
      seatNumber: seatNum,
      type,
      isBooked
    };
  });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Scale down movements
    setRotateY(x * 0.08);
    setRotateX(-y * 0.15);
  };

  const handleMouseLeave = () => {
    // Reset to default angle
    setRotateX(15);
    setRotateY(-10);
  };

  const selectCoach = (coach) => {
    setActiveCoach(coach);
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* Legend & Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-railway-blue/40 border border-gray-800 rounded-2xl">
        <div className="flex items-center space-x-2">
          <Rotate3d size={18} className="text-railway-accent animate-spin" />
          <span className="text-xs text-gray-400">Hover & drag mouse over the coach to inspect in 3D perspective</span>
        </div>
        
        {/* Legends */}
        <div className="flex space-x-4 text-xs">
          <div className="flex items-center space-x-1.5">
            <div className="w-3.5 h-3.5 rounded bg-gray-700 border border-gray-600"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3.5 h-3.5 rounded bg-red-600/40 border border-red-500"></div>
            <span>Booked</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3.5 h-3.5 rounded bg-railway-gold border border-railway-gold glow-glow"></div>
            <span>Selected</span>
          </div>
        </div>
      </div>

      {/* Coach Selector */}
      <div className="flex space-x-3 justify-center">
        {['C1', 'E1', 'A1', 'B1'].map(coach => (
          <button
            key={coach}
            onClick={() => selectCoach(coach)}
            className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all border ${
              activeCoach === coach
                ? 'bg-railway-accent text-white border-railway-accent shadow-md shadow-railway-accent/20'
                : 'bg-railway-navy/20 border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Coach {coach} ({coach === 'C1' ? 'CC' : coach === 'E1' ? 'EC' : coach === 'A1' ? '2A' : '3A'})
          </button>
        ))}
      </div>

      {/* 3D Visualizer Box */}
      <div 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full h-[280px] bg-slate-950/40 border border-gray-900 rounded-3xl overflow-hidden flex items-center justify-center cursor-move"
        style={{ perspective: '1000px' }}
      >
        {/* Animated grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#111827_1px,transparent_1px),linear-gradient(to_bottom,#111827_1px,transparent_1px)] bg-[size:24px_24px] opacity-40"></div>

        {/* 3D Train Coach */}
        <motion.div
          animate={{
            rotateX: rotateX,
            rotateY: rotateY,
            z: 0
          }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          className="relative w-[90%] md:w-[70%] h-[150px] bg-gradient-to-r from-slate-900 via-railway-navy to-slate-900 rounded-2xl border-2 border-railway-accent/40 shadow-2xl flex flex-col justify-between py-3 px-6"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Windows on top part */}
          <div className="flex justify-between px-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-12 h-4 bg-cyan-900/60 border border-cyan-400/40 rounded-sm"></div>
            ))}
          </div>

          {/* Seat Layout (Internal projection visual) */}
          <div className="grid grid-cols-5 gap-2.5 my-2">
            {seatsData.map((seat) => {
              const isSelected = selectedSeats.some(s => s.coach === activeCoach && s.seatNumber === seat.seatNumber);
              const isBooked = seat.isBooked;

              let bg = 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:border-gray-500';
              if (isBooked) bg = 'bg-red-950/50 border-red-800 text-red-500 cursor-not-allowed';
              if (isSelected) bg = 'bg-railway-gold border-railway-gold text-railway-dark font-bold glow-glow';

              return (
                <button
                  key={seat.seatNumber}
                  disabled={isBooked}
                  onClick={() => onSeatSelect(activeCoach, seat.seatNumber, seat.type)}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] transition-all border ${bg}`}
                  style={{ transform: 'translateZ(10px)' }}
                >
                  <Armchair size={14} className={isSelected ? 'text-railway-dark' : 'text-gray-400'} />
                  <span>{seat.seatNumber}</span>
                </button>
              );
            })}
          </div>

          {/* Wheel rails indicator */}
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-[105%] h-1 bg-gray-700 flex justify-between">
            <div className="w-14 h-4 bg-gray-800 rounded-full border border-gray-600 -mt-1.5 ml-8"></div>
            <div className="w-14 h-4 bg-gray-800 rounded-full border border-gray-600 -mt-1.5 mr-8"></div>
          </div>
        </motion.div>
      </div>

      {/* Seat Selection Panel summary */}
      {selectedSeats.length > 0 && (
        <div className="p-4 bg-railway-navy/20 border border-railway-accent/30 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="text-railway-gold" size={20} />
            <div>
              <p className="text-sm font-semibold">Seats Selected</p>
              <p className="text-xs text-gray-400">
                {selectedSeats.map(s => `Coach ${s.coach} - Seat ${s.seatNumber} (${s.type})`).join(', ')}
              </p>
            </div>
          </div>
          <button 
            onClick={() => onSeatSelect('clear')}
            className="text-xs text-red-400 hover:text-red-300 font-semibold"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
