/** SDV EDUTECH brand palette (from logo) */
export const BRAND = {
  navy: "#002366",
  red: "#CC0000",
  white: "#FFFFFF",
} as const;

/** Premium theme surface roles */
export const THEME = {
  light: {
    sidebar: "Frosted white glass · navy text · red accents",
    canvas: "Cool off-white with subtle navy/red mesh",
    cards: "High-opacity white glass · soft layered shadows",
  },
  dark: {
    sidebar: "Deep navy shell · luminous red accents",
    canvas: "Rich navy-black with ambient glow",
    cards: "Elevated navy surfaces · inner highlight edge",
  },
} as const;

/** Enterprise design tokens — 8px grid, 12-column layout */
export const SPACING = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
  "2xl": 48,
} as const;

export const GRID_COLS = 12;

/** Survey / QC status visuals — SDV navy + red brand, AA-friendly contrast */
export const SURVEY_STATUS_BADGE: Record<string, string> = {
  draft: "border-border/70 bg-muted/60 text-muted-foreground",
  submitted:
    "border-brand-navy/35 bg-brand-navy/10 text-brand-navy dark:border-primary/40 dark:bg-primary/15 dark:text-primary-foreground",
  approved: "border-success/35 bg-success/12 text-emerald-800 dark:text-emerald-300",
  rejected: "border-brand-red/35 bg-brand-red/10 text-brand-red dark:text-brand-red-foreground",
};

export const QC_STATUS_BADGE: Record<string, string> = {
  pending:
    "border-warning/45 bg-warning/14 text-amber-950 dark:border-warning/40 dark:bg-warning/12 dark:text-amber-200",
  approved: "border-success/35 bg-success/12 text-emerald-800 dark:text-emerald-300",
  rejected: "border-brand-red/35 bg-brand-red/10 text-brand-red dark:text-brand-red-foreground",
};

export const SURVEY_ROW_TONE: Record<string, string> = {
  draft: "hover:bg-muted/35",
  submitted: "bg-brand-navy/4 hover:bg-brand-navy/8 dark:bg-primary/6 dark:hover:bg-primary/10",
  qcPending: "bg-warning/7 hover:bg-warning/12",
  approved: "bg-success/6 hover:bg-success/10",
  rejected: "bg-brand-red/5 hover:bg-brand-red/9",
};

export const NAV_ITEMS = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard", shortLabel: "Home" },
  { key: "surveys", href: "/surveys", label: "Surveys", shortLabel: "Surveys" },
  { key: "qc", href: "/qc", label: "Quality Control", shortLabel: "QC" },
  { key: "users", href: "/users", label: "Users", shortLabel: "Users" },
  { key: "roles", href: "/roles", label: "Roles", shortLabel: "Roles" },
  { key: "masters", href: "/masters", label: "Master Data", shortLabel: "Masters" },
  { key: "reports", href: "/reports", label: "Reports", shortLabel: "Reports" },
  { key: "audit", href: "/audit", label: "Audit Log", shortLabel: "Audit" },
  { key: "settings", href: "/settings", label: "Settings", shortLabel: "Settings" },
] as const;
