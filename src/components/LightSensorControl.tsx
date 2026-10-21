import React from 'react';
import { Sun, Moon, Sparkles, Sliders, Eye } from 'lucide-react';
import type { Lighting } from '../hooks/useLighting';
import { Switch } from './Controls';

export function LightSensorControl({ state }: { state: Lighting }) {
  const lux = state.lightSensor?.lux ?? 180;
  const isDark = state.lightSensor?.isDark ?? false;
  const autoEnabled = state.lightSensor?.autoEnabled ?? true;
  const threshold = state.lightSensor?.threshold ?? 150;

  return (
    <div className="control-box light-sensor-box" style={{
      background: 'linear-gradient(135deg, rgba(50, 19, 16, 0.85), rgba(30, 11, 9, 0.95))',
      border: '1px solid #7a4f2d',
      borderRadius: '6px',
      padding: '10px 12px',
      display: 'grid',
      gap: '8px',
      boxShadow: 'inset 0 1px 0 rgba(236, 209, 138, 0.15)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#f3dd9b', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isDark ? <Moon size={14} color="#e5b858" /> : <Sun size={14} color="#f5c158" />}
          CẢM BIẾN QUANG (LDR)
        </span>
        <span style={{
          fontSize: '9px',
          padding: '2px 7px',
          borderRadius: '10px',
          background: isDark ? '#4a1d18' : '#23441f',
          color: isDark ? '#ffcfb0' : '#b7f0b2',
          border: isDark ? '1px solid #8e3a2d' : '1px solid #48873f',
          fontWeight: 500
        }}>
          {isDark ? '🌙 Ban đêm (Trời tối)' : '☀️ Ban ngày (Đủ sáng)'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <strong style={{ fontSize: '20px', color: '#fff0c8', fontFamily: 'monospace' }}>{lux}</strong>
          <small style={{ fontSize: '10px', color: '#c9b5a2' }}>Lux</small>
        </div>
        <small style={{ fontSize: '10px', color: '#d0bba8' }}>
          Ngưỡng kích hoạt: <b style={{ color: '#ecd18a' }}>{threshold} Lux</b>
        </small>
      </div>

      {/* Auto toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 8px',
        background: 'rgba(20, 8, 7, 0.5)',
        borderRadius: '4px',
        border: '1px solid #573322'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '10px', color: '#e8d2b8', fontWeight: 500 }}>Tự động bật đèn khi trời tối</span>
          <small style={{ fontSize: '8.5px', color: '#9f8570' }}>Bật 4 relay khi Lux &lt; {threshold}</small>
        </div>
        <Switch on={autoEnabled} onClick={() => state.setAutoLight(!autoEnabled)} label="Tự động cảm biến" />
      </div>

      {/* Threshold slider */}
      <div style={{ display: 'grid', gap: '3px', marginTop: '2px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#bba490' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Sliders size={11} /> Tùy chỉnh ngưỡng nhạy</span>
          <span>{threshold} Lux</span>
        </div>
        <input
          type="range"
          min="50"
          max="400"
          step="10"
          value={threshold}
          onChange={(e) => state.setLuxThreshold(Number(e.target.value))}
          style={{
            appearance: 'none',
            WebkitAppearance: 'none',
            height: '4px',
            borderRadius: '2px',
            background: `linear-gradient(to right, #ecd18a ${((threshold - 50) / 350) * 100}%, #4d2b1f ${((threshold - 50) / 350) * 100}%)`,
            outline: 'none',
            cursor: 'pointer'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#886d58' }}>
          <span>50 Lux (Tối hẳn)</span>
          <span>400 Lux (Chập choạng)</span>
        </div>
      </div>
    </div>
  );
}
