const db = require('../config/db');

// Get all stations (for autocomplete dropdowns)
exports.getAllStations = async (req, res) => {
  try {
    const [stations] = await db.query('SELECT * FROM stations ORDER BY name ASC');
    res.json(stations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving stations.' });
  }
};

// Search train by name or number
exports.searchByTrain = async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ message: 'Query is required.' });

  try {
    const [trains] = await db.query(
      `SELECT t.*, s1.name as source_name, s1.code as source_code, s2.name as dest_name, s2.code as dest_code
       FROM trains t
       JOIN stations s1 ON t.source_station_id = s1.id
       JOIN stations s2 ON t.destination_station_id = s2.id
       WHERE t.number LIKE ? OR t.name LIKE ? LIMIT 10`,
      [`%${query}%`, `%${query}%`]
    );
    res.json({ trains });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error retrieving trains.' });
  }
};

// Search trains based on source, destination, date, class, and quota
exports.searchTrains = async (req, res) => {
  const { source, destination, date, classType, quota } = req.query;

  if (!source || !destination) {
    return res.status(400).json({ message: 'Source and destination are required.' });
  }

  try {
    // Extract station code inside parentheses if present, e.g., "Mumbai (CSTM)" -> "CSTM"
    const extractStationCode = (str) => {
      if (!str) return '';
      const match = str.match(/\(([^)]+)\)/);
      return match ? match[1].trim() : str.trim();
    };

    const cleanSource = extractStationCode(source);
    const cleanDestination = extractStationCode(destination);

    // Resolve station IDs if codes/names are passed
    const [srcStations] = await db.query('SELECT id, code, name, city FROM stations WHERE code = ? OR name = ? OR city = ? OR name LIKE ?', [cleanSource, cleanSource, cleanSource, `${cleanSource}%`]);
    const [destStations] = await db.query('SELECT id, code, name, city FROM stations WHERE code = ? OR name = ? OR city = ? OR name LIKE ?', [cleanDestination, cleanDestination, cleanDestination, `${cleanDestination}%`]);

    if (srcStations.length === 0 || destStations.length === 0) {
      return res.status(404).json({ message: 'Source or destination station not found.' });
    }

    const srcIds = srcStations.map(s => s.id);
    const destIds = destStations.map(s => s.id);

    // Create placeholders for IN clause
    const srcPlaceholders = srcIds.map(() => '?').join(',');
    const destPlaceholders = destIds.map(() => '?').join(',');

    // Search direct trains or route-based trains
    // Join routes table twice to find a train passing through source AND destination in the correct order
    const [trains] = await db.query(
      `SELECT t.*, 
              rs.departure_time as route_departure_time,
              rd.arrival_time as route_arrival_time,
              rs.distance as route_source_distance,
              rd.distance as route_dest_distance,
              s1.name AS source_name, s1.code AS source_code, s1.city AS source_city,
              s2.name AS dest_name, s2.code AS dest_code, s2.city AS dest_city
       FROM routes rs
       JOIN routes rd ON rs.train_id = rd.train_id
       JOIN trains t ON t.id = rs.train_id
       JOIN stations s1 ON rs.station_id = s1.id
       JOIN stations s2 ON rd.station_id = s2.id
       WHERE rs.station_id IN (${srcPlaceholders}) AND rd.station_id IN (${destPlaceholders}) AND rs.stop_number < rd.stop_number`,
      [...srcIds, ...destIds]
    );

    let results = trains;
    let isAlternative = false;

    // Process results to append dynamic seat availability, WL count, and fares
    const processedResults = results.map(train => {
      // Use route specific timings if available
      const depTime = train.route_departure_time || train.departure_time;
      const arrTime = train.route_arrival_time || train.arrival_time;
      
      // Compute actual route distance
      let routeDistance = (train.route_dest_distance || 0) - (train.route_source_distance || 0);
      if (routeDistance <= 0) {
        // Fallback distance based on duration
        const hoursMatch = train.duration.match(/(\d+)h/);
        const hours = hoursMatch ? parseInt(hoursMatch[1]) : 5;
        routeDistance = hours * 70; // 70 km/h average speed
      }

      const baseDistance = routeDistance;
      
      // Multipliers based on train type
      let typeMultiplier = 1.0;
      if (train.type === 'Vande Bharat') typeMultiplier = 2.1;
      else if (train.type === 'Rajdhani') typeMultiplier = 1.8;
      else if (train.type === 'Tejas') typeMultiplier = 1.7;
      else if (train.type === 'Shatabdi') typeMultiplier = 1.5;
      else if (train.type === 'Duronto') typeMultiplier = 1.4;
      else if (train.type === 'Garib Rath') typeMultiplier = 0.9;
      else if (train.type === 'Jan Shatabdi') typeMultiplier = 0.8;
      else if (train.type === 'Passenger') typeMultiplier = 0.4;
      
      // Calculate fare for requested class or general fallback
      const classes = ['CC', 'EC', '1A', '2A', '3A', 'SL'];
      const classMultiplier = {
        'SL': 0.4,
        'CC': 1.0,
        '3A': 1.6,
        '2A': 2.3,
        '1A': 3.5,
        'EC': 3.0
      };

      const selectedClass = classType && classMultiplier[classType] ? classType : '3A';
      const fare = Math.round(baseDistance * 1.5 * typeMultiplier * classMultiplier[selectedClass]);

      // Seed random seats and waitlist details
      // Ensure it is deterministic for a train/date combination
      const dateSeed = date ? new Date(date).getDate() : 1;
      const trainSeed = parseInt(train.number);
      const seed = (dateSeed + trainSeed) % 100;

      let availableSeats = 0;
      let waitingList = 0;

      if (seed < 40) {
        availableSeats = Math.max(2, seed);
      } else if (seed < 70) {
        availableSeats = 0;
        waitingList = (seed % 15) + 1;
      } else {
        availableSeats = seed - 20;
      }

      // Tatkal fee
      let finalFare = fare;
      if (quota === 'Tatkal') {
        finalFare += Math.round(fare * 0.15);
        // Decrease availability for Tatkal
        availableSeats = Math.max(0, Math.floor(availableSeats * 0.1));
      }

      return {
        ...train,
        departure_time: depTime,
        arrival_time: arrTime,
        selectedClass,
        selectedQuota: quota || 'General',
        fare: finalFare,
        availableSeats,
        waitingList,
        coach: selectedClass === 'SL' ? 'S1' : selectedClass === '3A' ? 'B1' : selectedClass === '2A' ? 'A1' : 'C1'
      };
    });

    res.json({
      trains: processedResults,
      isAlternative,
      sourceStation: srcStations[0] || { city: source },
      destStation: destStations[0] || { city: destination }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error searching trains.' });
  }
};

// Get details of a single train (with coaches/routes)
exports.getTrainDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const [trains] = await db.query(
      `SELECT t.*, 
              s1.name AS source_name, s1.code AS source_code, s1.city AS source_city,
              s2.name AS dest_name, s2.code AS dest_code, s2.city AS dest_city
       FROM trains t
       JOIN stations s1 ON t.source_station_id = s1.id
       JOIN stations s2 ON t.destination_station_id = s2.id
       WHERE t.id = ?`,
      [id]
    );

    if (trains.length === 0) {
      const trainId = parseInt(id);
      if (trainId >= 10000000) {
        // Decode station IDs from deterministic hash ID
        const index = trainId % 10;
        const destId = Math.floor((trainId - 10000000) / 10) % 1000;
        const srcId = Math.floor((trainId - 10000000) / 10000);

        // Fetch stations
        const [stations] = await db.query('SELECT * FROM stations WHERE id IN (?, ?)', [srcId, destId]);
        const srcStation = stations.find(s => s.id === srcId);
        const destStation = stations.find(s => s.id === destId);

        if (srcStation && destStation) {
          const trainTypes = [
            { type: 'Vande Bharat', speed: 110, multiplier: 2.1 },
            { type: 'Rajdhani', speed: 85, multiplier: 1.8 },
            { type: 'Shatabdi', speed: 80, multiplier: 1.5 },
            { type: 'Tejas', speed: 85, multiplier: 1.7 },
            { type: 'Duronto', speed: 80, multiplier: 1.4 },
            { type: 'Jan Shatabdi', speed: 70, multiplier: 0.8 },
            { type: 'Humsafar', speed: 75, multiplier: 1.1 },
            { type: 'Garib Rath', speed: 70, multiplier: 0.9 }
          ];
          const tInfo = trainTypes[index % trainTypes.length];
          const trainNumber = String(10000 + (srcId * 7 + destId * 3 + index * 13) % 90000);
          const distance = ((srcId * destId * 17) % 950) + 50;

          const departureTimes = [
            '06:15:00', '08:45:00', '11:30:00', '14:20:00', 
            '17:05:00', '19:40:00', '21:15:00', '23:30:00'
          ];
          const depTime = departureTimes[index] || '12:00:00';
          const durationHours = distance / tInfo.speed;
          const hours = Math.floor(durationHours);
          const minutes = Math.floor((durationHours - hours) * 60);
          const durationStr = `${Math.max(1, hours)}h ${minutes}m`;

          const [depH, depM] = depTime.split(':').map(Number);
          const totalMinutes = depH * 60 + depM + Math.round(durationHours * 60);
          const arrH = Math.floor(totalMinutes / 60) % 24;
          const arrM = totalMinutes % 60;
          const arrTime = `${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}:00`;

          const names = [
            `${srcStation.city} - ${destStation.city} ${tInfo.type} Express`,
            `${destStation.city} bound ${tInfo.type}`,
            `${srcStation.city} to ${destStation.city} ${tInfo.type}`,
            `${srcStation.city} - ${destStation.city} Superfast`,
            `${srcStation.city} Premium ${tInfo.type}`,
            `${srcStation.city} Link ${tInfo.type}`
          ];
          const name = names[index % names.length];

          const dynamicTrain = {
            id: trainId,
            number: trainNumber,
            name: name,
            type: tInfo.type,
            source_station_id: srcId,
            destination_station_id: destId,
            departure_time: depTime,
            arrival_time: arrTime,
            duration: durationStr,
            runs_on: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
            source_name: srcStation.name,
            source_code: srcStation.code,
            source_city: srcStation.city,
            dest_name: destStation.name,
            dest_code: destStation.code,
            dest_city: destStation.city
          };

          // Try inserting dynamic train
          try {
            await db.query(
              `INSERT OR IGNORE INTO trains 
               (id, number, name, type, source_station_id, destination_station_id, departure_time, arrival_time, duration, runs_on) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [dynamicTrain.id, dynamicTrain.number, dynamicTrain.name, dynamicTrain.type, dynamicTrain.source_station_id, dynamicTrain.destination_station_id, dynamicTrain.departure_time, dynamicTrain.arrival_time, dynamicTrain.duration, dynamicTrain.runs_on]
            );
          } catch (e) {}

          const coaches = [
            { id: 1, train_id: trainId, coach_number: 'C1', type: 'CC' },
            { id: 2, train_id: trainId, coach_number: 'E1', type: 'EC' },
            { id: 3, train_id: trainId, coach_number: 'A1', type: '2A' },
            { id: 4, train_id: trainId, coach_number: 'B1', type: '3A' }
          ];

          const routes = [
            { id: 1, train_id: trainId, station_id: srcId, stop_number: 1, arrival_time: null, departure_time: depTime, distance: 0, station_name: srcStation.name, station_code: srcStation.code, station_city: srcStation.city },
            { id: 2, train_id: trainId, station_id: destId, stop_number: 2, arrival_time: arrTime, departure_time: null, distance: distance, station_name: destStation.name, station_code: destStation.code, station_city: destStation.city }
          ];

          return res.json({
            train: dynamicTrain,
            coaches,
            routes
          });
        }
      }

      return res.status(404).json({ message: 'Train not found.' });
    }

    const train = trains[0];

    // Fetch coaches
    const [coaches] = await db.query('SELECT * FROM coaches WHERE train_id = ?', [id]);

    // Fetch intermediate routes (stops)
    const [routes] = await db.query(
      `SELECT r.*, s.name AS station_name, s.code AS station_code, s.city AS station_city
       FROM routes r
       JOIN stations s ON r.station_id = s.id
       WHERE r.train_id = ?
       ORDER BY r.stop_number ASC`,
      [id]
    );

    res.json({
      train,
      coaches,
      routes
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving train details.' });
  }
};

// Get Live Train Status
exports.getLiveStatus = async (req, res) => {
  const { trainNumber } = req.params;

  try {
    // Fetch train details by number OR name
    const [trains] = await db.query(
      'SELECT * FROM trains WHERE number = ? OR name LIKE ? LIMIT 1', 
      [trainNumber, `%${trainNumber}%`]
    );
    if (trains.length === 0) {
      return res.status(404).json({ message: 'Train not found' });
    }
    const train = trains[0];

    // Fetch full route
    const [routes] = await db.query(`
      SELECT r.*, s.name, s.code, s.city 
      FROM routes r 
      JOIN stations s ON r.station_id = s.id 
      WHERE r.train_id = ? 
      ORDER BY r.stop_number ASC
    `, [train.id]);

    if (routes.length === 0) {
      return res.status(404).json({ message: 'Route data not found for this train' });
    }

    // Simulate Live Position based on current time
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMin;

    let currentStationIndex = -1;
    let statusMessage = "Train has not started yet.";
    let baseDelay = 0;
    
    // AI Delay Prediction based on Train Type
    let aiDelayPredict = 0;
    let trainType = train.type || 'Express';
    if (trainType.includes('Vande') || trainType.includes('Rajdhani')) {
      baseDelay = Math.floor(Math.random() * 5); // Premium trains rarely delayed
      aiDelayPredict = -Math.floor(Math.random() * 3); // Recovers time
    } else if (trainType.includes('Passenger')) {
      baseDelay = Math.floor(Math.random() * 45) + 15; // High delay
      aiDelayPredict = Math.floor(Math.random() * 20); // Delays increase
    } else {
      baseDelay = Math.floor(Math.random() * 20); // Standard express
      aiDelayPredict = Math.floor(Math.random() * 10) - 5; 
    }

    let delay = Math.max(0, baseDelay + aiDelayPredict);

    let nextStationEta = null;
    let currentSpeed = 0;
    let weatherCondition = "Clear skies ☀️";
    const weathers = ["Clear skies ☀️", "Heavy Rain 🌧️", "Overcast ☁️", "Light Drizzle 🌦️", "Thunderstorm ⛈️", "Mist/Fog 🌫️"];

    for (let i = 0; i < routes.length; i++) {
      const stop = routes[i];
      let arrMins = 0;
      let depMins = 0;

      if (stop.arrival_time) {
        const [ah, am] = stop.arrival_time.split(':').map(Number);
        arrMins = ah * 60 + am;
      }
      if (stop.departure_time) {
        const [dh, dm] = stop.departure_time.split(':').map(Number);
        depMins = dh * 60 + dm;
      }

      // Live logic with ETA and Speed Calculation
      if (stop.departure_time && currentTimeMinutes >= depMins) {
        currentStationIndex = i;
        statusMessage = `Departed from ${stop.name} (${stop.code})`;
        
        // Calculate speed to next station
        if (i < routes.length - 1) {
          const nextStop = routes[i+1];
          const distance = nextStop.distance || 50;
          currentSpeed = Math.floor(Math.random() * 20) + (trainType.includes('Vande') ? 110 : 70);
          
          let nextArrMins = 0;
          if (nextStop.arrival_time) {
            const [nah, nam] = nextStop.arrival_time.split(':').map(Number);
            nextArrMins = nah * 60 + nam + delay;
            const h = Math.floor(nextArrMins / 60) % 24;
            const m = nextArrMins % 60;
            nextStationEta = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          }
          
          weatherCondition = weathers[Math.floor(Math.random() * weathers.length)];
        }

      } else if (stop.arrival_time && currentTimeMinutes >= arrMins && currentTimeMinutes < depMins) {
        currentStationIndex = i;
        statusMessage = `Halted at ${stop.name} (${stop.code})`;
        currentSpeed = 0;
        weatherCondition = weathers[Math.floor(Math.random() * weathers.length)];
        nextStationEta = "Currently Halted";
        break; 
      } else if (currentTimeMinutes < arrMins && currentStationIndex === i - 1) {
        statusMessage = `En route to ${stop.name} (${stop.code})`;
        break;
      }
    }

    if (currentStationIndex === routes.length - 1) {
      statusMessage = `Train has reached destination: ${routes[routes.length - 1].name}`;
      currentSpeed = 0;
      nextStationEta = "Arrived";
    }

    res.json({
      train: {
        number: train.number,
        name: train.name,
        type: train.type
      },
      routes,
      liveStatus: {
        currentStationIndex,
        statusMessage,
        delay,
        currentSpeed,
        weatherCondition,
        nextStationEta,
        aiDelayPredict,
        updatedAt: now.toISOString()
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching live status' });
  }
};
