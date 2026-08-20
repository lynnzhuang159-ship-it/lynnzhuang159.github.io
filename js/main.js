/* ============================================================
   站点交互逻辑
   - 作品卡片 / 详情页 / 导航 / 页脚 全部由 data.js 驱动
   - 滚动入场动效 / 移动端菜单
   ============================================================ */

(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function projectCard(p, i) {
    const n = String(i + 1).padStart(2, "0");
    return `
      <a class="work" href="project.html?id=${p.id}" data-reveal>
        <div class="work__media">
          <img src="${p.cover}" alt="${p.title}" loading="lazy">
        </div>
        <div class="work__meta">
          <span class="work__index">${n}</span>
          <div>
            <h3 class="work__title">${p.title}</h3>
            <p class="work__tag">${p.category} · ${p.year}</p>
          </div>
        </div>
        <span class="work__go" aria-hidden="true">→</span>
      </a>`;
  }

  function renderBrand() {
    const b = $("#nav-brand");
    if (b && SITE) b.textContent = SITE.name;
    const hn = $("#hero-name");
    if (hn && SITE) hn.textContent = SITE.name;
    const hr = $("#hero-role");
    if (hr && SITE) hr.textContent = SITE.role;
    const hi = $("#hero-intro");
    if (hi && SITE) hi.textContent = SITE.intro;
    const an = $("#about-name");
    if (an && SITE) an.textContent = SITE.name;
  }

  function renderFeatured() {
    const el = $("#featured-accordion");
    if (!el || typeof window.AccordionGallery === "undefined") return;
    const items = PROJECTS.map((p) => ({
      image: p.cover,
      label: p.title,
      sub: p.subtitle,
      link: "project.html?id=" + p.id,
      alt: p.title
    }));
    items.push({
      image: "assets/past-works.svg",
      label: "以往作品",
      link: "https://www.zhisheji.com/space-uid-552790.html",
      external: true,
      alt: "以往作品"
    });
    window.AccordionGallery.mount(el, {
      items,
      defaultIndex: 1,
      expandRatio: 0.52,
      trigger: "hover",
      grayscale: true,
      height: 460,
      gap: 10,
      radius: 14,
      duration: 0.6,
      tilt: 8,
      parallax: 0.5,
      accentColor: "#ffffff",
      overlayColor: "#0b0b12",
      textColor: "#ffffff"
    });
  }

  function renderWorks() {
    const el = $("#works-grid");
    if (!el) return;
    el.innerHTML =
      PROJECTS.map((p, i) => projectCard(p, i)).join("") +
      `
      <a class="work" href="https://www.zhisheji.com/space-uid-552790.html" target="_blank" rel="noopener noreferrer" data-reveal>
        <div class="work__media">
          <img src="assets/past-works.svg" alt="往期项目" loading="lazy">
        </div>
        <div class="work__meta">
          <span class="work__index">04</span>
          <div>
            <h3 class="work__title">往期项目</h3>
          </div>
        </div>
        <span class="work__go" aria-hidden="true">→</span>
      </a>`;
  }

  function renderProject() {
    const root = $("#project-root");
    if (!root) return;
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    const idx = Math.max(0, PROJECTS.findIndex((p) => p.id === id));
    const p = PROJECTS[idx];
    const next = PROJECTS[(idx + 1) % PROJECTS.length];

    $("#p-cat").textContent = p.category;
    $("#p-title").textContent = p.title;
    document.title = p.title + " · " + (SITE ? SITE.name : "");

    $("#p-meta").innerHTML = `
      <div><dt>年份</dt><dd>${p.year}</dd></div>
      <div><dt>项目类型</dt><dd>${p.category}</dd></div>
      <div><dt>角色</dt><dd>${p.role}</dd></div>
      <div><dt>设计范围</dt><dd>${p.scope || p.images.length + " 张"}</dd></div>`;

    const cover = $("#p-cover");
    cover.src = p.cover;
    cover.alt = p.title;

    const paras = p.desc.replace(/\\n/g, "\n").split("\n");
    $("#p-desc").innerHTML = paras
      .map((s) => {
        const line = s.trim();
        if (!line) return "";
        if (line.startsWith("## ")) {
          return `<h3 class="p-desc__heading">${line.slice(3)}</h3>`;
        }
        return `<p>${s}</p>`;
      })
      .join("");

    $("#p-gallery").innerHTML = p.images
      .map((src) => `<figure data-reveal><img src="${src}" alt="${p.title}" loading="lazy"></figure>`)
      .join("");

    $("#p-next").innerHTML = `
      <a href="project.html?id=${next.id}">
        <span class="n-label">下一个项目</span>
        <span class="n-title">${next.title} →</span>
      </a>`;
  }

  function renderFooter() {
    const mail = $("#footer-mail");
    if (mail && SITE) {
      mail.textContent = SITE.email;
      mail.href = "mailto:" + SITE.email;
      mail.title = "点击复制邮箱";
    }
    const soc = $("#footer-socials");
    if (soc && SITE) {
      soc.innerHTML = SITE.socials
        .map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${s.label}</a>`)
        .join("");
    }
    const yr = $("#footer-year");
    if (yr) yr.textContent = new Date().getFullYear();
  }

  /* ---------- 页脚邮箱：点击复制 + 鼠标旁浮窗提示 ---------- */
  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard
        .writeText(text)
        .then(() => true)
        .catch(() => fallbackCopy(text));
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function showCopyTip(x, y, ok) {
    const old = $(".copy-tip");
    if (old) old.remove();
    const tip = document.createElement("div");
    tip.className = "copy-tip";
    tip.textContent = ok ? "已复制" : "复制失败，请手动复制";
    document.body.appendChild(tip);

    const r = tip.getBoundingClientRect();
    let left = x + 14;
    if (left + r.width > window.innerWidth - 12) left = x - r.width - 14;
    let top = y - r.height - 10;
    if (top < 12) top = y + 20;
    tip.style.left = left + "px";
    tip.style.top = top + "px";

    requestAnimationFrame(() => tip.classList.add("is-in"));
    setTimeout(() => {
      tip.classList.remove("is-in");
      setTimeout(() => tip.remove(), 300);
    }, 1600);
  }

  function initMailCopy() {
    const mail = $("#footer-mail");
    if (!mail) return;
    mail.addEventListener("click", (e) => {
      e.preventDefault();
      const text = mail.textContent.trim();
      copyText(text).then((ok) => showCopyTip(e.clientX, e.clientY, ok));
    });
  }

  function initReveal() {
    const els = $$("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((e) => io.observe(e));
  }

  function initNav() {
    const toggle = $(".nav__toggle");
    const links = $(".nav__links");
    if (toggle && links) {
      toggle.addEventListener("click", () => links.classList.toggle("is-open"));
      links.addEventListener("click", (e) => {
        if (e.target.tagName === "A") links.classList.remove("is-open");
      });
    }
    const page = location.pathname.split("/").pop() || "index.html";
    $$(".nav__links a").forEach((a) => {
      const href = a.getAttribute("href");
      if (href === page || (page === "" && href === "index.html")) {
        a.classList.add("is-active");
      }
    });
  }

  function initExperience() {
    const items = $$("[data-exp-item]");
    if (!items.length) return;

    items.forEach((item) => {
      const header = item.querySelector(".timeline__header");
      const body = item.querySelector(".timeline__body");
      if (!header || !body) return;

      header.addEventListener("click", () => {
        const isActive = item.classList.contains("is-active");

        items.forEach((other) => {
          other.classList.remove("is-active");
          const h = other.querySelector(".timeline__header");
          const b = other.querySelector(".timeline__body");
          if (h) h.setAttribute("aria-expanded", "false");
          if (b) b.setAttribute("aria-hidden", "true");
        });

        if (!isActive) {
          item.classList.add("is-active");
          header.setAttribute("aria-expanded", "true");
          body.setAttribute("aria-hidden", "false");
        }
      });
    });
  }

  /* ---------- 关于页 · 表情脸瞳孔跟随鼠标 ---------- */
  function initFace() {
    const face = $(".face");
    if (!face) return;
    const eyeballs = $$(".face__eyeball", face);
    const pupils = $$(".face__pupil", face);
    if (!eyeballs.length || pupils.length !== eyeballs.length) return;

    let raf = 0;

    function track(cx, cy) {
      pupils.forEach((pupil, i) => {
        const r = eyeballs[i].getBoundingClientRect();
        const ex = r.left + r.width / 2;
        const ey = r.top + r.height / 2;
        const dx = cx - ex;
        const dy = cy - ey;
        const angle = Math.atan2(dy, dx);
        // 距离越远偏移越大（1.5 ~ 9，SVG 用户单位），封顶避免出界
        const dist = Math.min(Math.hypot(dx, dy) / 140, 1);
        const off = 1.5 + dist * 7.5;
        pupil.style.transform =
          "translate(" + (Math.cos(angle) * off).toFixed(2) + "px," +
          (Math.sin(angle) * off).toFixed(2) + "px)";
      });
    }

    function onMove(e) {
      if (raf) return;
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      raf = requestAnimationFrame(() => {
        raf = 0;
        track(cx, cy);
      });
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("touchmove", onMove, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderBrand();
    renderFeatured();
    renderWorks();
    renderProject();
    renderFooter();
    initReveal();
    initNav();
    initExperience();
    initFace();
    initMailCopy();
  });
})();
