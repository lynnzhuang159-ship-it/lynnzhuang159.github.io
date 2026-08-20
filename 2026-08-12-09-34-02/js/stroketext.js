/* ============================================================
   StrokeText —— React Bits 组件的无依赖原生移植（hero 标题）
   ------------------------------------------------------------
   原组件依赖 React + gsap + ScrollTrigger，本站点零依赖 / file:// 直开 / 无构建，
   因此用纯原生实现：
     - 把每行标题渲染成 SVG <text>，分「描边层」与「填充层」两层
     - 描边层逐字错峰地用 strokeDashoffset 画出轮廓（替代 gsap draw）
     - 填充层随后淡入成实心字（fillMode 用 fade，跨浏览器最稳；原组件默认 wipe）
     - 用浏览器内置 Web Animations API（WAAPI），无需任何库
   颜色：直接读取标题当前文字色（深色），避免原组件默认近白填充在白底上「消失」。
   每 LOOP_PERIOD 毫秒完整循环一次（绘制 → 填充 → 停留 → 重绘）。
   注意：本脚本在 main.js 之后加载；main.js 在 DOMContentLoaded 写入 #hero-name，
   故此处用 window.load 启动，确保名字已就位。
   ============================================================ */

(function () {
  "use strict";

  // —— 可调参数（对应 React Bits 的 props）——
  var DRAW_DURATION = 1.6;   // 每个字轮廓绘制时长(秒)
  var STAGGER = 0.05;        // 逐字错峰间隔(秒)
  var FILL_DELAY = 0.2;      // 描边完成后到填充开始的停顿(秒)
  var STROKE_WIDTH = 2;      // 描边粗细(px，原组件 1.4，白底上加深以保证可见)
  var LOOP_PERIOD = 6000;    // 循环周期(ms) = 6 秒

  var SELECTORS = [".hero__greeting", ".hero__verb", ".hero__name"];
  var mounts = [];

  function escapeXml(ch) {
    return ch
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function buildSVG(text, fs, weight, ls, fontFamily, color) {
    var chars = Array.from(text);
    var strokeT = chars
      .map(function (c, i) {
        return '<tspan data-stroke-char="' + i + '">' + escapeXml(c) + "</tspan>";
      })
      .join("");
    var fillT = chars
      .map(function (c, i) {
        return '<tspan data-fill-char="' + i + '">' + escapeXml(c) + "</tspan>";
      })
      .join("");
    var style =
      "font-size:" + fs + "px;font-weight:" + weight + ";letter-spacing:" + ls + "px;font-family:" + fontFamily + ";";
    return (
      '<svg class="stroke-text__svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
      '<text class="stroke-text__stroke" x="0" y="0" fill="none" stroke="' + color + '" stroke-width="' + STROKE_WIDTH +
      '" stroke-linejoin="round" stroke-linecap="round" style="' + style + '">' + strokeT + "</text>" +
      '<text class="stroke-text__fill" x="0" y="0" fill="' + color + '" stroke="none" style="' + style + '">' + fillT + "</text>" +
      "</svg>"
    );
  }

  function mountStrokeText(el) {
    if (!el) return null;

    // 原始文本只在第一挂载时抓取（缩放重建时从 data-text 读取，避免读到 SVG 内部）
    if (!el.dataset.text) el.dataset.text = (el.textContent || "").trim();
    var text = el.dataset.text;
    if (!text) return null;

    var cs = getComputedStyle(el);
    var fs = parseFloat(cs.fontSize) || 48;
    var weight = cs.fontWeight || 700;
    var ls = parseFloat(cs.letterSpacing);
    if (isNaN(ls)) ls = 0;
    var color = cs.color || "#111";
    var fontFamily = cs.fontFamily || "inherit";

    el.textContent = "";
    el.insertAdjacentHTML("beforeend", buildSVG(text, fs, weight, ls, fontFamily, color));

    var svg = el.querySelector("svg");
    var strokeText = svg.querySelector(".stroke-text__stroke");
    var fillText = svg.querySelector(".stroke-text__fill");

    // 量取真实包围盒，设置 viewBox 与像素尺寸（保持响应式字号下的自然大小）
    var bbox = null;
    try { bbox = strokeText.getBBox(); } catch (e) { bbox = null; }
    if (bbox && bbox.width) {
      var pad = Math.max(STROKE_WIDTH, fs * 0.12);
      var x = bbox.x - pad, y = bbox.y - pad, w = bbox.width + pad * 2, h = bbox.height + pad * 2;
      svg.setAttribute("viewBox", x + " " + y + " " + w + " " + h);
      svg.setAttribute("width", w);
      svg.setAttribute("height", h);
    }

    var strokeChars = svg.querySelectorAll("[data-stroke-char]");
    var fillChars = svg.querySelectorAll("[data-fill-char]");
    if (!strokeChars.length) return null;

    var dash = Math.max(fs * 8, 400);
    strokeChars.forEach(function (s) {
      s.style.strokeDasharray = dash;
      s.style.strokeDashoffset = dash;
    });
    fillChars.forEach(function (f) { f.style.opacity = 0; });

    // 减少动效偏好：直接显示实心字，不循环
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      strokeChars.forEach(function (s) { s.style.strokeDashoffset = 0; });
      fillChars.forEach(function (f) { f.style.opacity = 1; });
      return { cancel: function () {} };
    }

    var animations = [];
    var timer = null;
    var cancelled = false;

    function cancelAll() {
      animations.forEach(function (a) { try { a.cancel(); } catch (e) {} });
      animations = [];
    }

    function cycle() {
      if (cancelled) return;
      cancelAll();
      strokeChars.forEach(function (s) { s.style.strokeDashoffset = dash; });
      fillChars.forEach(function (f) { f.style.opacity = 0; });

      strokeChars.forEach(function (s, i) {
        animations.push(
          s.animate(
            [{ strokeDashoffset: dash }, { strokeDashoffset: 0 }],
            { duration: DRAW_DURATION * 1000, delay: i * STAGGER * 1000, easing: "ease-out", fill: "forwards" }
          )
        );
      });

      var drawEnd = (strokeChars.length - 1) * STAGGER + DRAW_DURATION;
      var fillStart = (drawEnd + FILL_DELAY) * 1000;
      var fillDur = Math.max(0.4, DRAW_DURATION * 0.5) * 1000;
      fillChars.forEach(function (f) {
        animations.push(
          f.animate(
            [{ opacity: 0 }, { opacity: 1 }],
            { duration: fillDur, delay: fillStart, easing: "ease-out", fill: "forwards" }
          )
        );
      });

      timer = setTimeout(cycle, LOOP_PERIOD);
    }

    timer = setTimeout(cycle, 300);
    return {
      cancel: function () {
        cancelled = true;
        if (timer) clearTimeout(timer);
        cancelAll();
      }
    };
  }

  function renderAll() {
    mounts.forEach(function (m) { try { m.cancel(); } catch (e) {} });
    mounts = [];
    SELECTORS.forEach(function (sel) {
      var el = document.querySelector(sel);
      var m = mountStrokeText(el);
      if (m) mounts.push(m);
    });
  }

  function debounce(fn, wait) {
    var t = null;
    return function () {
      if (t) clearTimeout(t);
      t = setTimeout(fn, wait);
    };
  }

  function init() {
    renderAll();
    window.addEventListener("resize", debounce(renderAll, 250));
  }

  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init);
  }
})();
