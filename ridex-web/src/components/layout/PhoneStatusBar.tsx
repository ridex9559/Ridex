/**
 * RIDEX Web — Mobile Phone Status Bar
 * Displays authentic smartphone status bar (carrier, time, dynamic island, battery)
 * when viewing the application in phone screen mode.
 */

import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

export const PhoneStatusBar: React.FC = () => {
  const [timeStr, setTimeStr] = useState('9:41');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setTimeStr(`${hours}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="phone-status-bar">
      {/* Time */}
      <span className="phone-status-time">{timeStr}</span>

      {/* Dynamic Island / Camera Notch */}
      <div className="phone-dynamic-island">
        <div className="island-lens" />
      </div>

      {/* Network & Battery Telemetry */}
      <div className="phone-status-icons">
        <Signal size={12} strokeWidth={2.5} />
        <span style={{ fontSize: '0.62rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>5G</span>
        <Wifi size={12} strokeWidth={2.5} />
        <BatteryMedium size={14} strokeWidth={2.5} />
      </div>
    </div>
  );
};
