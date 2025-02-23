import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { INSTRUMENTS, NOTES, SCALES } from "./constants";
import {
  generateStrokeColor,
  getInstrumentByShortcut,
  getNoteByShortcut,
  getScaleByShortcut,
} from "./helpers";
import { Play, Square } from "lucide-react";

interface Stroke {
  path: { x: number; y: number }[];
  note: string;
  duration: number;
  instrument: string;
  scale: string;
  rootNote: string;
  volume: number;
  color: string;
}

const getStrokeColor = (
  instrumentType: string,
  scaleName: string,
  noteName: string
): string => {
  return generateStrokeColor(instrumentType, scaleName, noteName);
};

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackTimeoutRef = useRef<number>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [composition, setComposition] = useState<Stroke[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<string>("sine");
  const [volume, setVolume] = useState(0.1);
  const [tempo, setTempo] = useState(1);
  const [selectedScale, setSelectedScale] = useState<string>("major");
  const [rootNote, setRootNote] = useState("C");
  const playbackButtonRef = useRef<HTMLButtonElement>(null);
  const lastDrawnPointRef = useRef<{ x: number; y: number } | null>(null);
  const currentStrokeRef = useRef<Stroke>({
    path: [],
    note: "",
    duration: 0,
    instrument: "sine",
    scale: "major",
    rootNote: "C",
    volume: 0.1,
    color: getStrokeColor(selectedInstrument, selectedScale, rootNote),
  });

  const redrawComposition = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawGrid(ctx, canvas.width, canvas.height);
    composition.forEach((stroke) => {
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      stroke.path.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    });
  }, [composition]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      drawGrid(ctx, canvas.width, canvas.height);
      redrawComposition();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
      }
    };
  }, [redrawComposition]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const instrument = getInstrumentByShortcut(e.key);
      if (instrument) {
        setSelectedInstrument(instrument.type);
        return;
      }

      const scale = getScaleByShortcut(e.key);
      if (scale) {
        setSelectedScale(scale[0]);
        return;
      }

      const note = getNoteByShortcut(e.key);
      if (note) {
        setRootNote(note.name);
        return;
      }

      if (e.key === " ") {
        playbackButtonRef.current?.click();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  const drawGrid = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;

    const noteStep = height / 12;
    const timeStep = width / 16;

    // Draw horizontal lines (pitch)
    for (let i = 0; i <= 12; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * noteStep);
      ctx.lineTo(width, i * noteStep);
      ctx.stroke();
    }

    // Draw vertical lines (time)
    for (let i = 0; i <= 16; i++) {
      ctx.beginPath();
      ctx.moveTo(i * timeStep, 0);
      ctx.lineTo(i * timeStep, height);
      ctx.stroke();
    }

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
  };

  const calculateStrokeLength = (path: { x: number; y: number }[]): number => {
    let length = 0;
    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i - 1].x;
      const dy = path[i].y - path[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  };

  const getFrequencyFromPosition = (
    y: number,
    canvasHeight: number,
    strokeScale: string,
    strokeRootNote: string
  ): number => {
    const relativePosition = 1 - y / canvasHeight;
    const scaleIntervals = SCALES[strokeScale].intervals;
    const OCTAVES = 2;

    const baseFreq =
      NOTES.find((note) => note.name === strokeRootNote)?.frequency || 440;

    const scalePosition = Math.floor(
      relativePosition * (scaleIntervals.length * OCTAVES)
    );
    const octave = Math.floor(scalePosition / scaleIntervals.length);
    const noteIndex = scalePosition % scaleIntervals.length;

    const interval = scaleIntervals[noteIndex];
    const frequency = baseFreq * Math.pow(2, octave + interval / 12);

    return Math.min(Math.max(frequency, 20), 2000);
  };

  const startDrawing = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      if (isPlaying) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      let x, y;

      if ("touches" in e) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }

      setIsDrawing(true);
      currentStrokeRef.current = {
        path: [{ x, y }],
        note: "",
        duration: 0,
        instrument: selectedInstrument,
        scale: selectedScale,
        rootNote: rootNote,
        volume,
        color: getStrokeColor(selectedInstrument, selectedScale, rootNote),
      };
      lastDrawnPointRef.current = { x, y };

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    },
    [selectedInstrument, volume, isPlaying, selectedScale, rootNote]
  );

  const draw = useCallback(
    (
      e:
        | React.MouseEvent<HTMLCanvasElement>
        | React.TouchEvent<HTMLCanvasElement>
    ) => {
      if (isPlaying) return;
      e.preventDefault();
      if (!isDrawing) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      let x, y;

      if ("touches" in e) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }

      if (lastDrawnPointRef.current) {
        ctx.beginPath();
        ctx.moveTo(lastDrawnPointRef.current.x, lastDrawnPointRef.current.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = getStrokeColor(
          selectedInstrument,
          selectedScale,
          rootNote
        );
        ctx.stroke();
      }

      currentStrokeRef.current.path.push({ x, y });
      lastDrawnPointRef.current = { x, y };
    },
    [isDrawing, selectedInstrument, isPlaying, selectedScale, rootNote]
  );

  const playSound = useCallback((y: number, stroke: Stroke) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const canvasHeight = canvasRef.current?.height || 300;
    const frequency = getFrequencyFromPosition(
      y,
      canvasHeight,
      stroke.scale,
      stroke.rootNote
    );

    osc.type = stroke.instrument as OscillatorType;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(stroke.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  }, []);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastDrawnPointRef.current = null;

    if (currentStrokeRef.current.path.length > 0) {
      const strokeLength = calculateStrokeLength(currentStrokeRef.current.path);
      const lastY =
        currentStrokeRef.current.path[currentStrokeRef.current.path.length - 1]
          .y;

      const newStroke = {
        ...currentStrokeRef.current,
        duration: strokeLength,
        note: strokeLength.toString(),
        instrument: selectedInstrument,
        scale: selectedScale,
        rootNote: rootNote,
        volume: volume,
        color: getStrokeColor(selectedInstrument, selectedScale, rootNote),
      };

      playSound(lastY, newStroke as Stroke);
      setComposition((prev) => [...prev, newStroke as Stroke]);
    }
  }, [
    isDrawing,
    playSound,
    selectedInstrument,
    selectedScale,
    rootNote,
    volume,
  ]);

  const playComposition = useCallback(() => {
    if (composition.length === 0) return;

    setIsPlaying(true);

    const playLoop = (index: number) => {
      if (index >= composition.length) {
        index = 0;
      }

      const stroke = composition[index];
      const lastY = stroke.path[stroke.path.length - 1].y;
      playSound(lastY, stroke);

      // Highlight current stroke
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          drawGrid(ctx, canvas.width, canvas.height);
          composition.forEach((s, i) => {
            ctx.strokeStyle = i === index ? s.color : `${s.color}33`;
            ctx.beginPath();
            s.path.forEach((point, index) => {
              if (index === 0) ctx.moveTo(point.x, point.y);
              else ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
          });
        }
      }

      const baseDelay = Math.max(300, stroke.duration);
      const adjustedDelay = baseDelay / tempo;

      playbackTimeoutRef.current = window.setTimeout(
        () => playLoop(index + 1),
        adjustedDelay
      );
    };

    playLoop(0);
  }, [composition, tempo, playSound]);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
    }
    redrawComposition();
  }, [redrawComposition]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawGrid(ctx, canvas.width, canvas.height);
    setComposition([]);
    setIsPlaying(false);
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
    }
  }, []);

  return (
    <div className="fixed w-full h-screen select-none">
      <div className="absolute w-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2  ">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="w-full mb-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              <Select
                value={selectedInstrument}
                onValueChange={setSelectedInstrument}
              >
                <SelectTrigger className="[&>span>kbd]:hidden cursor-pointer">
                  <SelectValue placeholder="Select instrument" />
                </SelectTrigger>
                <SelectContent>
                  {INSTRUMENTS.map((inst) => (
                    <SelectItem
                      key={inst.type}
                      value={inst.type}
                      className="[&>*_span]:hidden"
                    >
                      {inst.name}
                      <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                        {inst.shortcut}
                      </kbd>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedScale}
                onValueChange={(value) => setSelectedScale(value)}
              >
                <SelectTrigger className="[&>span>kbd]:hidden cursor-pointer">
                  <SelectValue placeholder="Select scale" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(SCALES).map((scale) => (
                    <SelectItem
                      key={scale}
                      value={scale}
                      className="[&>*_span]:hidden"
                    >
                      {SCALES[scale].name}
                      <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                        {SCALES[scale].shortcut}
                      </kbd>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={rootNote} onValueChange={setRootNote}>
                <SelectTrigger className="[&>span>kbd]:hidden cursor-pointer">
                  <SelectValue placeholder="Root note" />
                </SelectTrigger>
                <SelectContent>
                  {NOTES.map((note) => (
                    <SelectItem
                      key={note.name}
                      value={note.name}
                      className="[&>*_span]:hidden"
                    >
                      {note.name}
                      <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                        {note.shortcut}
                      </kbd>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full mb-4 space-y-4">
              <div className="flex flex-col space-y-2">
                <span className="text-sm">Volume</span>
                <Slider
                  value={[volume * 100]}
                  onValueChange={(value) => setVolume(value[0] / 100)}
                  max={100}
                  step={1}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <span className="text-sm">Tempo</span>
                <Slider
                  value={[tempo * 100]}
                  onValueChange={(value) => setTempo(value[0] / 100)}
                  max={200}
                  min={50}
                  step={1}
                />
              </div>
            </div>
            <div className="relative w-full">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onMouseMove={draw}
                onTouchStart={startDrawing}
                onTouchEnd={stopDrawing}
                onTouchMove={draw}
                className="w-full h-96 border border-gray-300 rounded-lg shadow-lg touch-none bg-white"
              />
              <div className="flex absolute top-0 right-0 p-2">
                <Badge variant="secondary">{composition.length}</Badge>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end w-full space-x-4">
              <Button
                onClick={clearCanvas}
                disabled={isPlaying}
                className="cursor-pointer"
              >
                Clear
              </Button>
              <Button
                ref={playbackButtonRef}
                onMouseDown={(e) => e.preventDefault()}
                onClick={isPlaying ? stopPlayback : playComposition}
                disabled={composition.length === 0}
                className="aspect-square cursor-pointer p-0! fo"
              >
                {isPlaying ? <Square /> : <Play />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
