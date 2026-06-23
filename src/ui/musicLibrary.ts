export type TrackColor = "cyan" | "gold" | "violet" | "red" | "green";

export interface MusicTrack {
  id: string;
  title: string;
  subtitle: string;
  file: string;
  color: TrackColor;
}

type TrackMetadata = Partial<Pick<MusicTrack, "title" | "subtitle" | "color">>;

// These are presentation overrides only. Any audio file without an entry here is
// still added to the jukebox using its filename as the title.
const trackMetadata: Record<string, TrackMetadata> = {
  "EchoesOfTomorrow1.mp3": { title: "Echoes of Tomorrow", subtitle: "Factorization Suite", color: "violet" },
  "RacingDreams1.mp3": { title: "Racing Dreams", subtitle: "Singularity Circuit", color: "cyan" },
  "TurboGroove1.mp3": { title: "Turbo Groove", subtitle: "Concourse Broadcast", color: "green" },
  "VelocityRush1.mp3": { title: "Velocity Rush I", subtitle: "Prime Lane Anthem", color: "gold" },
  "VelocityRush2.mp3": { title: "Velocity Rush II", subtitle: "Resonance Sprint", color: "red" },
  "DigitalStarHunt.mp3": { title: "Digital Star Hunt", subtitle: "Prime Signal Pursuit", color: "cyan" },
  "ResonnaceSplit.mp3": { title: "Resonance Split", subtitle: "Bifurcation Broadcast", color: "violet" },
  "A Chorus of Crossing Stars and Twisting Shadow.mp3": { subtitle: "Shadow Concourse Suite", color: "gold" },
  "The Chasm of Dying Stars.mp3": { subtitle: "Event Horizon Movement", color: "red" },
  "The Shadow Veil Current.mp3": { subtitle: "Veil Crossing Signal", color: "green" },
  "The Shadowed Crossing.mp3": { subtitle: "Twilight Circuit", color: "violet" },
  "Wings of the Wake.mp3": { subtitle: "Concourse Ascension", color: "cyan" },
  "Yakama Falls Valley - The Shilombish Awakens.mp3": { subtitle: "Valley Run", color: "green" },
  "Yakama Ridge Run - Eye of the Shilombish.mp3": { subtitle: "Ridge Run", color: "gold" },
  "Dark Matter Privateers.mp3": { subtitle: "Void Raider Broadcast", color: "violet" },
  "Davey Jones Void Locker.mp3": { subtitle: "Deep Concourse Signal", color: "green" },
  "Derelict in the Sanguine Void.mp3": { subtitle: "Redshift Distress Call", color: "red" },
  "Eldritch Starchaser.mp3": { subtitle: "Forbidden Prime Route", color: "cyan" },
  "Ghost Ship Star Chasers.mp3": { subtitle: "Phantom Circuit", color: "gold" },
  "Kerr Raider Standoff.mp3": { subtitle: "Border Concourse Duel", color: "red" },
  "Tidal Warp Rift.mp3": { subtitle: "Gravitic Resonance", color: "cyan" }
};

const colors: TrackColor[] = ["cyan", "gold", "violet", "red", "green"];

const musicFiles = import.meta.glob("../../assets/music/*.{mp3,ogg,wav,m4a}", {
  eager: true,
  query: "?url",
  import: "default"
}) as Record<string, string>;

export const musicTracks: MusicTrack[] = buildMusicLibrary(musicFiles);

export function buildMusicLibrary(files: Record<string, string>): MusicTrack[] {
  return Object.entries(files)
    .map(([path, file]) => {
      const fileName = path.split("/").pop() ?? path;
      const metadata = trackMetadata[fileName] ?? {};
      const title = metadata.title ?? titleFromFilename(fileName);

      return {
        id: fileName.toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        title,
        subtitle: metadata.subtitle ?? "Concourse Music Archive",
        file,
        color: metadata.color ?? colors[hashString(fileName) % colors.length]
      };
    })
    .sort((left, right) => left.title.localeCompare(right.title));
}

function titleFromFilename(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

function hashString(value: string): number {
  let hash = 0;
  for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return hash;
}
