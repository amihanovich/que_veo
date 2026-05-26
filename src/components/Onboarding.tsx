import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { saveOnboarding } from "@/lib/guestSeed";
import { cn } from "@/lib/utils";

const AGE_OPTIONS = ["Menos de 20", "20–29", "30–39", "40–49", "50+"];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState("");
  const [titles, setTitles] = useState<string[]>([]);

  const addTitle = () => {
    const t = titleInput.trim();
    if (t && titles.length < 5 && !titles.includes(t)) {
      setTitles([...titles, t]);
      setTitleInput("");
    }
  };

  const removeTitle = (t: string) => setTitles(titles.filter((x) => x !== t));

  const handleDone = () => {
    saveOnboarding(ageGroup, titles);
    onDone();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 px-4 pb-6 pt-20 backdrop-blur-sm sm:items-center sm:pb-0 animate-fade-in"
      onClick={handleDone}
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-2">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-3 w-3" />
              Personalización rápida
            </div>
            <h2 className="text-xl font-bold text-foreground">¿Qué te gusta ver?</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Opcional. Mejora tu primera recomendación.
            </p>
          </div>
          <button onClick={handleDone} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Age group */}
        <div className="mb-5">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            ¿Qué edad tenés? (opcional)
          </p>
          <div className="flex flex-wrap gap-2">
            {AGE_OPTIONS.map((a) => (
              <button
                key={a}
                onClick={() => setAgeGroup(ageGroup === a ? null : a)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-smooth",
                  ageGroup === a
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-card/60 text-muted-foreground hover:text-foreground",
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Favorite titles */}
        <div className="mb-6">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            2–3 títulos que te gustaron (opcional)
          </p>
          <div className="flex gap-2">
            <input
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addTitle(); }
              }}
              placeholder="Ej: Breaking Bad, Interstellar…"
              className="min-h-[40px] flex-1 rounded-xl border border-border bg-input px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <button
              onClick={addTitle}
              disabled={!titleInput.trim() || titles.length >= 5}
              className="min-h-[40px] rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-40"
            >
              +
            </button>
          </div>
          {titles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {titles.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
                >
                  {t}
                  <button onClick={() => removeTitle(t)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleDone}
          className="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-gradient-primary px-6 text-sm font-semibold text-primary-foreground shadow-primary transition-smooth active:scale-[0.98]"
        >
          Listo →
        </button>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          No guardamos estos datos en ningún servidor.
        </p>
      </div>
    </div>
  );
}
