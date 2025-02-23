export interface Instrument {
  type: OscillatorType;
  name: string;
  shortcut: string;
}

export interface Scale {
  intervals: number[];
  name: string;
  shortcut: string;
}

export interface Note {
  name: string;
  frequency: number;
  shortcut: string;
}

export interface ColorMapping {
  instrumentBase: {
    [key: string]: {
      hue: number;
      saturationBase: number;
      lightnessBase: number;
    };
  };
  scaleModifier: {
    [key: string]: {
      saturationMod: number;
      lightnessMod: number;
      hueMod: number;
    };
  };
  noteProperties: {
    [key: string]: {
      hueShift: number;
      brightness: number;
    };
  };
}
