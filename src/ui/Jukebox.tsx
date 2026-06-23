import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pause,
  Play,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume1,
  Volume2,
  VolumeX
} from "lucide-react";
import { visualAssets } from "./assets";
import { musicTracks as tracks } from "./musicLibrary";

export function useJukebox() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [trackIndex, setTrackIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const current = tracks[trackIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [muted, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      void audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [playing, trackIndex]);

  function chooseTrack(index: number) {
    setTrackIndex(index);
    setProgress(0);
    setPlaying(true);
  }

  function nextTrack() {
    if (shuffle) {
      const next = Math.floor(Math.random() * tracks.length);
      setTrackIndex(next === trackIndex ? (next + 1) % tracks.length : next);
    } else {
      setTrackIndex((trackIndex + 1) % tracks.length);
    }
    setProgress(0);
    setPlaying(true);
  }

  function previousTrack() {
    setTrackIndex((trackIndex - 1 + tracks.length) % tracks.length);
    setProgress(0);
    setPlaying(true);
  }

  function onEnded() {
    if (repeat) {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        void audio.play();
      }
      return;
    }
    nextTrack();
  }

  return {
    audioRef,
    current,
    trackIndex,
    playing,
    shuffle,
    repeat,
    muted,
    volume,
    progress,
    duration,
    chooseTrack,
    nextTrack,
    previousTrack,
    onEnded,
    setPlaying,
    setShuffle,
    setRepeat,
    setMuted,
    setVolume,
    setProgress,
    setDuration
  };
}

type JukeboxController = ReturnType<typeof useJukebox>;

export function CompactJukebox({ jukebox }: { jukebox: JukeboxController }) {
  return (
    <div className="compact-jukebox" aria-label="Compact jukebox controls">
      <div className="compact-now-playing" title={jukebox.current.title}>
        <span>Now playing:</span>
        <strong>{jukebox.current.title}</strong>
      </div>
      <button type="button" onClick={jukebox.previousTrack} title="Previous track" aria-label="Previous track">
        <SkipBack size={16} />
      </button>
      <button
        type="button"
        className="compact-play-button"
        onClick={() => jukebox.setPlaying(!jukebox.playing)}
        title={jukebox.playing ? "Pause" : "Play"}
        aria-label={jukebox.playing ? "Pause" : "Play"}
      >
        {jukebox.playing ? <Pause size={17} /> : <Play size={17} />}
      </button>
      <button type="button" onClick={jukebox.nextTrack} title="Next track" aria-label="Next track">
        <SkipForward size={16} />
      </button>
    </div>
  );
}

export function Jukebox({ jukebox }: { jukebox: JukeboxController }) {
  const progressPercent = jukebox.duration > 0 ? (jukebox.progress / jukebox.duration) * 100 : 0;
  const volumeIcon = useMemo(() => {
    if (jukebox.muted || jukebox.volume === 0) return <VolumeX size={16} />;
    if (jukebox.volume < 0.5) return <Volume1 size={16} />;
    return <Volume2 size={16} />;
  }, [jukebox.muted, jukebox.volume]);

  return (
    <section className="jukebox" aria-label="Quantum jukebox">
      <audio
        ref={jukebox.audioRef}
        src={jukebox.current.file}
        onLoadedMetadata={(event) => jukebox.setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => jukebox.setProgress(event.currentTarget.currentTime)}
        onEnded={jukebox.onEnded}
      />
      <div className="jukebox-header">
        <div>
          <p className="eyebrow">Quantum Jukebox</p>
          <h2>Music Broadcast</h2>
        </div>
        <img src={visualAssets.jukeboxConcept} alt="" aria-hidden="true" />
      </div>

      <div className="now-playing">
        <div className={`album-mark ${jukebox.current.color}`} />
        <div>
          <strong>{jukebox.current.title}</strong>
          <span>{jukebox.current.subtitle}</span>
        </div>
        <div className="track-time">
          {formatTime(jukebox.progress)} / {formatTime(jukebox.duration)}
        </div>
      </div>

      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="jukebox-controls">
        <button type="button" className={jukebox.shuffle ? "toggle-active" : ""} onClick={() => jukebox.setShuffle(!jukebox.shuffle)} title="Shuffle">
          <Shuffle size={16} />
        </button>
        <button type="button" onClick={jukebox.previousTrack} title="Previous track">
          <SkipBack size={16} />
        </button>
        <button type="button" className="play-button" onClick={() => jukebox.setPlaying(!jukebox.playing)} title={jukebox.playing ? "Pause" : "Play"}>
          {jukebox.playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button type="button" onClick={jukebox.nextTrack} title="Next track">
          <SkipForward size={16} />
        </button>
        <button type="button" className={jukebox.repeat ? "toggle-active" : ""} onClick={() => jukebox.setRepeat(!jukebox.repeat)} title="Repeat">
          <Repeat size={16} />
        </button>
        <button type="button" onClick={() => jukebox.setMuted(!jukebox.muted)} title={jukebox.muted ? "Unmute" : "Mute"}>
          {volumeIcon}
        </button>
        <input
          aria-label="Jukebox volume"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={jukebox.volume}
          onChange={(event) => jukebox.setVolume(Number(event.target.value))}
        />
      </div>

      <div className="track-list" aria-label="Tracks">
        {tracks.map((track, index) => (
          <button
            key={track.id}
            type="button"
            className={index === jukebox.trackIndex ? "selected" : ""}
            onClick={() => jukebox.chooseTrack(index)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <i className={`album-dot ${track.color}`} />
            <strong>{track.title}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}
