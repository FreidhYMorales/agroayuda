import type { ReactNode } from "react";

/**
 * Visual system for the form and the comparison. Choices (and why):
 * - warm off-white background and dark green-grey text: less glare, contrast above 4.5:1;
 * - one calm primary color (green) for actions, amber for caution, brick for "no": state is
 *   always shown by symbol + text as well (✓ ✗ ⚠ ● ▲ ▼), never by color alone;
 * - one idea per card and generous spacing (small working memory), 48 px targets (Fitts);
 * - the recommended column is tinted and framed so the eye lands on it first (isolation effect);
 * - quick, quiet feedback (120 ms) that stops when the person asks for reduced motion;
 * - hover only on devices that hover: on a touch screen it would stick after a tap;
 * - below 360 px (small Android, iPhone SE zoomed) the table is a bit denser so it fits 320 px.
 * Width, centering and side padding come from .ag-screen (src/ui/layout.ts), which also gives
 * the tablet and desktop views.
 */
export const THEME_CSS = `
.ag{padding-top:16px;padding-bottom:max(40px,env(safe-area-inset-bottom));background:#faf7f0;
color:#1e2a22;font:17px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.ag *{box-sizing:border-box}
.ag h2{font-size:21px;line-height:1.25;margin:0 0 12px;font-weight:700}
.ag h3{font-size:17px;margin:0 0 6px;font-weight:700;color:#1f5e3b}
.ag p{margin:8px 0}
.ag ul{margin:0;padding-left:20px}
.ag-muted{color:#5a5a4a;font-size:15px}
.ag-card{background:#fff;border:1px solid #e4ddcb;border-radius:16px;padding:16px;margin:14px 0;
box-shadow:0 1px 2px rgba(60,50,20,.06)}
.ag-btn{min-height:48px;min-width:48px;padding:10px 16px;font:inherit;border-radius:12px;
border:2px solid #c9c0a8;background:#fff;color:#1e2a22;cursor:pointer;
transition:background .12s,border-color .12s}
.ag-btn:focus-visible,.ag-choice:focus-within{outline:3px solid #1f5e3b;outline-offset:2px}
.ag-btn[aria-pressed="true"]{background:#e3f1e6;border-color:#1f5e3b;font-weight:700}
.ag-btn:disabled{background:#e8e4d6;color:#6b665a;border-color:#e8e4d6;cursor:not-allowed}
.ag-primary{width:100%;background:#1f5e3b;border-color:#1f5e3b;color:#fff;font-weight:700}
.ag-link{background:transparent;border-color:transparent;color:#1f5e3b;font-weight:600;padding-left:4px}
.ag-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.ag-crop{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;
min-height:76px}
.ag-icon{font-size:28px;line-height:1}
.ag-choice{position:relative;display:inline-flex;align-items:center;justify-content:center;
border:2px solid #c9c0a8;background:#fff;cursor:pointer;transition:background .12s,border-color .12s}
.ag-choice input{position:absolute;inset:0;margin:0;opacity:0;cursor:pointer}
.ag-choice[data-checked="true"]{background:#1f5e3b;border-color:#1f5e3b;color:#fff;font-weight:700}
.ag-circles{display:flex;justify-content:space-between;gap:6px}
.ag-notice{background:#fff4d6;border:2px solid #b7791f;color:#5c3b00;border-radius:12px;
padding:12px 14px;font-weight:700}
.ag-info{background:#e8f0f5;border:1px solid #9db7c9;color:#1d3b53;border-radius:12px;
padding:12px 14px;font-weight:600}
.ag-skel{background:linear-gradient(90deg,#eae5d6 25%,#f4f0e4 50%,#eae5d6 75%);
background-size:200% 100%;animation:ag-shimmer 1.4s linear infinite;border-radius:12px}
@keyframes ag-shimmer{to{background-position:-200% 0}}
.ag-table{width:100%;table-layout:fixed;border-collapse:separate;border-spacing:4px 0;font-size:15px}
.ag-table th,.ag-table td{padding:10px 4px;vertical-align:top;text-align:left;
border-bottom:1px solid #e4ddcb}
.ag-table th[scope="row"]{font-weight:600;width:26%}
.ag-col-recommended{background:#e9f4ec;border-left:2px solid #1f5e3b;border-right:2px solid #1f5e3b}
.ag-colhead{width:100%;min-height:48px;padding:6px 2px;font-size:15px;font-weight:700}
.ag-badge{display:block;margin:6px 0 0;padding:4px 6px;border-radius:8px;font-size:13px;
font-weight:700;line-height:1.3}
.ag-badge[data-badge="recommended"]{background:#cfe8d5;color:#14532d}
.ag-badge-icon{width:28px;height:28px;padding:0;display:flex;align-items:center;justify-content:center;
border-radius:50%;font-size:16px}
.ag-note{border-radius:12px;padding:10px 14px;font-weight:700;margin:0 0 8px}
.ag-note[data-badge="recommended"]{background:#cfe8d5;color:#14532d}
.ag-note[data-badge="warning"]{background:#fff0c9;color:#6b4300}
.ag-note[data-badge="not_recommended"]{background:#fbe3e0;color:#8a1f17}
.ag-badge[data-badge="not_recommended"]{background:#fbe3e0;color:#8a1f17}
.ag-badge[data-badge="warning"]{background:#fff0c9;color:#6b4300}
.ag-bar{display:flex;align-items:center;gap:6px}
.ag-track{flex:1;height:10px;background:#e4ddcb;border-radius:6px;overflow:hidden}
.ag-fill{display:block;height:100%;background:#1f5e3b;border-radius:6px}
.ag-low{background:#fff0c9;outline:2px solid #b7791f;outline-offset:-2px;font-weight:700;color:#3d2800}
@media (max-width:359px){.ag-table{font-size:14px}.ag-table th[scope="row"]{width:22%}}
@media (hover:hover){.ag-btn:hover:not(:disabled){background:#f3eedf}
.ag-primary:hover:not(:disabled){background:#184b2f}}
@media (prefers-reduced-motion:reduce){.ag *{animation:none!important;transition:none!important}}
`;

/** Wraps a screen with the page frame and its styles. */
export function Page({ children }: { children: ReactNode }) {
  return (
    <div className="ag ag-screen">
      <style>{THEME_CSS}</style>
      {children}
    </div>
  );
}

export const visuallyHidden = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
} as const;
