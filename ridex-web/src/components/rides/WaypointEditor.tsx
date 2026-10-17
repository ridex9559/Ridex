/**
 * RIDEX Web — Intermediate Waypoint & Checkpoint Editor
 * Add, reorder, configure, and remove multi-stop tour waypoints.
 * Strictly maintains orderIndex sequence for multi-rider route parity.
 */

import React, { useState } from 'react';
import { CheckpointType } from '../../types';
import { ArrowUp, ArrowDown, Trash2, Plus, Coffee, Fuel, Camera, Users } from 'lucide-react';

export interface WaypointDraft {
  name: string;
  type: CheckpointType;
  latitude: number;
  longitude: number;
  estimatedStopMinutes: number;
}

interface WaypointEditorProps {
  waypoints: WaypointDraft[];
  onChange: (waypoints: WaypointDraft[]) => void;
}

const CHECKPOINT_TYPES: { type: CheckpointType; label: string; icon: any; color: string }[] = [
  { type: 'BREAKFAST', label: 'Food / Chai', icon: Coffee, color: '#FFB020' },
  { type: 'FUEL', label: 'Fuel Stop', icon: Fuel, color: '#FF6B00' },
  { type: 'VIEWPOINT', label: 'Scenic View', icon: Camera, color: '#00E5FF' },
  { type: 'REGROUP', label: 'Regroup Point', icon: Users, color: '#00E676' },
];

export const WaypointEditor: React.FC<WaypointEditorProps> = ({ waypoints, onChange }) => {
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<CheckpointType>('REGROUP');
  const [newLat, setNewLat] = useState('18.6000');
  const [newLng, setNewLng] = useState('73.7000');
  const [newMinutes, setNewMinutes] = useState(15);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAdd = () => {
    if (!newName.trim()) return;
    const lat = parseFloat(newLat);
    const lng = parseFloat(newLng);
    if (isNaN(lat) || isNaN(lng)) return;

    const newWp: WaypointDraft = {
      name: newName.trim(),
      type: newType,
      latitude: lat,
      longitude: lng,
      estimatedStopMinutes: newMinutes,
    };

    onChange([...waypoints, newWp]);
    setNewName('');
    setShowAddForm(false);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...waypoints];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    onChange(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === waypoints.length - 1) return;
    const updated = [...waypoints];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    const updated = waypoints.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Intermediate Stops & Waypoints</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Sequential route checkpoints ({waypoints.length} added)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-secondary"
          style={{ minHeight: '38px', padding: '6px 14px', fontSize: '0.85rem' }}
        >
          <Plus size={16} />
          <span>Add Stop</span>
        </button>
      </div>

      {/* Add Form Drawer */}
      {showAddForm && (
        <div
          className="card-glass"
          style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border-active)' }}
        >
          <h5 style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>Add Sequential Stop</h5>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Stop / Landmark Name
            </label>
            <input
              type="text"
              placeholder="e.g. Wai Ghat Cafe or Lonavala Pass"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={newLat}
                onChange={(e) => setNewLat(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={newLng}
                onChange={(e) => setNewLng(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Stop Category
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {CHECKPOINT_TYPES.map((ct) => {
                const Icon = ct.icon;
                const isSelected = newType === ct.type;
                return (
                  <button
                    key={ct.type}
                    type="button"
                    onClick={() => setNewType(ct.type)}
                    className="card-interactive"
                    style={{
                      background: isSelected ? 'rgba(255, 107, 0, 0.2)' : 'var(--bg-card)',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-card)'}`,
                      padding: '8px 12px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                    }}
                  >
                    <Icon size={14} color={ct.color} />
                    <span>{ct.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Planned Stop Duration: {newMinutes} mins
            </label>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={newMinutes}
              onChange={(e) => setNewMinutes(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary)' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn btn-secondary"
              style={{ minHeight: '38px', padding: '6px 14px', fontSize: '0.85rem' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="btn btn-primary"
              style={{ minHeight: '38px', padding: '6px 14px', fontSize: '0.85rem' }}
            >
              Confirm Stop
            </button>
          </div>
        </div>
      )}

      {/* Waypoints List */}
      {waypoints.length === 0 ? (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            background: 'var(--bg-surface)',
            border: '1px dashed var(--border-card)',
            borderRadius: '12px',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
          }}
        >
          No intermediate stops added yet. The route will proceed directly from Origin to Destination.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {waypoints.map((wp, idx) => {
            const config = CHECKPOINT_TYPES.find((c) => c.type === wp.type) || CHECKPOINT_TYPES[3];
            const Icon = config.icon;
            return (
              <div
                key={idx}
                className="card-glass"
                style={{
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: config.color,
                      color: '#080A0F',
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {wp.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon size={12} color={config.color} />
                      <span>{config.label}</span>
                      <span>•</span>
                      <span>{wp.estimatedStopMinutes}m stop</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => handleMoveUp(idx)}
                    disabled={idx === 0}
                    className="btn btn-secondary"
                    style={{ minHeight: '32px', width: '32px', padding: 0 }}
                    title="Move up"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(idx)}
                    disabled={idx === waypoints.length - 1}
                    className="btn btn-secondary"
                    style={{ minHeight: '32px', width: '32px', padding: 0 }}
                    title="Move down"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="btn btn-secondary"
                    style={{ minHeight: '32px', width: '32px', padding: 0, color: 'var(--danger)' }}
                    title="Delete stop"
                  >
                    <Trash2 size={14} />
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
