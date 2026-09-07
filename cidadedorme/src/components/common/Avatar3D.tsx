import React from 'react';
import { PlayerAvatar, Role } from '../../types';

interface Avatar3DProps {
  avatar: PlayerAvatar;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isDead?: boolean;
  role?: Role;
  showRoleBadge?: boolean;
  showGlow?: boolean;
  interactive?: boolean;
  animated?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Avatar3D({
  avatar,
  size = 'md',
  isDead = false,
  role,
  showRoleBadge = false,
  showGlow = true,
  interactive = false,
  animated = true,
  className = '',
  onClick,
}: Avatar3DProps) {
  const sizeConfig = {
    xs: { box: 'w-7 h-7', emoji: 'text-sm', pedestal: 'w-6 h-1.5', badge: 'text-[8px] px-1' },
    sm: { box: 'w-10 h-10', emoji: 'text-lg', pedestal: 'w-8 h-2', badge: 'text-[9px] px-1' },
    md: { box: 'w-14 h-14', emoji: 'text-2xl', pedestal: 'w-12 h-2.5', badge: 'text-[10px] px-1.5' },
    lg: { box: 'w-20 h-20', emoji: 'text-4xl', pedestal: 'w-16 h-3', badge: 'text-xs px-2' },
    xl: { box: 'w-28 h-28', emoji: 'text-6xl', pedestal: 'w-24 h-4', badge: 'text-xs px-2.5' },
    '2xl': { box: 'w-36 h-36', emoji: 'text-7xl', pedestal: 'w-32 h-5', badge: 'text-sm px-3' },
  }[size];

  const color = avatar.color || '#E50914';

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex flex-col items-center justify-center select-none group ${
        interactive ? 'cursor-pointer' : ''
      } ${className}`}
      style={{ perspective: '800px' }}
    >
      {/* 3D Character Capsule Container */}
      <div
        className={`relative ${sizeConfig.box} flex items-center justify-center transition-all duration-300 ${
          interactive ? 'group-hover:scale-110 group-hover:-translate-y-1' : ''
        } ${animated && !isDead ? 'animate-bounce-subtle' : ''}`}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Radial Backlight / Aura */}
        {showGlow && !isDead && (
          <div
            className="absolute inset-0 rounded-full blur-md opacity-40 group-hover:opacity-80 transition-opacity pointer-events-none"
            style={{ backgroundColor: color }}
          />
        )}

        {/* 3D Spherical/Capsule Glossy Body */}
        <div
          className={`w-full h-full rounded-2xl md:rounded-3xl flex items-center justify-center relative overflow-hidden shadow-2xl transition-transform ${
            isDead ? 'grayscale opacity-60 bg-neutral-800 border-2 border-neutral-700' : ''
          }`}
          style={{
            background: isDead
              ? 'linear-gradient(145deg, #2a2a2a, #111111)'
              : `radial-gradient(circle at 30% 25%, #ffffff 0%, ${color} 45%, #050505 100%)`,
            boxShadow: isDead
              ? '0 6px 16px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.1)'
              : `0 10px 25px -4px ${color}66, inset 0 2px 4px rgba(255,255,255,0.6), inset 0 -4px 8px rgba(0,0,0,0.6)`,
          }}
        >
          {/* Specular Light Reflection */}
          <div
            className="absolute top-1 left-2 right-2 h-1/3 rounded-full pointer-events-none opacity-50"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 100%)',
            }}
          />

          {/* 3D Floating Emoji Icon Badge */}
          <span
            className={`${sizeConfig.emoji} drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)] transition-transform duration-200 transform group-hover:scale-110`}
            style={{
              filter: isDead ? 'grayscale(100%) brightness(0.7)' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
            }}
          >
            {isDead ? '💀' : avatar.emoji}
          </span>
        </div>

        {/* Optional Role Badge Overlay */}
        {showRoleBadge && role && (
          <div
            className={`absolute -bottom-1 font-black uppercase tracking-wider rounded-full shadow-lg border border-white/30 text-white ${
              sizeConfig.badge
            } ${
              role === 'ASSASSINO'
                ? 'bg-rose-600 shadow-[0_0_12px_rgba(225,29,72,0.8)]'
                : 'bg-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.8)]'
            }`}
          >
            {role === 'ASSASSINO' ? 'Assassino' : 'Inocente'}
          </div>
        )}
      </div>

      {/* 3D Cast Shadow & Pedestal */}
      <div
        className={`${sizeConfig.pedestal} rounded-[100%] transition-all duration-300 mt-1`}
        style={{
          background: isDead
            ? 'radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 70%)'
            : `radial-gradient(ellipse at center, ${color}99 0%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0) 75%)`,
          transform: 'rotateX(65deg)',
        }}
      />
    </div>
  );
}
