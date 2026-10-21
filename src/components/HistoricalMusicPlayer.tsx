import { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Upload, Sparkles, Disc3, BookOpen, Music, MapPin } from 'lucide-react';
import { useHistoricalMusic } from '../contexts/MusicContext';
import { HISTORICAL_SONGS, AREA_SONG_MAPPING } from '../data/historicalMusic';
import type { HistoricalSong } from '../data/historicalMusic';

export function HistoricalMusicPlayer() {
  const {
    currentSong,
    isPlaying,
    volume,
    progress,
    currentTime,
    duration,
    autoMemorial,
    autoAreaMusic,
    activeAreaId,
    playSong,
    playAreaMusic,
    togglePlay,
    nextSong,
    prevSong,
    seek,
    setVolume,
    setAutoMemorial,
    setAutoAreaMusic,
    loadCustomAudio,
  } = useHistoricalMusic();

  const [activeTab, setActiveTab] = useState<'ALL' | 'QUỐC_CA' | 'HÀO_KHÍ' | 'CÁCH_MẠNG'>('ALL');
  const [showLyrics, setShowLyrics] = useState(false);

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const filteredSongs = HISTORICAL_SONGS.filter((s) => {
    if (activeTab === 'ALL') return true;
    return s.tag === activeTab;
  });

  return (
    <div className="historical-music-container" style={{ display: 'grid', gap: '16px' }}>
      {/* ── Now Playing Hero Card ────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #2b0f0d 0%, #1a0807 100%)',
          border: '1px solid #734c2d',
          borderRadius: '8px',
          padding: '16px',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '16px',
          alignItems: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}
      >
        {/* Bronze drum vinyl icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #ecd18a 20%, #754c29 70%, #2a0b0a 100%)',
            border: '2px solid #ecd18a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isPlaying ? '0 0 16px #ecd18a66' : 'none',
            animation: isPlaying ? 'spin 12s linear infinite' : 'none',
          }}
        >
          <Disc3 size={44} color="#220a09" />
        </div>

        {/* Track info & Controls */}
        <div style={{ display: 'grid', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: '9px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  background: currentSong.tag === 'QUỐC_CA' ? '#a53e22' : currentSong.tag === 'HÀO_KHÍ' ? '#b58b42' : '#453a2b',
                  color: '#fff',
                  marginBottom: '4px',
                }}
              >
                {currentSong.tag === 'QUỐC_CA' ? 'Quốc ca & Nghi lễ' : currentSong.tag === 'HÀO_KHÍ' ? 'Hào khí Dân tộc' : 'Ca khúc Kháng chiến'}
              </span>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#f3dd9b', fontWeight: 700 }}>
                {currentSong.title}
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#c4aa8b' }}>
                Nhạc & Lời: <strong>{currentSong.composer}</strong> ({currentSong.year}) · {currentSong.era}
              </p>
            </div>

            <button
              type="button"
              className="secondary-button"
              style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => setShowLyrics(!showLyrics)}
            >
              <BookOpen size={13} /> {showLyrics ? 'Ẩn lời' : 'Xem lời'}
            </button>
          </div>

          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: '#a08870', minWidth: '32px' }}>{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={progress || 0}
              onChange={(e) => seek(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#ecd18a', height: '4px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '10px', color: '#a08870', minWidth: '32px' }}>{formatTime(duration)}</span>
          </div>

          {/* Playback Buttons & Volume */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="secondary-button"
                style={{ padding: '6px 10px', borderRadius: '4px' }}
                onClick={prevSong}
                title="Bài trước"
              >
                <SkipBack size={14} />
              </button>
              <button
                type="button"
                className="gold-button"
                style={{
                  padding: '6px 16px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                  fontSize: '12px',
                }}
                onClick={togglePlay}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                {isPlaying ? 'Tạm dừng' : 'Phát nhạc'}
              </button>
              <button
                type="button"
                className="secondary-button"
                style={{ padding: '6px 10px', borderRadius: '4px' }}
                onClick={nextSong}
                title="Bài tiếp theo"
              >
                <SkipForward size={14} />
              </button>
            </div>

            {/* Volume */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {volume === 0 ? <VolumeX size={14} color="#a08870" /> : <Volume2 size={14} color="#ecd18a" />}
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                style={{ width: '60px', accentColor: '#ecd18a', height: '4px', cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Lyrics Modal / Section (Expandable) ─────────────────────────── */}
      {showLyrics && (
        <div
          style={{
            background: '#1d0b0a',
            border: '1px solid #734c2d',
            borderRadius: '6px',
            padding: '12px 16px',
            fontSize: '12px',
            lineHeight: '1.7',
            color: '#f5e4c3',
            whiteSpace: 'pre-line',
            fontStyle: 'italic',
            textAlign: 'center',
          }}
        >
          <strong style={{ display: 'block', fontSize: '13px', color: '#ecd18a', marginBottom: '8px', fontStyle: 'normal' }}>
            LỜI BÀI HÁT: {currentSong.title.toUpperCase()}
          </strong>
          {currentSong.lyrics}
        </div>
      )}

      {/* ── Historical Context Description ─────────────────────────────── */}
      <div
        style={{
          background: '#240f0d',
          borderLeft: '3px solid #b58b42',
          padding: '10px 14px',
          borderRadius: '0 4px 4px 0',
          fontSize: '11px',
          lineHeight: '1.5',
          color: '#d6be9d',
        }}
      >
        <strong style={{ color: '#f3dd9b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
          <Sparkles size={12} color="#ecd18a" /> Ý nghĩa lịch sử:
        </strong>
        {currentSong.description}
      </div>

      {/* ── Filter Tabs & Auto Memorial Switch ─────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          {(['ALL', 'QUỐC_CA', 'HÀO_KHÍ', 'CÁCH_MẠNG'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? '#87321a' : '#2e1210',
                color: activeTab === tab ? '#fff' : '#d2b48c',
                border: '1px solid #734c2d',
                borderRadius: '4px',
                padding: '5px 10px',
                fontSize: '10.5px',
                fontWeight: activeTab === tab ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {tab === 'ALL'
                ? 'Tất cả bài ca'
                : tab === 'QUỐC_CA'
                ? 'Quốc ca & Nghi lễ'
                : tab === 'HÀO_KHÍ'
                ? 'Hào khí Dân tộc'
                : 'Kháng chiến ATK'}
            </button>
          ))}
        </div>

        {/* Upload Custom song */}
        <label
          style={{
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10.5px',
            color: '#ecd18a',
            padding: '4px 8px',
            border: '1px dashed #b58b42',
            borderRadius: '4px',
            background: '#2b0f0d',
          }}
        >
          <Upload size={12} /> Tải nhạc từ máy
          <input
            type="file"
            accept="audio/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files?.[0]) loadCustomAudio(e.target.files[0]);
            }}
          />
        </label>
      </div>

      {/* ── Track List ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
        {filteredSongs.map((song, idx) => {
          const isThisPlaying = currentSong.id === song.id && isPlaying;
          const isSelected = currentSong.id === song.id;

          return (
            <div
              key={song.id}
              onClick={() => playSong(song)}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                background: isSelected ? '#3d1614' : '#230b0a',
                border: isSelected ? '1px solid #ecd18a' : '1px solid #5a3020',
                borderRadius: '5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {/* Play button indicator */}
              <button
                type="button"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: isThisPlaying ? '#ecd18a' : '#451a17',
                  color: isThisPlaying ? '#220a09' : '#ecd18a',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {isThisPlaying ? <Pause size={12} /> : <Play size={12} style={{ marginLeft: '1px' }} />}
              </button>

              {/* Info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#b58b42', fontWeight: 700 }}>#{idx + 1}</span>
                  <strong style={{ fontSize: '12px', color: isSelected ? '#fff' : '#f0d9a6' }}>{song.title}</strong>
                  {song.src && (
                    <span style={{ fontSize: '8.5px', background: '#354823', color: '#a2e683', padding: '1px 4px', borderRadius: '2px' }}>
                      Offline
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '10px', color: '#a48b72' }}>
                  Tác giả: {song.composer} · {song.year}
                </div>
              </div>

              {/* Tag */}
              <span style={{ fontSize: '10px', color: '#c4aa8b' }}>{song.era.split('&')[0]}</span>
            </div>
          );
        })}
      </div>

      {/* ── Nhạc theo 4 Khu di tích ──────────────────────────────────── */}
      <div
        style={{
          borderTop: '1px solid #542b1f',
          paddingTop: '12px',
          display: 'grid',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontSize: '12px', color: '#f3dd9b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={14} color="#ecd18a" /> Âm nhạc gắn liền 4 Khu di tích ATK
          </strong>
          <span style={{ fontSize: '10px', color: '#a08870' }}>Bấm phát hoặc mở đèn khu vực</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
          {Object.entries(AREA_SONG_MAPPING).map(([areaId, mapping]) => {
            const isThisAreaActive = activeAreaId === areaId && isPlaying;
            return (
              <div
                key={areaId}
                style={{
                  background: isThisAreaActive ? '#3d1612' : '#220b0a',
                  border: `1px solid ${isThisAreaActive ? '#ecd18a' : '#552b1f'}`,
                  borderRadius: '6px',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#f0d9a6' }}>{mapping.areaName}</div>
                  <div style={{ fontSize: '9.5px', color: '#bba28a' }}>{mapping.songTitle}</div>
                </div>
                <button
                  type="button"
                  onClick={() => playAreaMusic(areaId)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '10px',
                    borderRadius: '4px',
                    border: 'none',
                    background: isThisAreaActive ? '#ecd18a' : '#542618',
                    color: isThisAreaActive ? '#220a09' : '#f0d9a6',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {isThisAreaActive ? <Pause size={10} /> : <Play size={10} />}
                  {isThisAreaActive ? 'Đang phát' : 'Nghe'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Settings options: Auto playback toggles ─────────────────────── */}
      <div
        style={{
          borderTop: '1px solid #542b1f',
          paddingTop: '10px',
          display: 'grid',
          gap: '8px',
          fontSize: '11px',
          color: '#d4bc9e',
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={autoAreaMusic}
            onChange={(e) => setAutoAreaMusic(e.target.checked)}
            style={{ accentColor: '#ecd18a' }}
          />
          <strong>Tự động phát nhạc lịch sử khi ấn MỞ mỗi khu di tích</strong> (Đồi Khau Tý, Lán Tỉn Keo, Nhà tưởng niệm, Quảng trường)
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={autoMemorial}
            onChange={(e) => setAutoMemorial(e.target.checked)}
            style={{ accentColor: '#ecd18a' }}
          />
          Tự động phát Quốc ca / Quốc thiều khi bật chế độ &quot;Lễ tưởng niệm&quot; tại ATK
        </label>
      </div>
    </div>
  );
}
