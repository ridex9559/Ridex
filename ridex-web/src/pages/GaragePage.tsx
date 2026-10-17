/**
 * RIDEX Web — Motorcycle Garage Screen
 * Digital garage for managing bikes, fuel telemetry specs, mileage stats, and primary ride flag.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { garageService } from '../services/garageService';
import { useAuthStore } from '../stores/useAuthStore';
import { Motorcycle } from '../types';
import { Warehouse, Plus, Star, Trash2, Fuel, Gauge, ShieldCheck, AlertCircle } from 'lucide-react';

export const GaragePage: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [manufacturer, setManufacturer] = useState('Royal Enfield');
  const [model, setModel] = useState('Himalayan 450');
  const [year, setYear] = useState(2024);
  const [engineCc, setEngineCc] = useState(452);
  const [registration, setRegistration] = useState('MH 12 RX 4500');
  const [fuelCapacity, setFuelCapacity] = useState(17);
  const [avgMileage, setAvgMileage] = useState(30);
  const [isPrimary, setIsPrimary] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: motorcycles = [], isLoading } = useQuery({
    queryKey: ['motorcycles', user?.id],
    queryFn: () => (user?.id ? garageService.getMotorcycles(user.id) : Promise.resolve([])),
    enabled: !!user?.id,
  });

  const addMutation = useMutation({
    mutationFn: (bike: Partial<Motorcycle>) => garageService.addMotorcycle(user!.id, bike),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['motorcycles', user?.id] });
      setShowAddModal(false);
      setErrorMsg('');
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to add motorcycle.');
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

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!manufacturer.trim() || !model.trim()) {
      setErrorMsg('Manufacturer and model are required.');
      return;
    }

    addMutation.mutate({
      manufacturer: manufacturer.trim(),
      model: model.trim(),
      year: Number(year),
      engineCc: Number(engineCc),
      registrationNumber: registration.trim(),
      fuelTankCapacityL: Number(fuelCapacity),
      avgMileageKmpl: Number(avgMileage),
      isPrimary,
    });
  };

  if (!user) {
    return (
      <div className="desktop-wrapper" style={{ padding: '48px 16px', textAlign: 'center' }}>
        <Warehouse size={40} color="var(--primary)" style={{ margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Rider Sign In Required</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
          Please sign in to view and manage your digital garage.
        </p>
        <a href="/login" className="btn btn-primary" style={{ display: 'inline-flex' }}>
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="desktop-wrapper" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Digital Garage</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Configure your motorcycles, fuel tank volume, and calculated touring range.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
          style={{ minHeight: '42px', padding: '8px 16px', fontSize: '0.9rem' }}
        >
          <Plus size={16} />
          <span>Add Motorcycle</span>
        </button>
      </div>

      {/* Add Motorcycle Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
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
              maxWidth: '480px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Add to Garage</h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
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
                  padding: '8px 12px',
                  color: '#FFA39E',
                  fontSize: '0.85rem',
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Brand / Make
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KTM, BMW, Yamaha"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Model
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 390 Adventure"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Year
                  </label>
                  <input
                    type="number"
                    min="1980"
                    max="2030"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Displacement (cc)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="2500"
                    value={engineCc}
                    onChange={(e) => setEngineCc(parseInt(e.target.value))}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  License Registration Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. MH 12 AB 1234"
                  value={registration}
                  onChange={(e) => setRegistration(e.target.value.toUpperCase())}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Fuel Tank Capacity (L)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="3"
                    max="40"
                    value={fuelCapacity}
                    onChange={(e) => setFuelCapacity(parseFloat(e.target.value))}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Avg Mileage (km/L)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="5"
                    max="80"
                    value={avgMileage}
                    onChange={(e) => setAvgMileage(parseFloat(e.target.value))}
                    className="form-input"
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Set as primary motorcycle</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending}
                  className="btn btn-primary"
                >
                  {addMutation.isPending ? 'Saving...' : 'Add Motorcycle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Motorcycle Cards */}
      {isLoading ? (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading your garage...
        </div>
      ) : motorcycles.length === 0 ? (
        <div
          className="card-glass"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Warehouse size={40} color="var(--primary)" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Garage is Empty</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '400px' }}>
            Add your primary motorcycle so RIDEX can calculate tour fuel stops and mileage telemetry.
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Add First Motorcycle</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {motorcycles.map((bike) => {
            const safeRangeKm = Math.round(bike.fuelTankCapacityL * bike.avgMileageKmpl * 0.9);

            return (
              <div
                key={bike.id}
                className="card-glass"
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  border: bike.isPrimary ? '1px solid var(--border-active)' : '1px solid var(--border-card)',
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                      {bike.manufacturer} {bike.model}
                    </h3>
                    <div className="mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {bike.registrationNumber || `${bike.year} • ${bike.engineCc}cc`}
                    </div>
                  </div>

                  {bike.isPrimary ? (
                    <span className="badge badge-upcoming" style={{ background: 'rgba(255, 107, 0, 0.15)', color: 'var(--primary)' }}>
                      <Star size={12} fill="var(--primary)" />
                      <span>PRIMARY</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => setPrimaryMutation.mutate(bike.id)}
                      className="btn btn-secondary"
                      style={{ minHeight: '28px', padding: '2px 8px', fontSize: '0.75rem' }}
                    >
                      Make Primary
                    </button>
                  )}
                </div>

                {/* Telemetry Metrics */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    padding: '10px 12px',
                    background: 'var(--bg-surface)',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Engine</span>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {bike.engineCc} cc
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Tank</span>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--gold)' }}>
                      {bike.fuelTankCapacityL} L
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block' }}>Mileage</span>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--success)' }}>
                      {bike.avgMileageKmpl} km/L
                    </span>
                  </div>
                </div>

                {/* Calculated Safe Range */}
                <div
                  style={{
                    background: 'rgba(0, 229, 255, 0.1)',
                    border: '1px solid rgba(0, 229, 255, 0.25)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cyan)' }}>
                    <Fuel size={14} />
                    <span>Safe Touring Range (10% res.):</span>
                  </div>
                  <span className="mono" style={{ fontWeight: 800, color: '#FFF' }}>
                    ~{safeRangeKm} km
                  </span>
                </div>

                {/* Delete button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${bike.manufacturer} ${bike.model} from garage?`)) {
                        deleteMutation.mutate(bike.id);
                      }
                    }}
                    className="btn btn-secondary"
                    style={{ minHeight: '32px', padding: '4px 10px', fontSize: '0.75rem', color: 'var(--danger)' }}
                  >
                    <Trash2 size={12} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
