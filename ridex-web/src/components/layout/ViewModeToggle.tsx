/**
 * RIDEX Web — View Mode Presentation Toggle
 * Allows switching between centered Smartphone Screen and Desktop Command Center on desktop browsers.
 * Hidden on real mobile touch viewports (< 640px).
 */

import React from 'react';
import { Smartphone, Monitor } from 'lucide-react';
import { useViewModeStore } from '../../stores/useViewModeStore';

export const ViewModeToggle: React.FC = () => {
  const { isPhoneFrame, setPhoneFrame } = useViewModeStore();

  return (
    <aside className="view-mode-toggle-bar" aria-label="Screen presentation mode">
      <div className="view-mode-pill">
        <button
          onClick={() => setPhoneFrame(true)}
          className={`view-mode-btn ${isPhoneFrame ? 'active' : ''}`}
          title="Switch to Smartphone Screen mode"
        >
          <Smartphone size={13} />
          <span>Phone Screen</span>
        </button>

        <button
          onClick={() => setPhoneFrame(false)}
          className={`view-mode-btn ${!isPhoneFrame ? 'active' : ''}`}
          title="Switch to Desktop Command Center"
        >
          <Monitor size={13} />
          <span>Desktop View</span>
        </button>
      </div>
    </aside>
  );
};
