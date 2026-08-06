@tailwind base;
@tailwind components;
@tailwind utilities;

/* --- custom theme variables --- */
:root {
  --color-background: #05070d;
  --color-card: #0a0e1a;
  --color-card-darker: #070a14;
  --color-primary: #00c2ff;
  --color-up: #00d26a;
  --color-down: #ff4d5a;
  --color-border-dark: #162035;
  --color-muted: #8b9bb4;

  --font-sans: "Inter", system-ui, -apple-system, sans-serif;
  --radius-xl: 16px;
}

body {
  background-color: var(--color-background);
  color: #e5e9f5;
  font-family: var(--font-sans);
  min-height: 100vh;
  overflow-x: hidden;
}

/* Skeleton Loading Animation */
@keyframes shimmer {
  0% { background-color: rgba(255,255,255,0.05); }
  50% { background-color: rgba(255,255,255,0.12); }
  100% { background-color: rgba(255,255,255,0.05); }
}
.skeleton { animation: shimmer 1.5s infinite ease-in-out; }

/* Custom Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: #05070d; }
::-webkit-scrollbar-thumb { background: #162035; border-radius: 4px; }
