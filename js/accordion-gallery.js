/* ============================================================
   AccordionGallery —— React Bits 原生 vanilla 移植（无 GSAP）
   ------------------------------------------------------------
   用法：
     AccordionGallery.mount(containerEl, options)
   options:
     items        [{ image, label, sub?, link?, alt? }]
     defaultIndex 数字，默认中间
     expandRatio  展开面板占比 0.2–0.9（默认 0.52）
     trigger      'hover' | 'click'（默认 hover）
     grayscale    折叠面板去色（默认 true）
     height / gap / radius / duration / tilt / parallax
     accentColor / overlayColor / textColor
   动效全部交给 CSS transition，本文件只负责状态与几何计算。
   ============================================================ */

(function () {
  "use strict";

  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

  function mount(container, opts) {
    opts = opts || {};
    const items = opts.items || [];
    const count = items.length;
    if (!container || count === 0) return;

    const r = clamp(opts.expandRatio ?? 0.52, 0.2, 0.9);
    const grow = count > 1 ? (r * (count - 1)) / (1 - r) : 1;
    const tilt = opts.tilt ?? 8;
    const parallax = opts.parallax ?? 0.5;
    const grayscale = opts.grayscale ?? true;
    const showLabels = opts.showLabels ?? true;
    const duration = opts.duration ?? 0.6;
    const gap = opts.gap ?? 10;
    const radius = opts.radius ?? 16;
    const height = opts.height ?? 460;
    const trigger = opts.trigger ?? "hover";

    const prefersReduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 容器样式 / CSS 变量
    container.classList.add("accordion-gallery");
    container.style.setProperty("--ag-accent", opts.accentColor ?? "#ffffff");
    container.style.setProperty("--ag-overlay", opts.overlayColor ?? "#0b0b12");
    container.style.setProperty("--ag-text", opts.textColor ?? "#ffffff");
    container.style.setProperty("--ag-gap", gap + "px");
    container.style.setProperty("--ag-radius", radius + "px");
    container.style.setProperty("--ag-dur", (prefersReduced ? 0 : duration) + "s");
    container.style.setProperty("--ag-grow", grow);
    container.style.setProperty("--ag-tilt", tilt + "deg");
    container.style.height = height + "px";
    container.setAttribute("role", "list");
    container.setAttribute("aria-label", "精选作品手风琴画廊");

    // 构建面板
    container.innerHTML = items
      .map(
        (it, i) => `
        <a class="ag-panel" href="${it.link || "#"}"${it.external ? ' target="_blank" rel="noopener noreferrer"' : ""} role="listitem" tabindex="0"
           aria-label="${it.label || ""}" data-index="${i}">
          <span class="ag-panel__frame">
            <span class="ag-panel__media">
              <img src="${it.image}" alt="${it.alt || it.label || ""}" draggable="false" />
            </span>
            <span class="ag-panel__overlay" aria-hidden="true"></span>
          </span>
          ${
            showLabels
              ? `<span class="ag-panel__label" aria-hidden="true">
                  <span class="ag-panel__bar"></span>
                  <span class="ag-panel__text">${it.label || ""}${
                it.sub ? ` <em>${it.sub}</em>` : ""
              }</span>
                </span>`
              : ""
          }
        </a>`
      )
      .join("");

    const panels = Array.from(container.querySelectorAll(".ag-panel"));
    const medias = panels.map((p) => p.querySelector(".ag-panel__media"));

    let active = clamp(
      opts.defaultIndex ?? Math.floor(count / 2),
      0,
      count - 1
    );

    function layout() {
      const rect = container.getBoundingClientRect();
      const total = rect.width || 1;
      const usable = Math.max(total - gap * (count - 1), 120);
      const mediaSize = Math.max(140, usable * r * 1.22);
      container.style.setProperty("--ag-media-size", mediaSize.toFixed(0) + "px");

      panels.forEach((panel, i) => {
        const isActive = i === active;
        // 3D 倾斜：激活面板归正，左侧 +tilt、右侧 -tilt
        const rot = isActive ? 0 : i < active ? tilt : -tilt;
        panel.style.setProperty("--ag-tilt", rot + "deg");
        panel.classList.toggle("ag-panel--active", isActive);
        panel.setAttribute("aria-current", isActive ? "true" : "false");

        // 视差漂移：离激活面板越远偏移越大
        const drift = clamp(active - i, -1.5, 1.5);
        const shift = isActive ? 0 : drift * parallax * mediaSize * 0.06;
        medias[i].style.setProperty("--ag-shift", shift.toFixed(1) + "px");

        // 折叠去色 + 压暗，激活恢复
        medias[i].style.setProperty("--ag-gray", grayscale ? (isActive ? 0 : 1) : 0);
        medias[i].style.setProperty("--ag-dim", isActive ? 0 : 0.35);
      });
    }

    function setActive(i) {
      if (i < 0 || i >= count || i === active) return;
      active = i;
      layout();
    }

    panels.forEach((panel, i) => {
      if (trigger === "hover") {
        panel.addEventListener("mouseenter", () => setActive(i));
        panel.addEventListener("focus", () => setActive(i));
      }
      panel.addEventListener("click", (e) => {
        if (i !== active) {
          e.preventDefault();
          setActive(i);
        }
      });
      panel.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          setActive((i + 1) % count);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          setActive((i - 1 + count) % count);
        }
      });
    });

    layout();
    if ("ResizeObserver" in window) {
      const ro = new ResizeObserver(layout);
      ro.observe(container);
    }
    window.addEventListener("resize", layout);
  }

  window.AccordionGallery = { mount };
})();
