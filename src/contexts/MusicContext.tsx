import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { HISTORICAL_SONGS, AREA_SONG_MAPPING } from '../data/historicalMusic';
import type { HistoricalSong } from '../data/historicalMusic';

interface MusicContextType {
  currentSong: HistoricalSong;
  isPlaying: boolean;
  volume: number;
  progress: number; // 0..100
  currentTime: number;
  duration: number;
  autoMemorial: boolean;
  autoAreaMusic: boolean;
  activeAreaId: string | null;
  playSong: (song: HistoricalSong) => void;
  playAreaMusic: (areaId: string) => void;
  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  seek: (percent: number) => void;
  setVolume: (v: number) => void;
  setAutoMemorial: (enabled: boolean) => void;
  setAutoAreaMusic: (enabled: boolean) => void;
  loadCustomAudio: (file: File) => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<HistoricalSong>(HISTORICAL_SONGS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [autoMemorial, setAutoMemorialState] = useState(true);
  const [autoAreaMusic, setAutoAreaMusicState] = useState(() => localStorage.getItem('atk-auto-area-music') !== '0');
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthTimerRef = useRef<number[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playSongRef = useRef<(song: HistoricalSong) => void>(() => {});
  const activeAreaIdRef = useRef<string | null>(null);
  activeAreaIdRef.current = activeAreaId;

  // Initialize Audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = volume;
    audioRef.current = audio;

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };

    audio.onended = () => {
      nextSong();
    };

    audio.onerror = () => {
      setIsPlaying(false);
    };

    const handleMemorialEvent = () => {
      const enabled = localStorage.getItem('atk-auto-memorial-music') !== '0';
      if (enabled) {
        setActiveAreaId('memorial');
        playSongRef.current(HISTORICAL_SONGS[0]);
      }
    };

    const handleAreaToggle = (e: Event) => {
      const custom = e as CustomEvent<{ areaId: string; on: boolean; areaName?: string }>;
      if (!custom.detail) return;
      const { areaId, on } = custom.detail;
      const autoAreaEnabled = localStorage.getItem('atk-auto-area-music') !== '0';

      if (on) {
        if (autoAreaEnabled) {
          const mapping = AREA_SONG_MAPPING[areaId];
          if (mapping) {
            const song = HISTORICAL_SONGS.find((s) => s.id === mapping.songId);
            if (song) {
              setActiveAreaId(areaId);
              playSongRef.current(song);
            }
          }
        }
      } else {
        if (activeAreaIdRef.current === areaId) {
          if (audioRef.current && !audioRef.current.paused) {
            audioRef.current.pause();
          }
          stopSynth();
          setIsPlaying(false);
          setActiveAreaId(null);
        }
      }
    };

    const handleSystemOff = () => {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
      stopSynth();
      setIsPlaying(false);
      setActiveAreaId(null);
    };

    window.addEventListener('atk:mode-memorial', handleMemorialEvent);
    window.addEventListener('atk:area-toggle', handleAreaToggle);
    window.addEventListener('atk:system-off', handleSystemOff);

    return () => {
      audio.pause();
      audio.src = '';
      window.removeEventListener('atk:mode-memorial', handleMemorialEvent);
      window.removeEventListener('atk:area-toggle', handleAreaToggle);
      window.removeEventListener('atk:system-off', handleSystemOff);
    };
  }, []);

  // Web Audio API Synthesizer for instrumental melodies
  const stopSynth = () => {
    synthTimerRef.current.forEach((t) => clearTimeout(t));
    synthTimerRef.current = [];
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close();
      } catch { /* ignore */ }
      audioCtxRef.current = null;
    }
  };

  const playSynthMelody = (song: HistoricalSong) => {
    stopSynth();
    if (!song.notes || song.notes.length === 0) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      let timeOffset = 0;
      const totalDur = song.notes.reduce((acc, n) => acc + n.dur, 0);
      setDuration(totalDur);

      song.notes.forEach((note) => {
        const timer = window.setTimeout(() => {
          if (!ctx || ctx.state === 'closed') return;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          // Brass/horn orchestral timbre
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(note.freq, ctx.currentTime);

          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.28 * volume, ctx.currentTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.dur * 0.95);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + note.dur);
        }, timeOffset * 1000);

        synthTimerRef.current.push(timer);
        timeOffset += note.dur;
      });

      // Loop synth when done
      const loopTimer = window.setTimeout(() => {
        if (isPlaying) {
          playSynthMelody(song);
        }
      }, (totalDur + 1) * 1000);
      synthTimerRef.current.push(loopTimer);
    } catch (e) {
      console.warn('Web Audio synth error:', e);
    }
  };

  const playSong = (song: HistoricalSong) => {
    setCurrentSong(song);
    stopSynth();

    if (song.src) {
      if (audioRef.current) {
        audioRef.current.src = song.src;
        audioRef.current.volume = volume;
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((e) => {
            console.warn('Audio play error, falling back to synth:', e);
            if (song.notes) {
              playSynthMelody(song);
              setIsPlaying(true);
            }
          });
      }
    } else if (song.notes) {
      if (audioRef.current) audioRef.current.pause();
      playSynthMelody(song);
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
      stopSynth();
      setIsPlaying(false);
    } else {
      playSong(currentSong);
    }
  };

  const nextSong = () => {
    const idx = HISTORICAL_SONGS.findIndex((s) => s.id === currentSong.id);
    const nextIdx = (idx + 1) % HISTORICAL_SONGS.length;
    playSong(HISTORICAL_SONGS[nextIdx]);
  };

  const prevSong = () => {
    const idx = HISTORICAL_SONGS.findIndex((s) => s.id === currentSong.id);
    const prevIdx = (idx - 1 + HISTORICAL_SONGS.length) % HISTORICAL_SONGS.length;
    playSong(HISTORICAL_SONGS[prevIdx]);
  };

  const seek = (percent: number) => {
    if (audioRef.current && duration > 0) {
      const time = (percent / 100) * duration;
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolume = (v: number) => {
    const val = Math.max(0, Math.min(1, v));
    setVolumeState(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const setAutoMemorial = (enabled: boolean) => {
    setAutoMemorialState(enabled);
    localStorage.setItem('atk-auto-memorial-music', enabled ? '1' : '0');
  };

  const setAutoAreaMusic = (enabled: boolean) => {
    setAutoAreaMusicState(enabled);
    localStorage.setItem('atk-auto-area-music', enabled ? '1' : '0');
  };

  const playAreaMusic = useCallback((areaId: string) => {
    const mapping = AREA_SONG_MAPPING[areaId];
    if (!mapping) return;
    const song = HISTORICAL_SONGS.find((s) => s.id === mapping.songId);
    if (song) {
      setActiveAreaId(areaId);
      playSong(song);
    }
  }, [playSong]);

  playSongRef.current = playSong;

  const loadCustomAudio = (file: File) => {
    const url = URL.createObjectURL(file);
    const customSong: HistoricalSong = {
      id: 'custom-' + Date.now(),
      title: file.name.replace(/\.[^/.]+$/, ''),
      composer: 'Tải lên từ thiết bị',
      year: new Date().getFullYear().toString(),
      era: 'Âm thanh người dùng',
      description: 'Tệp âm thanh lịch sử do người quản trị tải lên từ máy tính hoặc điện thoại.',
      src: url,
      tag: 'CÁCH_MẠNG',
      lyrics: `(Tệp âm thanh: ${file.name})`,
    };
    playSong(customSong);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <MusicContext.Provider
      value={{
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
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useHistoricalMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useHistoricalMusic must be used within MusicProvider');
  return ctx;
}
