import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import { listMoments, deleteMoment, type MomentRow } from "@/lib/moments.functions";

export const Route = createFileRoute("/_authenticated/moments")({
  component: MomentsPage,
});

function MomentsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["moments"],
    queryFn: () => listMoments(),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteMoment({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["moments"] }),
  });

  return (
    <main className="mx-auto max-w-xl px-5 pb-12 animate-fade-in">
      <Link
        to="/"
        className="mb-4 inline-flex min-h-[40px] items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>
      <h1 className="text-2xl font-bold text-foreground">Tus Momentos</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Templates de situaciones que repetís.
      </p>

      <div className="mt-6 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
        {!isLoading && (data?.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">
            Todavía no guardaste ningún Momento. Configurá filtros y guardalo desde los
            resultados.
          </p>
        )}
        {data?.map((m: MomentRow) => (
          <article
            key={m.id}
            className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-card/70 p-4"
          >
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground">{m.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {[m.time_filter, m.company_filter, m.mood_filter, m.type_filter]
                  .filter(Boolean)
                  .join(" · ") || "Sin filtros (la IA decide todo)"}
              </p>
              {(m.platforms?.length ?? 0) > 0 && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {m.platforms.join(" · ")}
                </p>
              )}
              {m.auto_detected && (
                <span className="mt-2 inline-block rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  Sugerido automáticamente
                </span>
              )}
            </div>
            <button
              onClick={() => del.mutate(m.id)}
              className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label="Borrar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </article>
        ))}
      </div>
    </main>
  );
}
