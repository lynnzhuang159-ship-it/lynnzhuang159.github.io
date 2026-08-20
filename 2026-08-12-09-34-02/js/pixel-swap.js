/* ============================================================
   PixelSwap —— React Bits 组件的零依赖原生移植
   ------------------------------------------------------------
   用法：在容器 .pixel-swap 内放两个 .pixel-swap__layer
   （firstContent / secondContent），通过 data-* 配置参数。
   支持 data-trigger="click" | "hover" | "manual"。

   参数（data-* 写法，破折号转驼峰）：
     data-pixel-size      默认 64   单个像素边长（px）
     data-gap             默认 0    像素间距（px）
     data-pixel-radius    默认 0    像素圆角（%，0=方 50=圆）
     data-pixel-spin      默认 0    像素展开时的旋转角度
     data-pixel-scale     默认 0.35 像素起始缩放（相对最终尺寸）
     data-fade            "false" 关闭淡入（默认开启）
     data-duration        默认 1400 总过渡时长（ms）
     data-pixel-duration  默认 450  单个像素展开时长（ms）
     data-pattern         默认 random（random/center/edges/
                          left-to-right/right-to-left/top-to-bottom/
                          bottom-to-top/diagonal/spiral）
     data-randomness      默认 0    图案顺序噪声（0~1）
     data-easing          默认 cubic-bezier(0.22,1,0.36,1)
   ============================================================ */

(function () {
  "use strict";

  const MAX_PIXELS = 220;
  const KEYFRAME_STEPS = 14;

  const PATTERNS = {
    random: () => null,
    center: (x, y) => Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2,
    edges: (x, y) => Math.min(x, 1 - x, y, 1 - y) * 2,
    "left-to-right": (x) => x,
    "right-to-left": (x) => 1 - x,
    "top-to-bottom": (_x, y) => y,
    "bottom-to-top": (_x, y) => 1 - y,
    diagonal: (x, y) => (x + y) / 2,
    spiral: (x, y) => {
      const angle = (Math.atan2(y - 0.5, x - 0.5) + Math.PI) / (Math.PI * 2);
      const radius = Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2;
      return (angle + radius) % 1;
    },
  };

  const EASINGS = {
    linear: [0, 0, 1, 1],
    ease: [0.25, 0.1, 0.25, 1],
    "ease-in": [0.42, 0, 1, 1],
    "ease-out": [0, 0, 0.58, 1],
    "ease-in-out": [0.42, 0, 0.58, 1],
  };

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  const noise = (seed) => {
    const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return value - Math.floor(value);
  };

  const makeEasing = (value) => {
    const match = /cubic-bezier\(([^)]+)\)/.exec(value);
    const points = match ? match[1].split(",").map(Number) : EASINGS[value];
    if (!points || points.length !== 4 || points.some(Number.isNaN)) {
      return makeEasing("ease");
    }
    const [x1, y1, x2, y2] = points;
    if (x1 === y1 && x2 === y2) return (p) => p;
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;
    return (progress) => {
      let t = progress;
      for (let i = 0; i < 5; i += 1) {
        const slope = (3 * ax * t + 2 * bx) * t + cx;
        if (!slope) break;
        t -= (((ax * t + bx) * t + cx) * t - progress) / slope;
      }
      t = clamp(t, 0, 1);
      return ((ay * t + by) * t + cy) * t;
    };
  };

  const coverScale = (size, gap, radius) => {
    const p = clamp(radius, 0, 50) / 100;
    const corner = Math.SQRT1_2 / (Math.SQRT2 * (0.5 - p) + p);
    return ((size + gap) / size) * Math.max(1, corner);
  };

  const buildGrid = ({ width, height, pixelSize, gap, pattern, randomness }) => {
    let size = pixelSize;
    let columns = Math.max(1, Math.ceil((width + gap) / (size + gap)));
    let rows = Math.max(1, Math.ceil((height + gap) / (size + gap)));

    if (columns * rows > MAX_PIXELS) {
      size = Math.ceil(size * Math.sqrt((columns * rows) / MAX_PIXELS));
      columns = Math.max(1, Math.ceil((width + gap) / (size + gap)));
      rows = Math.max(1, Math.ceil((height + gap) / (size + gap)));
    }

    const stride = size + gap;
    const originX = (width - (columns * stride - gap)) / 2;
    const originY = (height - (rows * stride - gap)) / 2;
    const order = PATTERNS[pattern] ?? PATTERNS.random;
    const mix = clamp(randomness, 0, 1);
    const pixels = [];

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const index = row * columns + column;
        const x = columns <= 1 ? 0.5 : column / (columns - 1);
        const y = rows <= 1 ? 0.5 : row / (rows - 1);
        const base = order(x, y);
        const random = noise(index + 1);
        pixels.push({
          id: index,
          left: originX + column * stride,
          top: originY + row * stride,
          offset: base === null ? random : base * (1 - mix) + random * mix,
        });
      }
    }
    return { pixels, size, gap, width, height };
  };

  const buildKeyframes = ({ ease, startScale, endScale, spin, fade }) => {
    const win = [];
    const content = [];
    for (let step = 0; step <= KEYFRAME_STEPS; step += 1) {
      const progress = step / KEYFRAME_STEPS;
      const eased = ease(progress);
      const scale = startScale + (endScale - startScale) * eased;
      const angle = spin * (1 - eased);
      win.push({
        offset: progress,
        opacity: fade ? Math.min(1, eased * 1.6) : 1,
        transform: `rotate(${angle}deg) scale(${scale})`,
      });
      content.push({
        offset: progress,
        transform: `scale(${1 / scale}) rotate(${-angle}deg)`,
      });
    }
    return { window: win, content };
  };

  function initPixelSwap(el) {
    const layers = Array.from(el.querySelectorAll(".pixel-swap__layer"));
    if (layers.length < 2) return;

    const ds = el.dataset;
    const opt = {
      pixelSize: Number(ds.pixelSize ?? 64),
      gap: Number(ds.gap ?? 0),
      pixelRadius: Number(ds.pixelRadius ?? 0),
      pixelSpin: Number(ds.pixelSpin ?? 0),
      pixelScale: Number(ds.pixelScale ?? 0.35),
      fade: ds.fade !== "false",
      duration: Number(ds.duration ?? 1400),
      pixelDuration: Number(ds.pixelDuration ?? 450),
      pattern: ds.pattern ?? "random",
      randomness: Number(ds.randomness ?? 0),
      easing: ds.easing ?? "cubic-bezier(0.22, 1, 0.36, 1)",
      trigger: ds.trigger ?? "hover",
    };

    let box = { width: 0, height: 0 };
    let active = false;
    let transition = null;
    let timer = 0;
    const pixelRefs = [];
    const animations = [];

    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w && h) box = { width: w, height: h };
    };
    measure();
    if (window.ResizeObserver) {
      new ResizeObserver(measure).observe(el);
    }

    const setLayerVisible = (idx, visible) => {
      layers[idx].dataset.visible = visible ? "true" : "false";
      layers[idx].style.zIndex = visible ? "2" : "1";
    };

    const stopAnimations = () => {
      animations.forEach((a) => a.cancel());
      animations.length = 0;
      pixelRefs.forEach((p) => {
        while (p.firstChild) p.removeChild(p.firstChild);
      });
      if (timer) {
        clearTimeout(timer);
        timer = 0;
      }
    };

    const finish = (to) => {
      stopAnimations();
      pixelRefs.length = 0;
      const grid = el.querySelector(".pixel-swap__grid");
      if (grid) grid.remove();
      setLayerVisible(to ? 1 : 0, true);
      setLayerVisible(to ? 0 : 1, false);
      active = to;
      transition = null;
    };

    const startTransition = (to) => {
      if (transition || to === active || !box.width) return;

      const total = Math.max(200, opt.duration);
      const pixelMs = clamp(opt.pixelDuration, 60, total);
      const spread = Math.max(0, total - pixelMs);

      const grid = buildGrid({
        width: box.width,
        height: box.height,
        pixelSize: Math.max(8, Math.round(opt.pixelSize)),
        gap: Math.max(0, Math.round(opt.gap)),
        pattern: opt.pattern,
        randomness: opt.randomness,
      });

      const es = coverScale(grid.size, grid.gap, opt.pixelRadius);
      const ease = makeEasing(opt.easing);
      const kf = buildKeyframes({
        ease,
        startScale: clamp(opt.pixelScale, 0.05, 1) * es,
        endScale: es,
        spin: opt.pixelSpin,
        fade: opt.fade,
      });

      // 旧内容保持可见，新内容先隐藏（由像素网格逐块揭示）
      setLayerVisible(to ? 1 : 0, false);
      setLayerVisible(to ? 0 : 1, true);

      if (
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        finish(to);
        return;
      }

      const source = layers[to ? 1 : 0];
      const gridEl = document.createElement("div");
      gridEl.className = "pixel-swap__grid";
      el.appendChild(gridEl);

      grid.pixels.forEach((pixel) => {
        const pixelEl = document.createElement("div");
        pixelEl.className = "pixel-swap__pixel";
        pixelEl.style.left = pixel.left + "px";
        pixelEl.style.top = pixel.top + "px";
        pixelEl.style.width = grid.size + "px";
        pixelEl.style.height = grid.size + "px";
        pixelEl.style.borderRadius = clamp(opt.pixelRadius, 0, 50) + "%";

        const contentWrap = document.createElement("div");
        contentWrap.className = "pixel-swap__pixel-content";
        contentWrap.style.left = -pixel.left + "px";
        contentWrap.style.top = -pixel.top + "px";
        contentWrap.style.width = grid.width + "px";
        contentWrap.style.height = grid.height + "px";
        const originX = pixel.left + grid.size / 2;
        const originY = pixel.top + grid.size / 2;
        contentWrap.style.transformOrigin = originX + "px " + originY + "px";

        const clone = source.cloneNode(true);
        clone.dataset.visible = "true";
        clone.removeAttribute("aria-hidden");
        contentWrap.appendChild(clone);
        pixelEl.appendChild(contentWrap);
        gridEl.appendChild(pixelEl);
        pixelRefs.push(pixelEl);

        const timing = {
          duration: pixelMs,
          delay: pixel.offset * spread,
          easing: "linear",
          fill: "both",
        };
        animations.push(pixelEl.animate(kf.window, timing));
        animations.push(contentWrap.animate(kf.content, timing));
      });

      timer = setTimeout(() => finish(to), total);
    };

    const requestActive = (next) => startTransition(next);

    if (opt.trigger === "hover") {
      el.addEventListener("mouseenter", () => requestActive(true));
      el.addEventListener("mouseleave", () => requestActive(false));
      el.addEventListener("focus", () => requestActive(true));
      el.addEventListener("blur", () => requestActive(false));
      el.tabIndex = 0;
    } else if (opt.trigger === "click") {
      el.addEventListener("click", () => requestActive(!active));
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          requestActive(!active);
        }
      });
      el.tabIndex = 0;
      el.setAttribute("role", "button");
    }
    // manual：通过 el.__pixelSwap(true/false) 外部控制

    setLayerVisible(0, true);
    setLayerVisible(1, false);
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".pixel-swap").forEach(initPixelSwap);
  });
})();
