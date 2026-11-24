import { COUNTRIES, countryByIso, flagEmoji, searchCountries } from "../countries";

test("India comes first, then the rest A–Z, each country once", () => {
  expect(COUNTRIES[0]).toEqual({ iso: "IN", name: "India", dial: "91" });
  const rest = COUNTRIES.slice(1).map((c) => c.name);
  expect(rest).toEqual([...rest].sort((a, b) => a.localeCompare(b)));
  expect(new Set(COUNTRIES.map((c) => c.iso)).size).toBe(COUNTRIES.length);
  for (const c of COUNTRIES) {
    expect(c.iso).toMatch(/^[A-Z]{2}$/);
    expect(c.dial).toMatch(/^[1-9]\d{0,2}$/);
  }
});

test("flags are built from the ISO code", () => {
  expect(flagEmoji("IN")).toBe("🇮🇳");
  expect(flagEmoji("gb")).toBe("🇬🇧");
});

test("an unknown or missing ISO code falls back to India", () => {
  expect(countryByIso("US").dial).toBe("1");
  expect(countryByIso("ZZ").iso).toBe("IN");
  expect(countryByIso(undefined).iso).toBe("IN");
});

test("search matches the start of a name's words, accents ignored, the ISO code, or the dial code", () => {
  const isos = (q: string) => searchCountries(q).map((c) => c.iso);
  expect(isos("ind")).toEqual(["IN", "IO", "ID"]);
  expect(isos("kingdom")).toEqual(["GB"]);
  expect(isos("reunion")).toEqual(["RE"]);
  expect(isos("ae")).toEqual(["AE"]);
  expect(isos("+44")).toEqual(["GG", "IM", "JE", "GB"]);
  expect(searchCountries("  ")).toBe(COUNTRIES);
  expect(isos("xyz")).toEqual([]);
});
