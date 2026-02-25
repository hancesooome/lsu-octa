import React from 'react';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ children, className = "" }) => (
  <div className={`glass-panel ${className}`}>
    {children}
  </div>
);

export const GlassCard: React.FC<GlassPanelProps> = ({ children, className = "" }) => (
  <div className={`glass-card ${className}`}>
    {children}
  </div>
);
