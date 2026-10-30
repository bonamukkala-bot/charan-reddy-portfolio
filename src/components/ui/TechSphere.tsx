import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { buildTechIconRegistry, TechIconDefinition } from './techIconRegistry';

export type TechLayer = 'Build' | 'AI' | 'Data' | 'Ship';

export interface TechSphereItem {
  name: string;
  category: TechLayer;
  projects: string[];
  usageCount: number;
  initials: string;
}

interface TechSphereProps {
  items: TechSphereItem[];
  activeFilter: TechLayer | 'All';
  selectedTech: string | null;
  onSelectTech: (techName: string | null) => void;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

// Precomputed Fibonacci sphere coordinates (N = 35)
function computeFibonacciSphere(n: number): Point3D[] {
  const points: Point3D[] = [];
  const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * i) / (n - 1); // 1 to -1
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = 2 * Math.PI * (i / phi);
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;
    points.push({ x, y, z });
  }
  return points;
}

// Precomputed wireframe parallels and meridians
function createWireframeGeometry() {
  const parallels: Point3D[][] = [];
  const yValues = [-0.72, -0.38, 0, 0.38, 0.72];
  const steps = 40;

  for (const y of yValues) {
    const ring: Point3D[] = [];
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      ring.push({
        x: Math.cos(angle) * r,
        y,
        z: Math.sin(angle) * r,
      });
    }
    parallels.push(ring);
  }

  const meridians: Point3D[][] = [];
  const meridianCount = 8;
  for (let m = 0; m < meridianCount; m++) {
    const lon = (m / meridianCount) * Math.PI;
    const line: Point3D[] = [];
    for (let i = 0; i <= steps; i++) {
      const lat = (i / steps) * Math.PI * 2;
      line.push({
        x: Math.sin(lat) * Math.cos(lon),
        y: Math.cos(lat),
        z: Math.sin(lat) * Math.sin(lon),
      });
    }
    meridians.push(line);
  }

  return { parallels, meridians };
}

export function TechSphere({
  items,
  activeFilter,
  selectedTech,
  onSelectTech,
}: TechSphereProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [tooltipData, setTooltipData] = useState<{
    item: TechSphereItem;
    x: number;
    y: number;
  } | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [, setIconsLoadedCount] = useState(0);

  // Precomputed Fibonacci Points & Wireframe
  const fibonacciPoints = useMemo(() => computeFibonacciSphere(items.length), [items.length]);
  const wireframeGeo = useMemo(() => createWireframeGeometry(), []);

  // Icon registry (pre-rendered offscreen canvases)
  const iconRegistryRef = useRef<Map<string, TechIconDefinition> | null>(null);

  useEffect(() => {
    iconRegistryRef.current = buildTechIconRegistry(() => {
      // Trigger re-render when async Lucide data-URIs finish drawing
      setIconsLoadedCount((c) => c + 1);
    });
  }, []);

  // Motion and rotation physics state in refs (zero-allocation 60fps loop)
  const physicsRef = useRef({
    rotationY: 0,
    tiltX: 0.26, // ~15 degrees fixed base tilt
    targetTiltX: 0.26,
    autoSpeed: 0.18, // rad/s
    currentSpeed: 0.18,
    isInteracting: false,
    dragStartX: 0,
    dragStartY: 0,
    lastDragX: 0,
    lastDragY: 0,
    lastDragTime: 0,
    velocityX: 0,
    velocityY: 0,
    hoveredIndex: -1,
    spreadProgress: 0,
    hasEntered: false,
    prefersReducedMotion: false,
    width: 600,
    height: 600,
  });

  // Check mobile breakpoint
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    physicsRef.current.prefersReducedMotion = mediaQuery.matches;
    if (mediaQuery.matches) {
      physicsRef.current.autoSpeed = 0;
      physicsRef.current.currentSpeed = 0;
      physicsRef.current.spreadProgress = 1;
    }
    const handler = (e: MediaQueryListEvent) => {
      physicsRef.current.prefersReducedMotion = e.matches;
      if (e.matches) {
        physicsRef.current.autoSpeed = 0;
        physicsRef.current.currentSpeed = 0;
        physicsRef.current.spreadProgress = 1;
      } else {
        physicsRef.current.autoSpeed = 0.18;
      }
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Sync selectedTech into physicsRef
  useEffect(() => {
    const idx = items.findIndex((it) => it.name === selectedTech);
    physicsRef.current.hoveredIndex = idx;
    if (idx === -1) {
      setTooltipData(null);
    }
  }, [selectedTech, items]);

  // Main Canvas Rendering & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let rafId: number;
    let lastTime = performance.now();
    let isVisible = true;

    // IntersectionObserver to pause loop when offscreen (with rootMargin ~300px)
    const observer = new IntersectionObserver(
      ([entry]) => {
        const nowVisible = entry.isIntersecting;
        if (nowVisible !== isVisible) {
          isVisible = nowVisible;
          if (isVisible) {
            lastTime = performance.now();
            if (!rafId) {
              rafId = requestAnimationFrame(render);
            }
          } else if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = 0;
          }
        }
        if (entry.isIntersecting && !physicsRef.current.hasEntered) {
          physicsRef.current.hasEntered = true;
        }
      },
      { rootMargin: '300px', threshold: 0 }
    );
    observer.observe(canvas);

    // Tab visibility listener
    const onVisibilityChange = () => {
      const nowVisible = document.visibilityState === 'visible';
      if (nowVisible !== isVisible) {
        isVisible = nowVisible;
        if (isVisible) {
          lastTime = performance.now();
          if (!rafId) {
            rafId = requestAnimationFrame(render);
          }
        } else if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Resize handling with devicePixelRatio scaling
    const handleResize = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const size = Math.min(rect.width, 680);
      physicsRef.current.width = size;
      physicsRef.current.height = size;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Projected items buffer (reused every frame)
    const projectedItems: {
      index: number;
      item: TechSphereItem;
      sx: number;
      sy: number;
      z: number;
      scale: number;
      opacity: number;
      isHovered: boolean;
    }[] = [];

    // Suppressed labels set for crowded front items
    const suppressedLabels = new Set<number>();

    // Animation frame render function
    const render = (now: number) => {
      if (!isVisible) {
        rafId = 0;
        return;
      }
      rafId = requestAnimationFrame(render);

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const p = physicsRef.current;

      // Entrance spread animation (0 to 1 over ~1s)
      if (p.hasEntered && p.spreadProgress < 1 && !p.prefersReducedMotion) {
        p.spreadProgress = Math.min(1, p.spreadProgress + dt * 1.05);
      } else if (p.prefersReducedMotion) {
        p.spreadProgress = 1;
      }
      const easeSpread = 1 - Math.pow(1 - p.spreadProgress, 3);

      // Auto-rotation & deceleration when hovered or dragging
      const targetSpeed = p.hoveredIndex !== -1 || p.isInteracting ? 0 : p.autoSpeed;
      p.currentSpeed += (targetSpeed - p.currentSpeed) * Math.min(1, dt * 5.5);

      if (!p.isInteracting) {
        // Inertia decay
        p.rotationY += p.velocityX * dt;
        p.tiltX += p.velocityY * dt;
        p.velocityX *= Math.pow(0.88, dt * 60);
        p.velocityY *= Math.pow(0.88, dt * 60);

        // Continuous rotation
        p.rotationY += p.currentSpeed * dt;

        // Restore tilt smoothly to base tilt (0.26)
        p.tiltX += (p.targetTiltX - p.tiltX) * Math.min(1, dt * 2.2);
      }

      // Canvas setup
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, p.width, p.height);

      const cx = p.width / 2;
      const cy = p.height / 2;
      // Radius ensures full sphere visibility with generous padding
      const sphereRadius = p.width * 0.35 * (0.85 + 0.15 * easeSpread);
      const cameraDistance = 2.4;

      const cosY = Math.cos(p.rotationY);
      const sinY = Math.sin(p.rotationY);
      const cosX = Math.cos(p.tiltX);
      const sinX = Math.sin(p.tiltX);

      // Rotate 3D vector helper
      const projectPoint = (pt: Point3D, rMultiplier = 1) => {
        // Y-axis rotation
        const x1 = pt.x * cosY + pt.z * sinY;
        const y1 = pt.y;
        const z1 = -pt.x * sinY + pt.z * cosY;

        // X-axis tilt
        const x2 = x1;
        const y2 = y1 * cosX - z1 * sinX;
        const z2 = y1 * sinX + z1 * cosX;

        // Perspective projection
        const k = cameraDistance / (cameraDistance - z2);
        const r = sphereRadius * rMultiplier;
        const sx = cx + x2 * r * k;
        const sy = cy - y2 * r * k;

        return { sx, sy, z: z2, k };
      };

      // 1. Draw subtle inner sphere volumetric backing & glow
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, sphereRadius * 1.05);
      bgGrad.addColorStop(0, 'rgba(198, 255, 61, 0.022)');
      bgGrad.addColorStop(0.7, 'rgba(17, 17, 20, 0.25)');
      bgGrad.addColorStop(0.96, 'rgba(10, 10, 11, 0.85)');
      bgGrad.addColorStop(1, 'rgba(198, 255, 61, 0.06)');

      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, sphereRadius, 0, Math.PI * 2);
      ctx.fill();

      // Outer delicate rim circle
      ctx.strokeStyle = 'rgba(198, 255, 61, 0.14)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, sphereRadius, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Draw wireframe latitude & longitude mesh
      ctx.save();
      // Back wireframe lines
      ctx.lineWidth = 0.75;
      for (const parallel of wireframeGeo.parallels) {
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < parallel.length; i++) {
          const pt = projectPoint(parallel[i]);
          if (pt.z <= 0.05) {
            if (!started) {
              ctx.moveTo(pt.sx, pt.sy);
              started = true;
            } else {
              ctx.lineTo(pt.sx, pt.sy);
            }
          } else {
            started = false;
          }
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
        ctx.stroke();
      }

      for (const meridian of wireframeGeo.meridians) {
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < meridian.length; i++) {
          const pt = projectPoint(meridian[i]);
          if (pt.z <= 0.05) {
            if (!started) {
              ctx.moveTo(pt.sx, pt.sy);
              started = true;
            } else {
              ctx.lineTo(pt.sx, pt.sy);
            }
          } else {
            started = false;
          }
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
        ctx.stroke();
      }

      // Front wireframe lines (crisp lime/white tinted)
      ctx.lineWidth = 0.9;
      for (const parallel of wireframeGeo.parallels) {
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < parallel.length; i++) {
          const pt = projectPoint(parallel[i]);
          if (pt.z > -0.05) {
            if (!started) {
              ctx.moveTo(pt.sx, pt.sy);
              started = true;
            } else {
              ctx.lineTo(pt.sx, pt.sy);
            }
          } else {
            started = false;
          }
        }
        ctx.strokeStyle = 'rgba(198, 255, 61, 0.09)';
        ctx.stroke();
      }

      for (const meridian of wireframeGeo.meridians) {
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < meridian.length; i++) {
          const pt = projectPoint(meridian[i]);
          if (pt.z > -0.05) {
            if (!started) {
              ctx.moveTo(pt.sx, pt.sy);
              started = true;
            } else {
              ctx.lineTo(pt.sx, pt.sy);
            }
          } else {
            started = false;
          }
        }
        ctx.strokeStyle = 'rgba(198, 255, 61, 0.09)';
        ctx.stroke();
      }

      // Small node dots at parallels/meridians intersections
      for (let m = 0; m < wireframeGeo.meridians.length; m += 2) {
        const meridian = wireframeGeo.meridians[m];
        for (let i = 0; i < meridian.length; i += 8) {
          const pt = projectPoint(meridian[i]);
          if (pt.z > 0.1) {
            ctx.fillStyle = `rgba(198, 255, 61, ${0.15 + pt.z * 0.25})`;
            ctx.beginPath();
            ctx.arc(pt.sx, pt.sy, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();

      // 3. Project all 35 technology items
      projectedItems.length = 0;
      for (let i = 0; i < items.length; i++) {
        const rawPt = fibonacciPoints[i] || { x: 0, y: 0, z: 0 };
        const itemRMult = 0.2 + 0.8 * easeSpread;
        const pt = projectPoint(rawPt, itemRMult);

        const zNorm = (pt.z + 1) / 2; // 0 (back) to 1 (front)
        // Scale: ~0.55 on back to 1.0 on front
        let scale = 0.55 + 0.45 * zNorm;

        // Opacity: back items are at most 0.20; front items 0.20 to 1.0
        let opacity = pt.z <= 0 ? 0.2 * (1 + pt.z) : 0.2 + 0.8 * pt.z;
        opacity = Math.max(0.12, Math.min(1.0, opacity));

        // Dim if not in active filter (20% opacity)
        if (activeFilter !== 'All' && items[i].category !== activeFilter) {
          opacity *= 0.2;
        }

        const isHovered = p.hoveredIndex === i;
        if (isHovered) {
          scale *= 1.25;
          opacity = 1.0;
        }

        projectedItems.push({
          index: i,
          item: items[i],
          sx: pt.sx,
          sy: pt.sy,
          z: pt.z,
          scale,
          opacity,
          isHovered,
        });
      }

      // Depth sort: back items draw first, front items draw last
      projectedItems.sort((a, b) => a.z - b.z);

      // Pre-compute overlapping labels on the front face to avoid collisions (only show on hover if crowded)
      suppressedLabels.clear();
      for (let i = projectedItems.length - 1; i >= 0; i--) {
        const itemA = projectedItems[i];
        if (itemA.z <= 0.15) continue;
        for (let j = i - 1; j >= 0; j--) {
          const itemB = projectedItems[j];
          if (itemB.z <= 0.15) continue;
          const dx = itemA.sx - itemB.sx;
          const dy = itemA.sy - itemB.sy;
          if (dx * dx + dy * dy < 2704) {
            // ~52px distance threshold
            suppressedLabels.add(itemB.index);
          }
        }
      }

      // 4. Render each technology icon directly on the sphere
      // Target front icon size: ~46 to 52px (scaled down on mobile)
      const baseIconSize = isMobile ? 40 : 48;
      const registry = iconRegistryRef.current;

      for (let i = 0; i < projectedItems.length; i++) {
        const pItem = projectedItems[i];
        const { sx, sy, z, scale, opacity, isHovered, item } = pItem;
        const iconSize = baseIconSize * scale;
        const halfSize = iconSize / 2;

        ctx.save();
        ctx.globalAlpha = opacity;

        const iconDef = registry?.get(item.name);

        // Hover aura / glowing lime ring
        if (isHovered) {
          ctx.save();
          ctx.shadowColor = '#C6FF3D';
          ctx.shadowBlur = 24;
          ctx.strokeStyle = '#C6FF3D';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(sx, sy, halfSize + 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Subtle dark circular backing (about 12% white / subtle dark contrast disc)
        // Keeps logos readable as they cross wireframe mesh lines
        if (iconDef?.needsBacking || z > 0) {
          ctx.beginPath();
          ctx.arc(sx, sy, halfSize * 0.95, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(18, 18, 22, 0.65)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }

        // Render the icon directly onto the sphere surface
        if (iconDef?.canvas) {
          // If at the back (z <= 0), gray-scale slightly so front stays cleanly readable
          if (z <= 0) {
            ctx.filter = 'grayscale(80%)';
          }
          ctx.drawImage(
            iconDef.canvas,
            sx - halfSize,
            sy - halfSize,
            iconSize,
            iconSize
          );
          ctx.filter = 'none';
        } else {
          // Fallback order #3: Clean initials badge with lime outline
          ctx.beginPath();
          ctx.arc(sx, sy, halfSize * 0.9, 0, Math.PI * 2);
          ctx.fillStyle = '#17171C';
          ctx.fill();
          ctx.strokeStyle = isHovered ? '#C6FF3D' : 'rgba(198, 255, 61, 0.4)';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.font = `bold ${Math.round(halfSize * 0.85)}px 'JetBrains Mono', monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = isHovered ? '#C6FF3D' : '#F4F4F0';
          ctx.fillText(item.initials, sx, sy + 0.5);
        }

        // Text label under icon:
        // - Back-facing items (z <= 0): NO label
        // - Crowded front items: show label ONLY on hover
        // - Clear front items (z > 0.15): crisp mono label
        const isCrowded = suppressedLabels.has(pItem.index);
        const shouldShowLabel = isHovered || (z > 0.15 && !isCrowded);

        if (shouldShowLabel) {
          const fontSize = Math.max(9, Math.round((isMobile ? 9.5 : 11) * scale));
          ctx.font = `${isHovered ? 'bold' : 'normal'} ${fontSize}px 'JetBrains Mono', monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';

          const labelY = sy + halfSize + (isMobile ? 3 : 5);
          const labelText = item.name;
          const textMetrics = ctx.measureText(labelText);
          const textW = textMetrics.width;

          // Subtle dark backing scrim behind text for 100% legibility
          ctx.fillStyle = 'rgba(10, 10, 11, 0.88)';
          ctx.beginPath();
          ctx.roundRect(
            sx - textW / 2 - 4,
            labelY - 1,
            textW + 8,
            fontSize + 4,
            4
          );
          ctx.fill();

          ctx.fillStyle = isHovered
            ? '#C6FF3D'
            : z > 0.5
            ? '#F4F4F0'
            : 'rgba(244, 244, 240, 0.85)';
          ctx.fillText(labelText, sx, labelY);
        }

        ctx.restore();
      }
    };

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [items, fibonacciPoints, wireframeGeo, activeFilter, isMobile]);

  // Hit-testing helper (only hits front-half items z > 0)
  const hitTest = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const p = physicsRef.current;
      const cx = p.width / 2;
      const cy = p.height / 2;
      const sphereRadius = p.width * 0.35;
      const cameraDistance = 2.4;

      const cosY = Math.cos(p.rotationY);
      const sinY = Math.sin(p.rotationY);
      const cosX = Math.cos(p.tiltX);
      const sinX = Math.sin(p.tiltX);

      const baseRadius = isMobile ? 20 : 24;

      // Check in reverse order so closest front items hit first
      for (let i = items.length - 1; i >= 0; i--) {
        const rawPt = fibonacciPoints[i];
        if (!rawPt) continue;

        const x1 = rawPt.x * cosY + rawPt.z * sinY;
        const y1 = rawPt.y;
        const z1 = -rawPt.x * sinY + rawPt.z * cosY;

        const x2 = x1;
        const y2 = y1 * cosX - z1 * sinX;
        const z2 = y1 * sinX + z1 * cosX;

        // Front half only
        if (z2 <= 0.05) continue;

        const k = cameraDistance / (cameraDistance - z2);
        const sx = cx + x2 * sphereRadius * k;
        const sy = cy - y2 * sphereRadius * k;

        const zNorm = (z2 + 1) / 2;
        const scale = 0.55 + 0.45 * zNorm;
        const hitRadius = baseRadius * scale * 1.5;

        const dx = x - sx;
        const dy = y - sy;
        if (dx * dx + dy * dy <= hitRadius * hitRadius) {
          return { item: items[i], sx, sy };
        }
      }
      return null;
    },
    [items, fibonacciPoints, isMobile]
  );

  // Pointer drag to rotate (mouse & touch) with inertia and pan-y support
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = physicsRef.current;
    p.isInteracting = true;
    p.dragStartX = e.clientX;
    p.dragStartY = e.clientY;
    p.lastDragX = e.clientX;
    p.lastDragY = e.clientY;
    p.lastDragTime = performance.now();
    p.velocityX = 0;
    p.velocityY = 0;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    // Hit test on touch tap
    const hit = hitTest(e.clientX, e.clientY);
    if (hit) {
      onSelectTech(hit.item.name);
      setTooltipData({ item: hit.item, x: hit.sx, y: hit.sy });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = physicsRef.current;

    if (p.isInteracting) {
      const dx = e.clientX - p.lastDragX;
      const dy = e.clientY - p.lastDragY;
      const now = performance.now();
      const dt = Math.max(1, now - p.lastDragTime) / 1000;

      const sensitivity = 0.0055;
      p.rotationY += dx * sensitivity;
      p.tiltX = Math.max(-0.45, Math.min(0.45, p.tiltX - dy * sensitivity));

      p.velocityX = (dx * sensitivity) / dt;
      p.velocityY = (-dy * sensitivity) / dt;

      p.lastDragX = e.clientX;
      p.lastDragY = e.clientY;
      p.lastDragTime = now;
      return;
    }

    // Desktop hover detection when not dragging
    if (!isMobile) {
      const hit = hitTest(e.clientX, e.clientY);
      if (hit) {
        onSelectTech(hit.item.name);
        setTooltipData({ item: hit.item, x: hit.sx, y: hit.sy });
      } else if (selectedTech) {
        onSelectTech(null);
        setTooltipData(null);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = physicsRef.current;
    p.isInteracting = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerLeave = () => {
    if (!isMobile) {
      onSelectTech(null);
      setTooltipData(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full flex flex-col items-center justify-center pt-8 pb-4 my-2 select-none"
    >
      {/* 3D Wireframe Canvas Container */}
      <div className="relative aspect-square w-full max-w-[680px] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Interactive 3D rotating sphere of 35 technologies used in Charan's projects"
          tabIndex={0}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          className="cursor-grab active:cursor-grabbing outline-none focus-visible:ring-1 focus-visible:ring-[#C6FF3D] rounded-full"
          style={{ touchAction: 'pan-y' }}
        />

        {/* Floating Tooltip Card (Desktop - anchored near hovered item) */}
        <AnimatePresence>
          {!isMobile && tooltipData && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 6 }}
              transition={{ duration: 0.15 }}
              style={{
                left: `${Math.min(
                  physicsRef.current.width - 240,
                  Math.max(20, tooltipData.x + 28)
                )}px`,
                top: `${Math.min(
                  physicsRef.current.height - 120,
                  Math.max(20, tooltipData.y - 30)
                )}px`,
              }}
              className="pointer-events-none absolute z-30 w-56 rounded-xl border border-[#C6FF3D]/40 bg-[#111114]/95 p-3.5 shadow-2xl backdrop-blur-md"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-display text-sm font-bold text-[#F4F4F0]">
                  {tooltipData.item.name}
                </span>
                <span className="font-mono text-[10px] text-[#C6FF3D] bg-[#C6FF3D]/10 px-1.5 py-0.5 rounded border border-[#C6FF3D]/20">
                  {tooltipData.item.category}
                </span>
              </div>
              <div className="font-mono text-[11px] text-[#A1A1AA] leading-snug">
                Used in {tooltipData.item.usageCount}{' '}
                {tooltipData.item.usageCount === 1 ? 'project' : 'projects'}:
              </div>
              <div className="mt-1 font-body text-xs text-[#F4F4F0]/90 leading-tight">
                {tooltipData.item.projects.join(', ')}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Anchored Tooltip Card (Mobile - positioned right below sphere) */}
      <AnimatePresence>
        {isMobile && tooltipData && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-sm mt-3 rounded-xl border border-[#C6FF3D]/50 bg-[#16161A] p-4 shadow-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-display text-base font-bold text-[#F4F4F0]">
                {tooltipData.item.name}
              </span>
              <span className="font-mono text-[11px] text-[#C6FF3D] bg-[#C6FF3D]/10 px-2 py-0.5 rounded border border-[#C6FF3D]/20">
                {tooltipData.item.category}
              </span>
            </div>
            <div className="font-mono text-xs text-[#C6FF3D] mb-1">
              Used in {tooltipData.item.usageCount}{' '}
              {tooltipData.item.usageCount === 1 ? 'project' : 'projects'}
            </div>
            <div className="font-body text-xs text-[#A1A1AA] leading-relaxed">
              {tooltipData.item.projects.join(', ')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen Reader Accessibility List */}
      <ul className="sr-only">
        {items.map((it) => (
          <li key={it.name}>
            {it.name} - Layer: {it.category}, used in {it.usageCount} projects (
            {it.projects.join(', ')})
          </li>
        ))}
      </ul>
    </div>
  );
}
