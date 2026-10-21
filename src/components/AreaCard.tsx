import { ChevronRight, Music } from 'lucide-react';
import type { Area } from '../data/mock';
import { useHistoricalMusic } from '../contexts/MusicContext';

export function AreaCard({ area, onClick }: { area: Area; onClick: () => void }) {
  const { isPlaying, activeAreaId } = useHistoricalMusic();
  const isMusicActive = area.on && isPlaying && activeAreaId === area.id;

  return (
    <button
      className={`area-card ${isMusicActive ? 'area-playing-music' : ''}`}
      onClick={onClick}
      aria-label={`${area.on ? 'Tắt' : 'Bật'} ${area.name}`}
      aria-pressed={area.on}
      style={isMusicActive ? { borderColor: '#ecd18a', boxShadow: '0 0 10px rgba(236,209,138,0.3)' } : undefined}
    >
      <span className={`area-icon icon-${area.icon}`} aria-hidden="true" />
      <div>
        <strong>{area.name}</strong>
        <span>
          {area.lamps} đèn
          {isMusicActive && (
            <span
              style={{
                color: '#f3dd9b',
                marginLeft: '6px',
                fontSize: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                fontWeight: 600,
              }}
              title="Khu vực đang cử hành khúc nhạc lịch sử"
            >
              <Music size={10} color="#ecd18a" /> Nhạc
            </span>
          )}
        </span>
        <small className={area.on ? 'green' : ''}>
          <i className={area.on ? 'status-dot on' : 'status-dot'} />
          {area.on ? 'Đang bật' : 'Đã tắt'}
        </small>
      </div>
      <ChevronRight className="area-chevron" />
    </button>
  );
}
