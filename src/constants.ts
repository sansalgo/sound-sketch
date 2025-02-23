import { ColorMapping, Instrument, Note, Scale } from "./types";

export const COLOR_MAPPING: ColorMapping = {
  instrumentBase: {
    // Sine - Pure, smooth colors with high saturation
    sine: {
      hue: 210, // Blue base - represents purity and smoothness
      saturationBase: 0.85,
      lightnessBase: 0.6,
    },
    // Square - Strong, rich colors
    square: {
      hue: 0, // Red base - represents intensity
      saturationBase: 0.8,
      lightnessBase: 0.55,
    },
    // Sawtooth - Bright, energetic colors
    sawtooth: {
      hue: 300, // Magenta base - represents complexity
      saturationBase: 0.75,
      lightnessBase: 0.5,
    },
    // Triangle - Soft, balanced colors
    triangle: {
      hue: 120, // Green base - represents balance
      saturationBase: 0.7,
      lightnessBase: 0.65,
    },
  },

  scaleModifier: {
    // Major - Bright and warm
    major: {
      saturationMod: 0.1, // Increase saturation
      lightnessMod: 0.05, // Slightly brighter
      hueMod: 15, // Warm shift
    },
    // Minor - Deeper and cooler
    minor: {
      saturationMod: -0.05, // Slightly desaturated
      lightnessMod: -0.05, // Slightly darker
      hueMod: -15, // Cool shift
    },
    // Pentatonic - Vibrant and clear
    pentatonic: {
      saturationMod: 0.15, // More saturated
      lightnessMod: 0.1, // Brighter
      hueMod: 0, // Neutral
    },
    // Chromatic - Complex and nuanced
    chromatic: {
      saturationMod: -0.1, // Less saturated
      lightnessMod: 0, // Neutral brightness
      hueMod: -5, // Slight cool shift
    },
  },

  noteProperties: {
    // Circle of fifths-based color relationships
    C: { hueShift: 0, brightness: 0 }, // Base note
    G: { hueShift: 30, brightness: 0.02 }, // Perfect fifth
    D: { hueShift: 60, brightness: 0.04 },
    A: { hueShift: 90, brightness: 0.06 },
    E: { hueShift: 120, brightness: 0.08 },
    B: { hueShift: 150, brightness: 0.1 },
    F: { hueShift: -30, brightness: 0.02 }, // Perfect fourth
    "C#": { hueShift: 15, brightness: 0.01 }, // Chromatic relationships
    "D#": { hueShift: 45, brightness: 0.03 },
    "F#": { hueShift: 75, brightness: 0.05 },
    "G#": { hueShift: 105, brightness: 0.07 },
    "A#": { hueShift: 135, brightness: 0.09 },
  },
};

export const INSTRUMENTS: Instrument[] = [
  {
    type: "sine",
    name: "Sine Wave",
    shortcut: "a",
  },
  {
    type: "square",
    name: "Square Wave",
    shortcut: "s",
  },
  {
    type: "sawtooth",
    name: "Sawtooth",
    shortcut: "d",
  },
  {
    type: "triangle",
    name: "Triangle",
    shortcut: "f",
  },
];

export const SCALES: { [key: string]: Scale } = {
  major: {
    intervals: [0, 2, 4, 5, 7, 9, 11],
    name: "Major",
    shortcut: "1",
  },
  minor: {
    intervals: [0, 2, 3, 5, 7, 8, 10],
    name: "Minor",
    shortcut: "2",
  },
  pentatonic: {
    intervals: [0, 2, 4, 7, 9],
    name: "Pentatonic",
    shortcut: "3",
  },
  chromatic: {
    intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    name: "Chromatic",
    shortcut: "4",
  },
};

export const NOTES: Note[] = [
  { name: "C", frequency: 261.63, shortcut: "q" },
  { name: "C#", frequency: 277.18, shortcut: "w" },
  { name: "D", frequency: 293.66, shortcut: "e" },
  { name: "D#", frequency: 311.13, shortcut: "r" },
  { name: "E", frequency: 329.63, shortcut: "t" },
  { name: "F", frequency: 349.23, shortcut: "y" },
  { name: "F#", frequency: 369.99, shortcut: "u" },
  { name: "G", frequency: 392.0, shortcut: "i" },
  { name: "G#", frequency: 415.3, shortcut: "o" },
  { name: "A", frequency: 440.0, shortcut: "p" },
  { name: "A#", frequency: 466.16, shortcut: "[" },
  { name: "B", frequency: 493.88, shortcut: "]" },
];
