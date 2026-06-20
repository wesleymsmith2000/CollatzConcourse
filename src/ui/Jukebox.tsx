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

interface Track {
  id: string;
  title: string;
  subtitle: string;
  file: string;
  color: "cyan" | "gold" | "violet" | "red" | "green";
}

const tracks: Track[] = [
  {
    id: "echoes",
    title: "Echoes of Tomorrow",
    subtitle: "Factorization Suite",
    file: "/assets/music/EchoesOfTomorrow1.mp3",
    color: "violet"
  },
  {
    id: "racing",
    title: "Racing Dreams",
    subtitle: "Singularity Circuit",
    file: "/assets/music/RacingDreams1.mp3",
    color: "cyan"
  },
  {
    id: "turbo",
    title: "Turbo Groove",
    subtitle: "Concourse Broadcast",
    file: "/assets/music/TurboGroove1.mp3",
    color: "green"
  },
  {
    id: "velocity-1",
    title: "Velocity Rush I",
    subtitle: "Prime Lane Anthem",
    file: "/assets/music/VelocityRush1.mp3",
    color: "gold"
  },
  {
    id: "velocity-2",
    title: "Velocity Rush II",
    subtitle: "Resonance Sprint",
    file: "/assets/music/VelocityRush2.mp3",
    color: "red"
  },
  {
    id: "digital-star-hunt",
    title: "Digital Star Hunt",
    subtitle: "Prime Signal Pursuit",
    file: "/assets/music/DigitalStarHunt.mp3",
    color: "cyan"
  },
  {
    id: "resonance-split",
    title: "Resonance Split",
    subtitle: "Bifurcation Broadcast",
    file: "/assets/music/ResonnaceSplit.mp3",
    color: "violet"
  },
  {
    id: "crossing-stars",
    title: "A Chorus of Crossing Stars and Twisting Shadow",
    subtitle: "Shadow Concourse Suite",
    file: "/assets/music/A Chorus of Crossing Stars and Twisting Shadow.mp3",
    color: "gold"
  },
  {
    id: "dying-stars",
    title: "The Chasm of Dying Stars",
    subtitle: "Event Horizon Movement",
    file: "/assets/music/The Chasm of Dying Stars.mp3",
    color: "red"
  },
  {
    id: "shadow-veil-current",
    title: "The Shadow Veil Current",
    subtitle: "Veil Crossing Signal",
    file: "/assets/music/The Shadow Veil Current.mp3",
    color: "green"
  },
  {
    id: "shadowed-crossing",
    title: "The Shadowed Crossing",
    subtitle: "Twilight Circuit",
    file: "/assets/music/The Shadowed Crossing.mp3",
    color: "violet"
  },
  {
    id: "wings-of-the-wake",
    title: "Wings of the Wake",
    subtitle: "Concourse Ascension",
    file: "/assets/music/Wings of the Wake.mp3",
    color: "cyan"
  },
  {
    id: "yakama-falls-valley",
    title: "Yakama Falls Valley - The Shilombish Awakens",
    subtitle: "Valley Run",
    file: "/assets/music/Yakama Falls Valley - The Shilombish Awakens.mp3",
    color: "green"
  },
  {
    id: "yakama-ridge-run",
    title: "Yakama Ridge Run - Eye of the Shilombish",
    subtitle: "Ridge Run",
    file: "/assets/music/Yakama Ridge Run - Eye of the Shilombish.mp3",
    color: "gold"
  }
];

export function Jukebox() {
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

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  const volumeIcon = useMemo(() => {
    if (muted || volume === 0) return <VolumeX size={16} />;
    if (volume < 0.5) return <Volume1 size={16} />;
    return <Volume2 size={16} />;
  }, [muted, volume]);

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

  return (
    <section className="jukebox" aria-label="Quantum jukebox">
      <audio
        ref={audioRef}
        src={current.file}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)}
        onEnded={onEnded}
      />
      <div className="jukebox-header">
        <div>
          <p className="eyebrow">Quantum Jukebox</p>
          <h2>Music Broadcast</h2>
        </div>
        <img src={visualAssets.jukeboxConcept} alt="" aria-hidden="true" />
      </div>

      <div className="now-playing">
        <div className={`album-mark ${current.color}`} />
        <div>
          <strong>{current.title}</strong>
          <span>{current.subtitle}</span>
        </div>
        <div className="track-time">
          {formatTime(progress)} / {formatTime(duration)}
        </div>
      </div>

      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${progressPercent}%` }} />
      </div>

      <div className="jukebox-controls">
        <button type="button" className={shuffle ? "toggle-active" : ""} onClick={() => setShuffle(!shuffle)} title="Shuffle">
          <Shuffle size={16} />
        </button>
        <button type="button" onClick={previousTrack} title="Previous track">
          <SkipBack size={16} />
        </button>
        <button type="button" className="play-button" onClick={() => setPlaying(!playing)} title={playing ? "Pause" : "Play"}>
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button type="button" onClick={nextTrack} title="Next track">
          <SkipForward size={16} />
        </button>
        <button type="button" className={repeat ? "toggle-active" : ""} onClick={() => setRepeat(!repeat)} title="Repeat">
          <Repeat size={16} />
        </button>
        <button type="button" onClick={() => setMuted(!muted)} title={muted ? "Unmute" : "Mute"}>
          {volumeIcon}
        </button>
        <input
          aria-label="Jukebox volume"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
        />
      </div>

      <div className="track-list" aria-label="Tracks">
        {tracks.map((track, index) => (
          <button
            key={track.id}
            type="button"
            className={index === trackIndex ? "selected" : ""}
            onClick={() => chooseTrack(index)}
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
