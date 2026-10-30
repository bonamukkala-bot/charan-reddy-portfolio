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
  canvas: HTMLCanvasElement | null;
  needsBacking: boolean;
}

// Brand color luminance check
function getContrastColor(hexColor: string): string {
  const cleanHex = hexColor.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
  const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
  const b = parseInt(cleanHex.slice(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  // If luminance is too dark on #0A0A0B canvas, use off-white #F4F4F0
  if (luminance < 0.28) {
    return '#F4F4F0';
  }
  return `#${cleanHex}`;
}

// Pre-render simple-icons SVG path onto a 112x112 offscreen canvas
function createBrandIconCanvas(pathData: string, hexColor: string): HTMLCanvasElement {
  const size = 112;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const color = getContrastColor(hexColor);
  const padding = 18;
  const innerSize = size - padding * 2;
  const scale = innerSize / 24;

  ctx.translate(padding, padding);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  ctx.fill(new Path2D(pathData));

  return canvas;
}

// Pre-render Lucide React icon onto a 112x112 offscreen canvas via data URI
function createLucideIconCanvas(
  Component: React.ComponentType<{ color?: string; size?: number; strokeWidth?: number }>,
  onReady: () => void
): HTMLCanvasElement {
  const size = 112;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Lucide concept icons use lime accent #C6FF3D with 1.75 stroke
  const svgString = renderToStaticMarkup(
    React.createElement(Component, {
      color: '#C6FF3D',
      size: 76,
      strokeWidth: 1.75,
    })
  );

  const img = new Image();
  img.src = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
  img.onload = () => {
    ctx.clearRect(0, 0, size, size);
    // Center inside 112x112
    const offset = (size - 76) / 2;
    ctx.drawImage(img, offset, offset, 76, 76);
    onReady();
  };

  return canvas;
}

/**
 * Registry mapping for all 35 technologies:
 * Fallback order:
 * 1) simple-icons brand logo
 * 2) lucide-react concept icon
 * 3) initials badge
 */
export function buildTechIconRegistry(onIconReady: () => void): Map<string, TechIconDefinition> {
  const registry = new Map<string, TechIconDefinition>();

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
    pandas: { path: siPandas.path, hex: 'E70488' }, // pandas pink/magenta for contrast
    NumPy: { path: siNumpy.path, hex: '4DABCF' }, // numpy cyan/light-blue for contrast
    Docker: { path: siDocker.path, hex: siDocker.hex },
    JWT: { path: siJsonwebtokens.path, hex: '000000' }, // Jsonwebtokens rendered off-white
    'Cloudflare Turnstile': { path: siCloudflare.path, hex: siCloudflare.hex },
    'Vercel Edge Functions': { path: siVercel.path, hex: '000000' }, // Vercel rendered off-white
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

  // Build brand canvases
  for (const [name, def] of Object.entries(brandMappings)) {
    try {
      const canvas = createBrandIconCanvas(def.path, def.hex);
      registry.set(name, {
        type: 'brand',
        canvas,
        needsBacking: true,
      });
    } catch {
      // safe fallback
    }
  }

  // Build Lucide canvases
  for (const [name, Component] of Object.entries(lucideMappings)) {
    try {
      const canvas = createLucideIconCanvas(Component, onIconReady);
      registry.set(name, {
        type: 'lucide',
        canvas,
        needsBacking: false,
      });
    } catch {
      // safe fallback
    }
  }

  return registry;
}
