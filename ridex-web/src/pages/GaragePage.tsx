/**
 * RIDEX Web — Motorcycle Garage Screen
 * Digital garage for managing bikes, fuel telemetry specs, mileage stats, and primary ride flag.
 * Features garage-first onboarding ("Add My Motorcycle" vs "I Don't Have a Bike"),
 * rich brand/category chips, and complete motorcycle fleet management.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { garageService } from '../services/garageService';
import { useAuthStore } from '../stores/useAuthStore';
import { Motorcycle } from '../types';
import {
  Warehouse,
  Plus,
  Star,
  Trash2,
  Fuel,
  Gauge,
  Bike,
  Compass,
  ArrowRight,
  Check,
  Edit2,
  Sparkles,
} from 'lucide-react';

const POPULAR_BRANDS = [
  'Royal Enfield',
  'KTM',
  'BMW Motorrad',
  'Triumph',
  'Ducati',
  'Kawasaki',
  'Honda',
  'Yamaha',
  'Harley-Davidson',
  'Suzuki',
  'Bajaj',
  'TVS',
];

const CATEGORIES = [
  'ADVENTURE',
  'TOURING',
  'SPORT',
  'NAKED',
  'CRUISER',
  'SUPERMOTO',
  'CAFE_RACER',
  'COMMUTER',
];

export const GaragePage: React.FC = () => {
  const { user, session } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBike, setEditingBike] = useState<Motorcycle | null>(null);

  // Form states
  const [manufacturer, setManufacturer] = useState('Royal Enfield');
  const [category, setCategory] = useState('ADVENTURE');
  const [model, setModel] = useState('');
  const [variant, setVariant] = useState('');
  const [year, setYear] = useState(2024);
  const [color, setColor] = useState('Black');
  const [engineCc, setEngineCc] = useState(450);
  const [registration, setRegistration] = useState('');
  const [fuelCapacity, setFuelCapacity] = useState(17);
  const [avgMileage, setAvgMileage] = useState(28);
  const [isPrimary, setIsPrimary] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Onboarding state
  const [onboardingChoice, setOnboardingChoiceState] = useState<string | null>(() => {
    if (!user) return null;
    return garageService.getOnboardingChoice(user.id, session?.user?.user_metadata);
  });

  const { data: motorcycles = [], isLoading } = useQuery({
    queryKey: ['motorcycles', user?.id],
    queryFn: () => (user?.id ? garageService.getMotorcycles(user.id) : Promise.resolve([])),
    enabled: !!user?.id,
  });

  const addMutation = useMutation({
    mutationFn: (bike: Partial<Motorcycle>) => garageService.addMotorcycle(user!.id, bike),
    onSuccess: async () => {
      await garageService.setOnboardingChoice(user!.id, 'completed');
      setOnboardingChoiceState('completed');
      queryClient.invalidateQueries({ queryKey: ['motorcycles', user?.id] });
      setShowAddModal(false);
      resetForm();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to add motorcycle.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Motorcycle> }) =>
      garageService.updateMotorcycle(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motorcycles', user?.id] });
      setEditingBike(null);
      resetForm();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to update motorcycle.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => garageService.deleteMotorcycle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motorcycles', user?.id] });
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: (id: string) => garageService.setPrimary(user!.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motorcycles', user?.id] });
    },
  });

  const resetForm = () => {
    setManufacturer('Royal Enfield');
    setCategory('ADVENTURE');
    setModel('');
    setVariant('');
    setYear(2024);
    setColor('Black');
    setEngineCc(450);
    setRegistration('');
    setFuelCapacity(17);
    setAvgMileage(28);
    setIsPrimary(true);
    setErrorMsg('');
  };

  const handleEditClick = (bike: Motorcycle) => {
    setEditingBike(bike);
    setManufacturer(bike.manufacturer);
    setCategory(bike.category || 'ADVENTURE');
    setModel(bike.model);
    setVariant(bike.variant || '');
    setYear(bike.year);
    setColor(bike.color || 'Black');
    setEngineCc(bike.engineCc || bike.displacementCc || 450);
    setRegistration(bike.registrationNumber || '');
    setFuelCapacity(bike.fuelTankCapacityL || 15);
    setAvgMileage(bike.avgMileageKmpl || 25);
    setIsPrimary(bike.isPrimary);
    setShowAddModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!manufacturer.trim() || !model.trim()) {
      setErrorMsg('Manufacturer brand and model name are required.');
      return;
    }

    if (editingBike) {
      updateMutation.mutate({
        id: editingBike.id,
        updates: {
          manufacturer: manufacturer.trim(),
          model: model.trim(),
          year: Number(year),
          engineCc: Number(engineCc),
          registrationNumber: registration.trim(),
          fuelTankCapacityL: Number(fuelCapacity),
          avgMileageKmpl: Number(avgMileage),
          color: color.trim(),
          category,
          isPrimary,
        },
      });
    } else {
      addMutation.mutate({
        manufacturer: manufacturer.trim(),
        model: model.trim(),
        year: Number(year),
        engineCc: Number(engineCc),
        registrationNumber: registration.trim(),
        fuelTankCapacityL: Number(fuelCapacity),
        avgMileageKmpl: Number(avgMileage),
        color: color.trim(),
        category,
        isPrimary,
      });
    }
  };

  const handleNoBikeChoice = async () => {
    if (!user) return;
    await garageService.setOnboardingChoice(user.id, 'no_bike');
    setOnboardingChoiceState('no_bike');
  };

  // 1. Unauthenticated view
  if (!user) {
    return (
      <div
        className="desktop-wrapper"
        style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
          textAlign: 'center',
        }}
      >
        <div className="card-glass" style={{ maxWidth: '440px', padding: '36px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-bright))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px var(--primary-glow)',
            }}
          >
            <Warehouse size={32} color="#FFF" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Rider Sign In Required</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Please sign in to access your digital motorcycle fleet and calibrated tour telemetry.
          </p>
          <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ width: '100%', minHeight: '48px' }}>
            Sign In to Cockpit
          </button>
        </div>
      </div>
    );
  }

  // 2. Initial Onboarding Flow (No bikes registered & no previous choice)
  const needsOnboarding = motorcycles.length === 0 && !onboardingChoice && !showAddModal;

  return (
    <div
      className="desktop-wrapper"
      style={{
        padding: '24px 16px 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        maxWidth: '1000px',
      }}
    >
      {/* =========================================================================
          ONBOARDING HERO BANNER (Shown when new rider has no bike and no choice yet)
          ========================================================================= */}
      {needsOnboarding && (
        <div
          className="card-glass"
          style={{
            padding: '32px 20px',
            border: '1px solid var(--border-active)',
            background: 'linear-gradient(180deg, rgba(26, 34, 52, 0.95) 0%, rgba(18, 23, 34, 0.98) 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '20px',
            boxShadow: '0 12px 36px -10px var(--primary-glow)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, var(--primary), #FFA066)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 24px var(--primary-glow)',
            }}
          >
            <Bike size={34} color="#FFFFFF" />
          </div>

          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '9999px',
                background: 'rgba(255, 107, 0, 0.15)',
                color: 'var(--primary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              <Sparkles size={14} />
              <span>Rider Setup</span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.2 }}>
              Welcome to your RIDEX Garage
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '480px', margin: '6px auto 0' }}>
              Let's set up your ride. Register your motorcycle for telemetry and fuel calculations, or explore as a co-rider.
            </p>
          </div>

          {/* Two Clear Choices */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
              width: '100%',
              maxWidth: '680px',
              marginTop: '8px',
            }}
          >
            {/* Option A: Add My Motorcycle */}
            <div
              className="card-elevated card-interactive"
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              style={{
                padding: '24px 20px',
                textAlign: 'left',
                border: '1.5px solid var(--border-active)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255, 107, 0, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={20} color="var(--primary)" />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Add My Motorcycle</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.45 }}>
                  Save your brand, tank size, and mileage specs so RIDEX can calculate tour fuel stops and telemetry.
                </p>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', minHeight: '44px', fontSize: '0.9rem' }}>
                <span>Configure Motorcycle</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Option B: I Don't Have a Bike */}
            <div
              className="card-elevated card-interactive"
              onClick={handleNoBikeChoice}
              style={{
                padding: '24px 20px',
                textAlign: 'left',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(0, 229, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Compass size={20} color="var(--cyan)" />
                  </div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>I Don't Have a Bike</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.45 }}>
                  Join tours as a co-rider, navigator, or pillion. You can explore all rides and add a motorcycle later anytime.
                </p>
              </div>
              <button
                className="btn btn-secondary"
                style={{ width: '100%', minHeight: '44px', fontSize: '0.9rem', borderColor: 'var(--border-cyan)', color: 'var(--cyan)' }}
              >
                <span>Continue without Bike</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          REGULAR GARAGE HEADER (Fleet Counter & Add Button)
          ========================================================================= */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Digital Garage</h1>
            {motorcycles.length > 0 && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  background: 'rgba(255, 107, 0, 0.18)',
                  color: 'var(--primary)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {motorcycles.length} {motorcycles.length === 1 ? 'Machine' : 'Machines'}
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Configure your tour machine, fuel volume, and calibrated telemetry range.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setEditingBike(null);
            setShowAddModal(true);
          }}
          className="btn btn-primary"
          style={{ minHeight: '44px', padding: '8px 18px', fontSize: '0.9rem', borderRadius: '12px' }}
        >
          <Plus size={18} />
          <span>Add Motorcycle</span>
        </button>
      </div>

      {/* =========================================================================
          MOTORCYCLE REGISTRATION / EDIT MODAL
          ========================================================================= */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            className="card-glass"
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxHeight: '92vh',
              overflowY: 'auto',
              border: '1px solid var(--border-active)',
            }}
          >
            {/* Modal Title */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bike size={22} color="var(--primary)" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                  {editingBike ? 'Edit Motorcycle Specs' : 'Register New Machine'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingBike(null);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div
                style={{
                  background: 'rgba(255, 59, 48, 0.15)',
                  border: '1px solid var(--danger)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: '#FFA39E',
                  fontSize: '0.85rem',
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Brand Selector Chips */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 700, letterSpacing: '0.04em' }}>
                  SELECT BRAND / MANUFACTURER
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '110px', overflowY: 'auto' }}>
                  {POPULAR_BRANDS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setManufacturer(b)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: manufacturer === b ? '1px solid var(--primary)' : '1px solid var(--border-card)',
                        background: manufacturer === b ? 'var(--primary)' : 'var(--bg-surface)',
                        color: manufacturer === b ? '#FFF' : 'var(--text-secondary)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Selector Chips */}
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 700, letterSpacing: '0.04em' }}>
                  CATEGORY
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: category === cat ? '1px solid var(--cyan)' : '1px solid var(--border-card)',
                        background: category === cat ? 'rgba(0, 229, 255, 0.2)' : 'var(--bg-card)',
                        color: category === cat ? 'var(--cyan)' : 'var(--text-muted)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {cat.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model & Variant */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Model Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Himalayan 450, Duke 390"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Variant / Trim
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rally, Standard"
                    value={variant}
                    onChange={(e) => setVariant(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Year & Displacement */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Year
                  </label>
                  <input
                    type="number"
                    min="1980"
                    max="2030"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value) || 2024)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Displacement (CC)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="2500"
                    value={engineCc}
                    onChange={(e) => setEngineCc(parseInt(e.target.value) || 400)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Registration & Color */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Registration Plate (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MH 12 AB 1234"
                    value={registration}
                    onChange={(e) => setRegistration(e.target.value.toUpperCase())}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Color
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Black / Orange"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Fuel Tank & Mileage (Telemetry) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Tank Capacity (Liters)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="3"
                    max="45"
                    value={fuelCapacity}
                    onChange={(e) => setFuelCapacity(parseFloat(e.target.value) || 15)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Avg Mileage (KM/L)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="5"
                    max="80"
                    value={avgMileage}
                    onChange={(e) => setAvgMileage(parseFloat(e.target.value) || 25)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Primary Motorcycle Checkbox */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '6px 0' }}>
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  Set as primary active touring machine
                </span>
              </label>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingBike(null);
                  }}
                  className="btn btn-secondary"
                  style={{ minHeight: '44px', padding: '8px 18px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending || updateMutation.isPending}
                  className="btn btn-primary"
                  style={{ minHeight: '44px', padding: '8px 24px', fontWeight: 700 }}
                >
                  <Check size={18} />
                  <span>
                    {editingBike
                      ? updateMutation.isPending
                        ? 'Updating...'
                        : 'Update Machine'
                      : addMutation.isPending
                      ? 'Saving...'
                      : 'Add to Garage'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          GARAGE CONTENT (FLEET LIST OR NO-BIKE EXPLORER STATE)
          ========================================================================= */}
      {isLoading ? (
        <div className="card-glass" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <Bike size={20} className="pulse-radar" color="var(--primary)" />
            <span>Loading your digital garage...</span>
          </div>
        </div>
      ) : motorcycles.length === 0 ? (
        /* Polished Empty / Explorer State */
        <div
          className="card-glass"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            background: 'linear-gradient(180deg, rgba(26, 34, 52, 0.75) 0%, rgba(18, 23, 34, 0.9) 100%)',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '24px',
              background: 'rgba(255, 107, 0, 0.12)',
              border: '1px solid rgba(255, 107, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Compass size={36} color="var(--primary)" />
          </div>

          <div>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '9999px',
                background: 'rgba(0, 229, 255, 0.15)',
                color: 'var(--cyan)',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              Explorer & Navigator Pass
            </span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Welcome to the RIDEX Fleet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '460px', margin: '6px auto 0', lineHeight: 1.5 }}>
              You haven't registered a motorcycle yet, but you have complete access to explore tours, connect with ride squads, and navigate mountain routes.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
            <button
              onClick={() => {
                resetForm();
                setEditingBike(null);
                setShowAddModal(true);
              }}
              className="btn btn-primary"
              style={{ minHeight: '46px', padding: '10px 22px' }}
            >
              <Plus size={18} />
              <span>Add a Motorcycle</span>
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-secondary"
              style={{ minHeight: '46px', padding: '10px 22px' }}
            >
              <Compass size={18} />
              <span>Explore Group Rides</span>
            </button>
          </div>
        </div>
      ) : (
        /* Registered Fleet Cards */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {motorcycles.map((bike) => {
              const safeRangeKm = Math.round(bike.fuelTankCapacityL * bike.avgMileageKmpl * 0.9);

              return (
                <div
                  key={bike.id}
                  className="card-glass"
                  style={{
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    border: bike.isPrimary ? '1.5px solid var(--border-active)' : '1px solid var(--border-card)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Primary Machine Glow Highlight */}
                  {bike.isPrimary && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: 'linear-gradient(90deg, var(--primary), var(--primary-bright))',
                      }}
                    />
                  )}

                  {/* Card Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: 'var(--cyan)',
                            background: 'rgba(0, 229, 255, 0.1)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          {bike.category || 'ADVENTURE'}
                        </span>
                        {bike.registrationNumber && (
                          <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {bike.registrationNumber}
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, lineHeight: 1.2 }}>
                        {bike.manufacturer} {bike.model}
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {bike.year} • {bike.color || 'Dark'}
                      </div>
                    </div>

                    {/* Primary Badge or Select Button */}
                    {bike.isPrimary ? (
                      <span
                        className="badge"
                        style={{
                          background: 'rgba(255, 107, 0, 0.15)',
                          color: 'var(--primary)',
                          border: '1px solid rgba(255, 107, 0, 0.4)',
                          padding: '4px 10px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Star size={12} fill="var(--primary)" />
                        <span>PRIMARY</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => setPrimaryMutation.mutate(bike.id)}
                        className="btn btn-secondary"
                        style={{ minHeight: '30px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700 }}
                      >
                        Set Active
                      </button>
                    )}
                  </div>

                  {/* Telemetry Metrics Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                      padding: '12px',
                      background: 'var(--bg-surface)',
                      borderRadius: '12px',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                        Engine
                      </span>
                      <span className="mono" style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {bike.engineCc || bike.displacementCc} cc
                      </span>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                        Fuel Tank
                      </span>
                      <span className="mono" style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--gold)' }}>
                        {bike.fuelTankCapacityL} L
                      </span>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                        Mileage
                      </span>
                      <span className="mono" style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--success)' }}>
                        {bike.avgMileageKmpl} km/l
                      </span>
                    </div>
                  </div>

                  {/* Calibrated Safe Range Highlight */}
                  <div
                    style={{
                      background: 'rgba(0, 229, 255, 0.08)',
                      border: '1px solid rgba(0, 229, 255, 0.22)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cyan)' }}>
                      <Fuel size={16} />
                      <span style={{ fontWeight: 600 }}>Safe Touring Range:</span>
                    </div>
                    <span className="mono" style={{ fontWeight: 800, color: '#FFFFFF', fontSize: '0.95rem' }}>
                      ~{safeRangeKm} km
                    </span>
                  </div>

                  {/* Card Action Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                    <button
                      onClick={() => handleEditClick(bike)}
                      className="btn btn-secondary"
                      style={{ minHeight: '34px', padding: '4px 12px', fontSize: '0.8rem', gap: '6px' }}
                    >
                      <Edit2 size={13} />
                      <span>Edit Specs</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Remove ${bike.manufacturer} ${bike.model} from your garage?`)) {
                          deleteMutation.mutate(bike.id);
                        }
                      }}
                      className="btn btn-secondary"
                      style={{ minHeight: '34px', padding: '4px 10px', fontSize: '0.8rem', color: 'var(--danger)' }}
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Touring Readiness Action Banner */}
          <div
            className="card-glass"
            style={{
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: 'linear-gradient(180deg, rgba(26, 34, 52, 0.7) 0%, rgba(18, 23, 34, 0.85) 100%)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Gauge size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Tour Readiness Calibrated</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.45 }}>
              Your active machine's fuel volume is linked with route checkpoint waypoints. When hosting a mountain ride, refuel stops are suggested within your calculated safe range.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
              <button onClick={() => navigate('/host')} className="btn btn-primary" style={{ minHeight: '42px', padding: '8px 18px', fontSize: '0.88rem' }}>
                <Plus size={16} />
                <span>Plan Ride with this Bike</span>
              </button>
              <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ minHeight: '42px', padding: '8px 18px', fontSize: '0.88rem' }}>
                <Compass size={16} />
                <span>Browse Active Rides</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GaragePage;
