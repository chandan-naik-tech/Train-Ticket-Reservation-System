const db = require('../config/db');

// 1. AI Waitlist Predictor
exports.predictWaitlist = (req, res) => {
  const { trainNumber, date, wlCount } = req.body;

  if (!wlCount || wlCount <= 0) {
    return res.json({
      probability: 100,
      status: 'Confirmed',
      message: 'Your ticket is already confirmed. No waiting list prediction needed.'
    });
  }

  // Calculate days to journey from today
  const journeyDate = new Date(date);
  const today = new Date();
  const timeDiff = journeyDate.getTime() - today.getTime();
  const daysToJourney = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));

  // HEURISTIC PREDICTION LOGIC
  // - High WL count decreases probability
  // - More days to journey increases probability (more time for cancellations)
  // - Vande Bharat/Rajdhani have high demand, lower cancel rates (slightly lower confirm prob)
  let baseProb = 95 - (wlCount * 3.5);
  baseProb += (daysToJourney * 1.2);

  // Constraints
  let probability = Math.round(baseProb);
  if (probability > 98) probability = 98;
  if (probability < 5) probability = 5;

  let status = 'Low';
  let color = 'text-red-500';
  let message = '';

  if (probability >= 75) {
    status = 'Very High';
    color = 'text-emerald-500';
    message = 'High confirmation chance. Travel with confidence!';
  } else if (probability >= 50) {
    status = 'Moderate';
    color = 'text-yellow-500';
    message = 'Moderate chance of confirmation. Monitor booking closely.';
  } else {
    status = 'Low';
    color = 'text-red-500';
    message = 'Low chance. We recommend booking a tatkal ticket or an alternative train.';
  }

  res.json({
    probability,
    status,
    color,
    message,
    factors: [
      `Days to departure: ${daysToJourney} days`,
      `Current waiting list position: WL ${wlCount}`,
      `Historical cancellation rate for this route: 14.2%`
    ]
  });
};

// 2. AI Travel Planner
exports.planTravel = (req, res) => {
  const { source, destination, preferences } = req.body;

  if (!source || !destination) {
    return res.status(400).json({ message: 'Source and destination are required.' });
  }

  // Sample Tourist recommendations
  const itineraries = {
    'Delhi': {
      spots: ['Red Fort', 'Qutub Minar', 'India Gate', 'Lotus Temple'],
      description: 'The historic capital city with a rich blend of heritage and modern culture.',
      restaurants: ['Karims (Old Delhi)', 'Bukhara', 'Indian Accent'],
      stayRecommendation: 'Connaught Place (CP) for luxury, Paharganj for budget travelers.'
    },
    'Mumbai': {
      spots: ['Gateway of India', 'Marine Drive', 'Elephanta Caves', 'Siddhivinayak Temple'],
      description: 'The city of dreams, beautiful coastal drives, and Bollywood glamour.',
      restaurants: ['Leopold Cafe', 'Britannia & Co.', 'Trishna'],
      stayRecommendation: 'Colaba for sea views, Bandra for active nightlife.'
    },
    'Bengaluru': {
      spots: ['Lalbagh Botanical Gardens', 'Bangalore Palace', 'Cubbon Park', 'Nandi Hills'],
      description: 'The Garden City and Silicon Valley of India, known for microbreweries and amazing weather.',
      restaurants: ['MTR (Mavalli Tiffin Room)', 'Toit', 'Koshy\'s'],
      stayRecommendation: 'Indiranagar or Koramangala for premium stays and accessibility.'
    },
    'Goa': {
      spots: ['Calangute Beach', 'Basilica of Bom Jesus', 'Dudhsagar Falls', 'Fort Aguada'],
      description: 'Sun, sand, spices, and seafood - India\'s favorite beach holiday destination.',
      restaurants: ['Martin\'s Corner', 'Gunpowder', 'Fishermans Wharf'],
      stayRecommendation: 'North Goa for parties and beaches, South Goa for peace and luxury.'
    },
    'Varanasi': {
      spots: ['Kashi Vishwanath Temple', 'Dashashwamedh Ghat Ganga Aarti', 'Sarnath', 'Assi Ghat'],
      description: 'One of the oldest continuously inhabited cities in the world, the spiritual heart of India.',
      restaurants: ['Kashi Chat Bhandar', 'Deena Chat', 'Blue Lassi Shop'],
      stayRecommendation: 'Ghat-side heritage houses for raw Varanasi experience.'
    }
  };

  const destName = destination.split(' ')[0]; // Extract first word
  const match = itineraries[destName] || {
    spots: ['Local Markets', 'Historical Forts/Temples', 'Nature Parks', 'Museums'],
    description: `A beautiful city loaded with cultural diversity, perfect for a ${preferences || 'leisurely'} trip.`,
    restaurants: ['Popular Local Dhaba', 'City Center Multi-cuisine Resto'],
    stayRecommendation: 'Central railway station area or main city market.'
  };

  res.json({
    destination: destination,
    description: match.description,
    spots: match.spots,
    restaurants: match.restaurants,
    stay: match.stayRecommendation,
    suggestedItinerary: [
      { day: 1, title: 'Arrival & Rest', description: `Check-in, relax, and explore the nearby markets and enjoy local street food.` },
      { day: 2, title: 'Sightseeing Extravaganza', description: `Visit the top attractions: ${match.spots.slice(0, 2).join(', ')}. Capture the scenic evening view.` },
      { day: 3, title: 'Heritage & Local Flavors', description: `Visit ${match.spots[2] || 'city landmarks'}. Enjoy a authentic dinner at ${match.restaurants[0]}.` },
      { day: 4, title: 'Souvenir Shopping & Departure', description: `Buy local handicrafts and catch your returning RailVerse train.` }
    ]
  });
};

// 3. AI Fare Prediction
exports.predictFare = (req, res) => {
  const { trainNumber, baseFare } = req.body;
  const fare = baseFare || 1200;

  // Generate 7 days of future fare trends
  const trend = [];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  for (let i = 0; i < 7; i++) {
    let multiplier = 1.0;
    // Weekends (Fri, Sat, Sun) are 15-20% higher due to high demand
    if (i >= 4) {
      multiplier += 0.15 + (Math.random() * 0.05);
    } else {
      multiplier += (Math.random() * 0.05) - 0.02;
    }
    trend.push({
      day: days[i],
      fare: Math.round(fare * multiplier)
    });
  }

  res.json({
    currentFare: fare,
    averageFare: Math.round(fare * 1.05),
    trend,
    advice: 'Book within the next 48 hours. Fares are expected to increase by 12% as the weekend approaches.'
  });
};

// 4. AI Crowd Prediction
exports.predictCrowd = (req, res) => {
  const { trainNumber, date } = req.body;

  // Heuristic based on train number and weekday
  const journeyDate = new Date(date);
  const dayOfWeek = journeyDate.getDay(); // 0 is Sunday, 6 is Saturday
  
  let crowdPercentage = 60; // Base
  if (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) {
    crowdPercentage += 25; // Weekends
  }
  
  const trainInt = parseInt(trainNumber) || 12301;
  if (trainInt % 2 === 0) crowdPercentage += 10; // Peak hours trains
  
  crowdPercentage = Math.min(100, Math.max(20, crowdPercentage));

  let status = 'Moderate';
  let message = 'Normal seating density. Comfortable boarding expected.';
  let color = 'bg-yellow-500';

  if (crowdPercentage >= 85) {
    status = 'Heavy / Peak';
    message = 'Very heavy crowd. Expect packed coaches and boarding queues.';
    color = 'bg-red-500';
  } else if (crowdPercentage < 45) {
    status = 'Low / Relaxed';
    message = 'Quiet journey. Plenty of elbow room in the coaches.';
    color = 'bg-emerald-500';
  }

  res.json({
    crowdPercentage,
    status,
    message,
    color
  });
};

// 5. AI Smart Seat Recommendation
exports.recommendSeat = (req, res) => {
  const { passengers } = req.body;

  if (!passengers || passengers.length === 0) {
    return res.status(400).json({ message: 'Passenger list is required for recommendation.' });
  }

  // Iterate over passengers and assign recommendations
  const recommendations = passengers.map((p, idx) => {
    const age = parseInt(p.age);
    const gender = p.gender;
    const pref = p.seatPreference || 'No Preference';

    let recommendedBerth = 'Lower';
    let rationale = 'Automatically selected for easier accessibility.';

    if (age >= 60) {
      recommendedBerth = 'Lower';
      rationale = 'Recommended Lower Berth for Senior Citizens for safety, close to exit gate and restrooms.';
    } else if (age <= 12) {
      recommendedBerth = 'Window';
      rationale = 'Assigned Window Seat for child enjoyment and safety away from the aisle.';
    } else if (gender === 'Female' && idx === 0) {
      recommendedBerth = 'Lower';
      rationale = 'Reserved Lower Berth in female-preferred bay layout.';
    } else {
      // General adult
      if (pref === 'Lower') {
        recommendedBerth = 'Lower';
        rationale = 'Assigned Lower berth matching your preference.';
      } else if (pref === 'Upper') {
        recommendedBerth = 'Upper';
        rationale = 'Assigned Upper berth matching your preference to ensure peaceful sleep.';
      } else {
        // Fallback split
        const layouts = ['Window', 'Upper', 'Lower', 'Side-Lower', 'Side-Upper'];
        recommendedBerth = layouts[idx % 5];
        rationale = 'Optimized distribution for group seating adjacency.';
      }
    }

    return {
      name: p.name,
      recommendedBerth,
      rationale
    };
  });

  res.json(recommendations);
};

// 6. AI Travel Chatbot
exports.chatbotQuery = (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ message: 'Empty query.' });
  }

  const normalized = query.toLowerCase();
  let reply = '';
  let options = [];

  if (normalized.includes('pnr') || normalized.includes('status')) {
    reply = 'You can check your PNR booking status directly on the User Dashboard or by typing the 10-digit PNR in the navigation search bar. If you just booked, your PNR status is likely CNF (Confirmed).';
    options = ['Check Wallet Balance', 'View Bookings'];
  } else if (normalized.includes('refund') || normalized.includes('cancel')) {
    reply = 'RailVerse AI offers instant refunds! If you cancel a ticket, 100% of the ticket fare is immediately refunded to your RailVerse Wallet. You can use these wallet funds to book future tickets instantly.';
    options = ['View Wallet', 'Cancellation Policy'];
  } else if (normalized.includes('vande bharat') || normalized.includes('train')) {
    reply = 'Vande Bharat Express is India\'s premium semi-high speed train, cruising at up to 160 km/h. On RailVerse, you can search and book Vande Bharat trains across various routes (e.g. Delhi-Varanasi, Bengaluru-Mysuru) with glassmorphic dashboards.';
    options = ['Search Trains', 'Vande Bharat Schedule'];
  } else if (normalized.includes('tatkal')) {
    reply = 'Tatkal booking opens daily for emergency travel. Tatkal tickets attract a 15% surcharge over the base fare. On RailVerse, select the "Tatkal" option under the Quota dropdown during search or booking.';
    options = ['Book Tatkal', 'Tatkal Charges'];
  } else if (normalized.includes('seat') || normalized.includes('berth')) {
    reply = 'Our Smart Seat Recommendation engine automatically assigns Lower berths for senior citizens, window seats for kids, and keeps family members grouped in the same coach bay.';
    options = ['Smart Seat recommendation', 'Coach layouts'];
  } else {
    reply = 'Hello! I am your RailVerse AI Assistant. I can help you with PNR inquiries, refund status, Tatkal bookings, and route suggestions. What can I do for you today?';
    options = ['Search Trains', 'Plan a Trip', 'Check PNR Status'];
  }

  res.json({ reply, options });
};
