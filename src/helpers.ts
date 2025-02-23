import { COLOR_MAPPING, INSTRUMENTS, NOTES, SCALES } from "./constants";
import { Instrument, Note, Scale } from "./types";
import { HSLAToHex, HSLToHex } from "./utils";

export function generateStrokeColor(
  instrumentType: string,
  scaleName: string,
  noteName: string,
  options: { alpha?: number } = {}
): string {
  const instrument = COLOR_MAPPING.instrumentBase[instrumentType];
  const scale = COLOR_MAPPING.scaleModifier[scaleName];
  const note = COLOR_MAPPING.noteProperties[noteName.replace("#", "#")];

  // Calculate final color properties
  const hue = (instrument.hue + note.hueShift + scale.hueMod + 360) % 360;

  const saturation = Math.max(
    0,
    Math.min(1, instrument.saturationBase + scale.saturationMod)
  );

  const lightness = Math.max(
    0.2,
    Math.min(
      0.8,
      instrument.lightnessBase + scale.lightnessMod + note.brightness
    )
  );

  // Generate color with optional alpha
  if (options.alpha !== undefined) {
    return HSLAToHex(hue, saturation, lightness, options.alpha);
  }
  return HSLToHex(hue, saturation, lightness);
}

export const getInstrumentByShortcut = (
  key: string
): Instrument | undefined => {
  return INSTRUMENTS.find((inst) => inst.shortcut === key.toLowerCase());
};

export const getScaleByShortcut = (
  key: string
): [string, Scale] | undefined => {
  const entry = Object.entries(SCALES).find(
    ([_, scale]) => scale.shortcut === key
  );
  return entry;
};

export const getNoteByShortcut = (key: string): Note | undefined => {
  return NOTES.find((note) => note.shortcut === key.toLowerCase());
};
