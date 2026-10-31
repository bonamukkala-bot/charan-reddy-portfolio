import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  siReact,
  siFlask,
  siVite,
  siTypescript,
  siTailwindcss,
  siFramer,
  siFastapi,
  siPython,
  siTanstack,
  siMongodb,
  siSupabase,
  siPandas,
  siNumpy,
  siDocker,
  siJsonwebtokens,
  siCloudflare,
  siVercel,
} from 'simple-icons';

import {
  Globe,
  Activity,
  Trophy,
  Network,
  Bot,
  Sparkles,
  Eye,
  ScanSearch,
  Scale,
  Trees,
  BarChart3,
  TrendingUp,
  Zap,
  LineChart,
  Cpu,
} from 'lucide-react';

export type IconType = 'brand' | 'lucide' | 'initials';

export interface TechIconDefinition {
  type: IconType;
  canvas: HTMLCanvasElement;
  needsBacking: boolean;
  readyAt: number;
}

// Brand color luminance check for high-contrast on dark canvas (#0A0A0B)
function getContrastColor(hexColor: string): string {
  const cleanHex = hexColor.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
  const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
  const b = parseInt(cleanHex.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  if (luminance < 0.28) {
    return '#F4F4F0';
  }
  return `#${cleanHex}`;
}

// Pre-render simple-icons SVG path onto a 96x96 offscreen canvas
function createBrandIconCanvas(pathData: string, hexColor: string): HTMLCanvasElement {
  const size = 96;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const color = getContrastColor(hexColor);
  const padding = 16;
  const innerSize = size - padding * 2;
  const scale = innerSize / 24;

  ctx.translate(padding, padding);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  ctx.fill(new Path2D(pathData));

  return canvas;
}

// Pre-render Lucide React icon onto a 96x96 offscreen canvas via async img.decode()
async function createLucideIconCanvas(
  Component: React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>
): Promise<HTMLCanvasElement> {
  const size = 96;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const svgString = renderToStaticMarkup(
    React.createElement(Component, {
      color: '#C6FF3D',
      size: 64,
      strokeWidth: 1.75,
    })
  );

  const img = new Image();
  img.src = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;

  try {
    if (typeof (img as any).decode === 'function') {
      await img.decode();
    } else {
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    }
  } catch {
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
  }

  const offset = (size - 64) / 2;
  ctx.drawImage(img, offset, offset, 64, 64);
  return canvas;
}

// 1. Brand Logos via simple-icons
const brandMappings: Record<string, { path: string; hex: string }> = {
  React: { path: siReact.path, hex: siReact.hex },
  'React 19': { path: siReact.path, hex: siReact.hex },
  Flask: { path: siFlask.path, hex: siFlask.hex },
  Vite: { path: siVite.path, hex: siVite.hex },
  TypeScript: { path: siTypescript.path, hex: siTypescript.hex },
  'Tailwind CSS': { path: siTailwindcss.path, hex: siTailwindcss.hex },
  Tailwind: { path: siTailwindcss.path, hex: siTailwindcss.hex },
  'Framer Motion': { path: siFramer.path, hex: siFramer.hex },
  FastAPI: { path: siFastapi.path, hex: siFastapi.hex },
  Python: { path: siPython.path, hex: siPython.hex },
  'TanStack Router': { path: siTanstack.path, hex: siTanstack.hex },
  MongoDB: { path: siMongodb.path, hex: siMongodb.hex },
  Supabase: { path: siSupabase.path, hex: siSupabase.hex },
  pandas: { path: siPandas.path, hex: 'E70488' },
  NumPy: { path: siNumpy.path, hex: '4DABCF' },
  Docker: { path: siDocker.path, hex: siDocker.hex },
  JWT: { path: siJsonwebtokens.path, hex: '000000' },
  'Cloudflare Turnstile': { path: siCloudflare.path, hex: siCloudflare.hex },
  'Vercel Edge Functions': { path: siVercel.path, hex: '000000' },
};

// 2. Lucide Icons for Concepts
const lucideMappings: Record<
  string,
  React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>
> = {
  'Web App': Globe,
  Diagnostics: Activity,
  Hackathon: Trophy,
  'Multi-Agent': Network,
  'AI Agent': Bot,
  'AI Assistant': Sparkles,
  'Vision LLMs': Eye,
  'Image Analysis': ScanSearch,
  'Policy Synthesis': Scale,
  'Random Forest': Trees,
  SHAP: BarChart3,
  XGBoost: TrendingUp,
  LightGBM: Zap,
  Recharts: LineChart,
  Groq: Cpu,
  'Groq (Llama 4 Scout)': Cpu,
};

/**
 * Progressively loads tech icons:
 * 1) Front-facing items are prepared first (brand icons sync < 1ms, Lucide in parallel with decode).
 * 2) Remaining items are processed in background idle time using requestIdleCallback.
 * 3) As each icon arrives, it is registered with readyAt timestamp for a 150ms cross-fade in the draw loop.
 */
export function loadTechIcons(
  registry: Map<string, TechIconDefinition>,
  priorityNames: string[] = []
): void {
  const prioritySet = new Set(priorityNames);

  const loadBrand = (name: string, def: { path: string; hex: string }) => {
    if (registry.has(name)) return;
    try {
      const canvas = createBrandIconCanvas(def.path, def.hex);
      registry.set(name, {
        type: 'brand',
        canvas,
        needsBacking: true,
        readyAt: performance.now(),
      });
    } catch {
      // safe fallback
    }
  };

  const loadLucide = async (
    name: string,
    Component: React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>
  ) => {
    if (registry.has(name)) return;
    try {
      const canvas = await createLucideIconCanvas(Component);
      registry.set(name, {
        type: 'lucide',
        canvas,
        needsBacking: false,
        readyAt: performance.now(),
      });
    } catch {
      // safe fallback
    }
  };

  // 1. Process priority brand icons immediately (synchronous < 1ms)
  for (const name of priorityNames) {
    if (brandMappings[name]) {
      loadBrand(name, brandMappings[name]);
    }
  }

  // 2. Process priority Lucide icons in parallel (async Promise.all with decode)
  const priorityLucidePromises: Promise<void>[] = [];
  for (const name of priorityNames) {
    if (lucideMappings[name]) {
      priorityLucidePromises.push(loadLucide(name, lucideMappings[name]));
    }
  }

  // 3. Batch the remaining icons via requestIdleCallback with setTimeout fallback
  const scheduleIdle =
    typeof window !== 'undefined' && window.requestIdleCallback
      ? window.requestIdleCallback
      : (cb: () => void) => setTimeout(cb, 16);

  const remainingBrands = Object.entries(brandMappings).filter(([name]) => !prioritySet.has(name));
  const remainingLucide = Object.entries(lucideMappings).filter(([name]) => !prioritySet.has(name));

  Promise.all(priorityLucidePromises).finally(() => {
    scheduleIdle(() => {
      // Load remaining brand icons in batch
      for (const [name, def] of remainingBrands) {
        loadBrand(name, def);
      }

      // Load remaining Lucide icons in parallel
      const remainingPromises = remainingLucide.map(([name, Comp]) => loadLucide(name, Comp));
      Promise.all(remainingPromises).then(() => {
        if (typeof window !== 'undefined') {
          (window as unknown as { __allTechIconsReadyTime: number }).__allTechIconsReadyTime =
            performance.now();
        }
      });
    });
  });
}

/**
 * Backwards-compatibility helper for any legacy references
 */
export function buildTechIconRegistry(onIconReady?: () => void): Map<string, TechIconDefinition> {
  const registry = new Map<string, TechIconDefinition>();
  loadTechIcons(registry, Object.keys(brandMappings));
  if (onIconReady) {
    setTimeout(onIconReady, 50);
  }
  return registry;
}
