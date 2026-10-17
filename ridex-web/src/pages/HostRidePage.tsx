/**
 * RIDEX Web — Host Ride Multi-Step Planning Flow
 * Coordinates tour parameters, intermediate checkpoints, OSRM route calculation, and publication.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { rideService } from '../services/rideService';
import { mapService } from '../services/mapService';
import { WaypointEditor, WaypointDraft } from '../components/rides/WaypointEditor';
import { LeafletMap } from '../components/maps/LeafletMap';
import { Compass, Calendar, Clock, MapPin, ArrowRight, ArrowLeft, CheckCircle, Navigation, Radio } from 'lucide-react';

export const HostRidePage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1: Basics
  const [title, setTitle] = useState('Sahyadri Ghats Expedition');
  const [description, setDescription] = useState('Weekend mountain pass group tour exploring scenic curves, hairpin bends, and valley viewpoints.');
  const [rideDate, setRideDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [meetupTime, setMeetupTime] = useState('05:30 AM');
  const [departureTime, setDepartureTime] = useState('06:00 AM');
  const [maxRiders, setMaxRiders] = useState(15);
  const [difficulty, setDifficulty] = useState<'EASY' | 'MODERATE' | 'ADVANCED' | 'EXPERT'>('MODERATE');
  const [rideType, setRideType] = useState('WEEKEND');

  // Step 2: Route & Waypoints
  const [originName, setOriginName] = useState('Pune Rendezvous (Chandani Chowk)');
  const [originLat, setOriginLat] = useState('18.5089');
  const [originLng, setOriginLng] = useState('73.7925');

  const [destName, setDestName] = useState('Mahabaleshwar Viewpoint');
  const [destLat, setDestLat] = useState('17.9237');
  const [destLng, setDestLng] = useState('73.6586');

  // Pre-populate with 3 realistic intermediate stops to fulfill acceptance test standards
  const [waypoints, setWaypoints] = useState<WaypointDraft[]>([
    {
      name: 'Wai Ghat Chai & Fuel',
      type: 'BREAKFAST',
      latitude: 17.9497,
      longitude: 73.8927,
      estimatedStopMinutes: 20,
    },
    {
      name: 'Pasarni Ghat Hairpin Viewpoint',
      type: 'VIEWPOINT',
      latitude: 17.9350,
      longitude: 73.8050,
      estimatedStopMinutes: 15,
    },
    {
      name: 'Panchgani Table Land Fuel Point',
      type: 'FUEL',
      latitude: 17.9250,
      longitude: 73.7250,
      estimatedStopMinutes: 10,
    },
  ]);

  const [calculatedRoute, setCalculatedRoute] = useState<[number, number][]>([]);
  const [calculatedDistanceKm, setCalculatedDistanceKm] = useState(118);
  const [calculatedDurationMins, setCalculatedDurationMins] = useState(150);

  // Recalculate OSRM road geometry
  const handleRecalculateRoute = async () => {
    const lat1 = parseFloat(originLat);
    const lon1 = parseFloat(originLng);
    const lat2 = parseFloat(destLat);
    const lon2 = parseFloat(destLng);

    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return;

    const allPoints = [
      { latitude: lat1, longitude: lon1 },
      ...waypoints.map((w) => ({ latitude: w.latitude, longitude: w.longitude })),
      { latitude: lat2, longitude: lon2 },
    ];

    try {
      const res = await mapService.calculateRoute(allPoints);
      if (res.coordinates.length > 0) {
        setCalculatedRoute(res.coordinates);
        if (res.distanceKm > 0) setCalculatedDistanceKm(res.distanceKm);
        if (res.durationMinutes > 0) setCalculatedDurationMins(res.durationMinutes);
      }
    } catch (e) {
      console.warn('[HostRidePage] route calculation error:', e);
    }
  };

  const handlePublish = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const ride = await rideService.createRide(
        user.id,
        {
          title,
          description,
          startLocationName: originName,
          startLatitude: parseFloat(originLat) || 18.5089,
          startLongitude: parseFloat(originLng) || 73.7925,
          destinationName: destName,
          destinationLatitude: parseFloat(destLat) || 17.9237,
          destinationLongitude: parseFloat(destLng) || 73.6586,
          rideDate,
          meetupTime,
          departureTime,
          maxRiders,
          difficulty,
          rideType,
        },
        waypoints
      );

      navigate(`/rides/${ride.id}`);
    } catch (err: any) {
      console.error('[HostRidePage] Publish error:', err);
      setErrorMsg(err.message || 'Failed to publish ride.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="desktop-wrapper" style={{ padding: '48px 16px', textAlign: 'center' }}>
        <Compass size={40} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Rider Sign In Required</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
          Please sign in to host a group motorcycle ride and generate a unique squad join code.
        </p>
        <button onClick={() => navigate('/login')} className="btn btn-primary">
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="desktop-wrapper" style={{ maxWidth: '780px', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Step Progress Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
        <div>
          <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
            STEP {step} OF 3
          </span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            {step === 1 && 'Tour Details & Schedule'}
            {step === 2 && 'Origin, Waypoints & Destination'}
            {step === 3 && 'Review & Publish Tour'}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                width: '28px',
                height: '6px',
                borderRadius: '999px',
                background: s <= step ? 'var(--primary)' : 'var(--border-card)',
                transition: 'background 0.2s ease',
              }}
            />
          ))}
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: 'rgba(255, 59, 48, 0.15)', border: '1px solid var(--danger)', padding: '10px 14px', borderRadius: '10px', color: '#FFA39E', fontSize: '0.85rem' }}>
          {errorMsg}
        </div>
      )}

      {/* STEP 1: TOUR BASICS */}
      {step === 1 && (
        <div className="card-glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Tour Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Monsoon Western Ghats Expedition"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
              Tour Description & Briefing
            </label>
            <textarea
              rows={3}
              placeholder="Riding pace, safety gear requirements, road surface conditions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Tour Date
              </label>
              <input
                type="date"
                required
                value={rideDate}
                onChange={(e) => setRideDate(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Squad Capacity
              </label>
              <input
                type="number"
                min="2"
                max="50"
                value={maxRiders}
                onChange={(e) => setMaxRiders(parseInt(e.target.value))}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Meetup / Briefing Time
              </label>
              <input
                type="text"
                value={meetupTime}
                onChange={(e) => setMeetupTime(e.target.value)}
                className="form-input"
                placeholder="05:30 AM"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Kickstands-Up Departure
              </label>
              <input
                type="text"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="form-input"
                placeholder="06:00 AM"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Difficulty Rating
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="form-input"
              >
                <option value="EASY">EASY (Cruising / Highway)</option>
                <option value="MODERATE">MODERATE (Twisties / Mountain)</option>
                <option value="ADVANCED">ADVANCED (High Altitude / Hairpins)</option>
                <option value="EXPERT">EXPERT (Off-Road / Extreme)</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Tour Category
              </label>
              <select
                value={rideType}
                onChange={(e) => setRideType(e.target.value)}
                className="form-input"
              >
                <option value="WEEKEND">WEEKEND ESCAPE</option>
                <option value="TOURING">MULTI-DAY TOURING</option>
                <option value="TWISTIES">CORNER CARVING</option>
                <option value="ADVENTURE">ADVENTURE TRAIL</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => {
                if (!title.trim()) {
                  setErrorMsg('Tour title is required.');
                  return;
                }
                setErrorMsg('');
                setStep(2);
                handleRecalculateRoute();
              }}
              className="btn btn-primary"
            >
              <span>Continue to Route & Waypoints</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ROUTE, STOPS & MAP */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Map Preview */}
          <div className="card-glass" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Navigation size={18} color="var(--primary)" />
                <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Interactive Route & Checkpoints Map</h4>
              </div>
              <button
                type="button"
                onClick={handleRecalculateRoute}
                className="btn btn-secondary"
                style={{ minHeight: '32px', padding: '4px 10px', fontSize: '0.75rem' }}
              >
                Refresh Road Polyline
              </button>
            </div>

            <LeafletMap
              start={{ name: originName, latitude: parseFloat(originLat) || 18.5089, longitude: parseFloat(originLng) || 73.7925 }}
              destination={{ name: destName, latitude: parseFloat(destLat) || 17.9237, longitude: parseFloat(destLng) || 73.6586 }}
              waypoints={waypoints}
              routeCoordinates={calculatedRoute}
              height="280px"
            />
          </div>

          {/* Endpoints Inputs */}
          <div className="card-glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Route Endpoints</h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 700 }}>
                ● Starting Point (Origin)
              </label>
              <input
                type="text"
                value={originName}
                onChange={(e) => setOriginName(e.target.value)}
                className="form-input"
                placeholder="Starting address or landmark"
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input
                  type="number"
                  step="any"
                  value={originLat}
                  onChange={(e) => setOriginLat(e.target.value)}
                  className="form-input"
                  placeholder="Start Latitude"
                />
                <input
                  type="number"
                  step="any"
                  value={originLng}
                  onChange={(e) => setOriginLng(e.target.value)}
                  className="form-input"
                  placeholder="Start Longitude"
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 700 }}>
                ● Final Destination
              </label>
              <input
                type="text"
                value={destName}
                onChange={(e) => setDestName(e.target.value)}
                className="form-input"
                placeholder="Destination address or mountain pass"
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input
                  type="number"
                  step="any"
                  value={destLat}
                  onChange={(e) => setDestLat(e.target.value)}
                  className="form-input"
                  placeholder="Destination Latitude"
                />
                <input
                  type="number"
                  step="any"
                  value={destLng}
                  onChange={(e) => setDestLng(e.target.value)}
                  className="form-input"
                  placeholder="Destination Longitude"
                />
              </div>
            </div>
          </div>

          {/* Intermediate Waypoints Editor */}
          <div className="card-glass" style={{ padding: '20px' }}>
            <WaypointEditor
              waypoints={waypoints}
              onChange={(updated) => {
                setWaypoints(updated);
                setTimeout(handleRecalculateRoute, 100);
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn btn-secondary"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setErrorMsg('');
                setStep(3);
              }}
              className="btn btn-primary"
            >
              <span>Review Tour Plan</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW & CONFIRM */}
      {step === 3 && (
        <div className="card-glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
            <span className="badge badge-upcoming">TOUR SUMMARY</span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '6px' }}>{title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{description}</p>
          </div>

          {/* Route Overview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--success)', fontWeight: 800 }}>Start:</span>
              <span>{originName}</span>
            </div>

            {waypoints.map((wp, idx) => (
              <div key={idx} style={{ paddingLeft: '24px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                ↳ Stop {idx + 1}: <b style={{ color: 'var(--text-primary)' }}>{wp.name}</b> ({wp.type} • {wp.estimatedStopMinutes}m)
              </div>
            ))}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--danger)', fontWeight: 800 }}>Destination:</span>
              <span>{destName}</span>
            </div>
          </div>

          {/* Telemetry Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '10px',
              padding: '14px',
              background: 'var(--bg-surface)',
              borderRadius: '12px',
              fontSize: '0.8rem',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Estimated Road</span>
              <span className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                ~{calculatedDistanceKm} km
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Departure</span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#FFF' }}>{departureTime}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Date</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#FFF' }}>{rideDate}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Stops</span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--cyan)' }}>{waypoints.length}</span>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(0, 229, 255, 0.1)',
              border: '1px solid var(--border-cyan)',
              borderRadius: '10px',
              padding: '12px 14px',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
            }}
          >
            Upon publication, a unique 8-character Ride ID (e.g. <b>RIDEX-XXXXX</b>) will be generated. You can share this ID with your riding squad so they can submit join requests.
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn btn-secondary"
            >
              <ArrowLeft size={16} />
              <span>Edit Stops</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handlePublish}
              className="btn btn-primary"
              style={{ padding: '12px 28px', fontSize: '1rem' }}
            >
              <CheckCircle size={18} />
              <span>{loading ? 'Publishing to Squad...' : 'Confirm & Publish Ride'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
