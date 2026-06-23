import { describe, expect, it } from "vitest";
import { buildMusicLibrary, musicTracks } from "../ui/musicLibrary";

describe("jukebox music library", () => {
  it("automatically discovers the newest music files", () => {
    expect(musicTracks.map((track) => track.title)).toEqual(expect.arrayContaining([
      "Chase of the Void",
      "Galois Void Gambit",
      "Kerr's Crossing",
      "The Collatz Cascade"
    ]));
  });

  it("creates usable fallback metadata for files without an override", () => {
    const tracks = buildMusicLibrary({
      "../../assets/music/NewQuantumSignal.mp3": "/bundled/NewQuantumSignal.mp3"
    });

    expect(tracks[0]).toMatchObject({
      id: "newquantumsignal",
      title: "New Quantum Signal",
      subtitle: "Concourse Music Archive",
      file: "/bundled/NewQuantumSignal.mp3"
    });
  });
});
