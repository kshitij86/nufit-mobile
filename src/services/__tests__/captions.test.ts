import { cueAt, languageLabel, parseVtt } from "../captions";

describe("captions", () => {
  const vtt = [
    "WEBVTT",
    "",
    "NOTE made by hand",
    "",
    "1",
    "00:00:01.000 --> 00:00:02.500 align:center",
    "<b>Breathe</b> in",
    "",
    "01:03.000 --> 01:04.000",
    "Hold it",
    "",
  ].join("\r\n");

  test("parses cues, dropping tags, notes and cue settings", () => {
    expect(parseVtt(vtt)).toEqual([
      { start: 1, end: 2.5, text: "Breathe in" },
      { start: 63, end: 64, text: "Hold it" },
    ]);
  });

  test("finds the cue showing at a time", () => {
    const cues = parseVtt(vtt);
    expect(cueAt(cues, 1.2)).toBe("Breathe in");
    expect(cueAt(cues, 2.5)).toBeNull();
    expect(cueAt(cues, 63.5)).toBe("Hold it");
  });

  test("names languages", () => {
    expect(languageLabel("hi")).toBe("Hindi");
    expect(languageLabel("ta")).toBe("TA");
  });
});
