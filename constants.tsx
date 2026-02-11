
import React from 'react';

export const COLORS = {
  black: '#1A1A1A',
  dark: '#0F172A',
  grayDark: '#E2E8F0',
  grayMid: '#94A3B8',
  grayLight: '#64748B',
  cyan: '#00B5E2',
  pink: '#E91E63',
  white: '#FFFFFF',
};

export const UI_LABELS = {
  action: 'AÇÃO',
  dialogue: 'DIÁLOGOS',
  captions: 'LEGENDAS',
  page: 'PÁGINA',
  panel: 'PAINEL',
};

export const MaterialIcon = ({ name, className = "" }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined select-none ${className}`}>
    {name}
  </span>
);
