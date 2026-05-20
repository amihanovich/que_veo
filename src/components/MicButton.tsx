import { useEffect, useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

// Web Speech API types (no DOM lib types incluidas)
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function MicButton({
  onTranscript,
  lang = "es-ES",
  className,
}: {
  /** Recibe el texto reconocido — el llamador decide si reemplaza o concatena. */
  onTranscript: (text: string, isFinal: boolean) => void;
  lang?: string;
  className?: string;
}) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(!!getRecognitionCtor());
    return () => {
      try {
        recRef.current?.stop();
      } catch {
        /* noop */
      }
    };
  }, []);

  const start = () => {
    setErr(null);
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (final) onTranscript(final.trim(), true);
      else if (interim) onTranscript(interim.trim(), false);
    };
    rec.onerror = (e: any) => {
      setErr(
        e?.error === "not-allowed"
          ? "Permití el micrófono en el navegador."
          : "No pudimos escuchar. Intentá otra vez.",
      );
      setListening(false);
    };
    rec.onend = () => setListening(false);

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  const stop = () => {
    try {
      recRef.current?.stop();
    } catch {
      /* noop */
    }
    setListening(false);
  };

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={listening ? stop : start}
      title={err ?? (listening ? "Detener" : "Hablar")}
      aria-label={listening ? "Detener grabación" : "Dictar por voz"}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-full border transition-smooth",
        listening
          ? "animate-pulse border-destructive bg-destructive/15 text-destructive"
          : "border-border bg-background text-muted-foreground hover:text-primary",
        className,
      )}
    >
      {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}
