// Inline SVG logos for each streaming platform — no external dependencies.

type Props = { className?: string; style?: React.CSSProperties };

export function NetflixLogo({ className, style }: Props) {
  return (
    <svg viewBox="0 0 24 24" height="22" className={className} style={style} aria-label="Netflix" fill="#E50914">
      <path d="M5.398 0v.006c3.028 8.556 5.37 15.175 8.348 23.596 2.344.058 4.85.398 4.85.398L14.518 15.9l3.908-15.9H14.6l-2.244 8.884L9.753.006zm.002 0 2.109 5.922 1.87-5.922zm.001 23.99c2.144-.042 4.492.428 4.492.428L11.15 18.82l-5.75-15.24v20.41z" />
    </svg>
  );
}

export function DisneyPlusLogo({ className, style }: Props) {
  return (
    <svg viewBox="0 0 24 24" height="18" className={className} style={style} aria-label="Disney+" fill="#113CCF">
      <path d="M11.565 9.137c-.16-.27-.35-.522-.584-.749a4.33 4.33 0 0 0-.794-.592 4.73 4.73 0 0 0-.96-.396 5.6 5.6 0 0 0-1.084-.179c-.38-.03-.764-.019-1.143.025a7.3 7.3 0 0 0-1.1.233 7.6 7.6 0 0 0-1.033.413 7.5 7.5 0 0 0-.94.573c-.29.21-.56.44-.808.692-.246.25-.47.52-.665.812A6 6 0 0 0 2 12c0 .39.041.77.12 1.138.078.368.193.724.34 1.065.146.341.323.666.526.974.204.309.434.6.685.872.253.271.525.522.817.748.293.226.604.427.931.6.328.172.67.314 1.022.425.352.111.715.19 1.083.235.368.046.738.058 1.108.038.37-.02.739-.076 1.098-.165a5.9 5.9 0 0 0 1.03-.37 5.5 5.5 0 0 0 .917-.567 5 5 0 0 0 .772-.745 4.7 4.7 0 0 0 .597-.912 4.6 4.6 0 0 0 .355-1.055c.08-.375.107-.76.08-1.146a4.4 4.4 0 0 0-.206-1.12 4.2 4.2 0 0 0-.51-1.019zm-1.328 3.555a2.94 2.94 0 0 1-.31.726 2.7 2.7 0 0 1-.484.585 2.5 2.5 0 0 1-.639.403 2.7 2.7 0 0 1-.762.197 3 3 0 0 1-.796-.024 2.9 2.9 0 0 1-.743-.24 2.7 2.7 0 0 1-.624-.437 2.5 2.5 0 0 1-.464-.617 2.6 2.6 0 0 1-.262-.764 2.9 2.9 0 0 1-.019-.807 2.9 2.9 0 0 1 .2-.773c.11-.247.253-.475.426-.678a2.7 2.7 0 0 1 .592-.517 2.8 2.8 0 0 1 .724-.312 2.9 2.9 0 0 1 .793-.089c.267.012.532.068.782.165a2.6 2.6 0 0 1 .683.41c.197.175.368.38.505.607.136.228.236.476.296.736.06.26.079.531.055.797a2.8 2.8 0 0 1-.153.73zm8.6-5.62h-2.043v9.856h2.044V7.072zm.88 4.264v1.517h2.282v2.6h1.521v-2.6H24v-1.517h-.48v-2.6h-1.52v2.6z" />
    </svg>
  );
}

export function MaxLogo({ className, style }: Props) {
  return (
    <svg viewBox="0 0 24 24" height="14" className={className} style={style} aria-label="Max" fill="#002BE7">
      <path d="M0 7.2h3.36l2.52 6.04L8.4 7.2h3.36v9.6H9.12v-6.28l-2.72 6.28H4.8L2.64 10.52V16.8H0zm13.68 0h2.64v9.6h-2.64zm3.6 0h3.36l1.92 3.04L24.24 7.2H24v9.6h-2.64v-5.04l-1.92 3.04-1.92-3.04V16.8h-2.64V7.2z" />
    </svg>
  );
}

export function PrimeVideoLogo({ className, style }: Props) {
  return (
    <svg viewBox="0 0 24 24" height="16" className={className} style={style} aria-label="Prime Video" fill="#00A8E1">
      <path d="M6.144 7.2 2.4 16.8h2.352l.768-2.016h3.744l.768 2.016h2.4L8.688 7.2zm.768 5.616.912-2.448.912 2.448zm5.712-5.616v9.6h2.352v-3.744l2.832 3.744H20.4l-3.168-4.08 3.024-5.52h-2.4l-2.064 3.936V7.2zm5.952 8.832c1.44.576 3.024.768 4.608.48l-.48-1.104c-1.056.192-2.16.096-3.168-.288zm.288 1.392c-.48.192-.48.864 0 1.056.912.384 1.92.528 2.928.432l-.336-1.104c-.864.096-1.776-.048-2.592-.384z" />
    </svg>
  );
}

export function AppleTVLogo({ className, style }: Props) {
  return (
    <svg viewBox="0 0 24 24" height="16" className={className} style={style} aria-label="Apple TV+" fill="#111111">
      <path d="M8.195 8.615c.668 0 1.248-.224 1.74-.67.494-.45.74-1.014.74-1.696 0-.127-.01-.27-.032-.43a2.86 2.86 0 0 1-.76.79 1.91 1.91 0 0 1-1.138.36c-.63 0-1.2-.222-1.71-.665a2.28 2.28 0 0 1-.765-1.754c0-.62.215-1.15.645-1.585.43-.437.97-.655 1.62-.655.36 0 .693.077 1 .23.305.153.57.378.793.675.223.296.397.643.52 1.04.125.396.186.824.186 1.284 0 .862-.216 1.587-.65 2.174-.434.587-1.02.88-1.76.88l-.43-.178zm.43-1.258c.39 0 .72-.15.99-.448.27-.3.405-.67.405-1.11 0-.44-.135-.814-.405-1.12a1.29 1.29 0 0 0-.99-.46c-.38 0-.703.153-.97.46a1.55 1.55 0 0 0-.402 1.12c0 .44.134.81.402 1.11.267.3.59.448.97.448zM1 16.8V7.2h1.8v3.95h3.6V7.2H8.2v9.6H6.4v-4.23H2.8V16.8zm10.2 0-3.3-9.6h1.875l2.325 7.2 2.325-7.2H16.3l-3.3 9.6zm7.8 0v-8.1h-2.7V7.2H23v1.5h-2.7V16.8z" />
    </svg>
  );
}

export function ParamountPlusLogo({ className, style }: Props) {
  return (
    <svg viewBox="0 0 24 24" height="20" className={className} style={style} aria-label="Paramount+" fill="#0064FF">
      <path d="M12 2L4 14h4v6h8v-6h4L12 2zm0 3.2 5.6 8.8H14v6h-4v-6H6.4L12 5.2zM19 13h2v2h2v2h-2v2h-2v-2h-2v-2h2v-2z" />
    </svg>
  );
}

export function StarPlusLogo({ className, style }: Props) {
  return (
    <svg viewBox="0 0 24 24" height="18" className={className} style={style} aria-label="Star+" fill="#1CE783">
      <path d="M12 2l2.68 5.43 5.99.87-4.33 4.22 1.02 5.96L12 15.77l-5.36 2.71 1.02-5.96L3.33 8.3l5.99-.87L12 2zm0 2.6L9.9 8.84l-4.58.66 3.32 3.23-.78 4.56L12 15.1l4.14 2.19-.78-4.56 3.32-3.23-4.58-.66L12 4.6zM19 13h2v2h2v2h-2v2h-2v-2h-2v-2h2v-2z" />
    </svg>
  );
}

const LOGO_MAP: Record<string, React.FC<Props>> = {
  "Netflix": NetflixLogo,
  "Disney+": DisneyPlusLogo,
  "Max": MaxLogo,
  "Prime Video": PrimeVideoLogo,
  "Apple TV+": AppleTVLogo,
  "Paramount+": ParamountPlusLogo,
  "Star+": StarPlusLogo,
};

export function PlatformLogo({ platform, className, style }: { platform: string } & Props) {
  const Logo = LOGO_MAP[platform];
  if (!Logo) return <span className={className} style={style}>{platform}</span>;
  return <Logo className={className} style={style} />;
}
