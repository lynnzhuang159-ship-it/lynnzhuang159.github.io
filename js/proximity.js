/* ============================================================
   VariableProximity —— React Bits 组件的无依赖原生移植
   ------------------------------------------------------------
   原组件依赖 React + motion，但本站点要求「零依赖 / file:// 直开 / 无构建」，
   因此这里用纯原生 JS 复刻其核心效果：
     - 把标题拆成逐字 <span>
     - 用 requestAnimationFrame 监听光标位置
     - 按「光标到每个字母的距离 + 衰减曲线」插值 font-variation-settings 'wght'
   字体：macOS 上回退到 -apple-system（San Francisco），本身是支持 'wght' 轴的可变字体，
   因此离线也能看到效果。其它平台若字体非可变，会自动改用 font-weight 兜底（同样有加粗动效）。
   ============================================================ */

(function () {
  "use strict";

  // —— 可调参数 ——
  var TO_WGHT = 1000;        // 光标贴近时达到的字重
  var RADIUS = 130;          // 影响半径（px），越大范围越广
  var FALLOFF = "linear";    // 'linear' | 'exponential' | 'gaussian'

  function initProximity(root) {
    if (!root) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var letters = [];

    // 把文本节点拆成「逐字 span」，并按词包裹 white-space:nowrap，
    // 防止长单词（如 Zhuang）在字母之间被换行断开。
    function splitIntoLetters(el) {
      var nodes = Array.prototype.slice.call(el.childNodes);
      nodes.forEach(function (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          var text = node.textContent;
          if (!text) return;
          var frag = document.createDocumentFragment();
          var wordChars = [];

          function flushWord() {
            if (!wordChars.length) return;
            var wordSpan = document.createElement("span");
            wordSpan.className = "vp-word";
            wordSpan.style.whiteSpace = "nowrap";
            wordChars.forEach(function (ch) {
              var span = document.createElement("span");
              span.className = "vp-letter";
              span.textContent = ch;
              span.style.willChange = "font-variation-settings, font-weight";
              wordSpan.appendChild(span);
              letters.push(span);
            });
            frag.appendChild(wordSpan);
            wordChars = [];
          }

          for (var i = 0; i < text.length; i++) {
            var ch = text[i];
            if (ch === " " || ch === "\u00A0") {
              flushWord();
              frag.appendChild(document.createTextNode(ch));
            } else {
              wordChars.push(ch);
            }
          }
          flushWord();
          el.replaceChild(frag, node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          splitIntoLetters(node);
        }
      });
    }

    splitIntoLetters(root);
    if (!letters.length) return;

    // 记录每个字母「静止时的字重」作为 from 基线（保持原设计的不同行重）
    var fromW = letters.map(function (span) {
      var w = parseFloat(getComputedStyle(span).fontWeight);
      return isNaN(w) ? 400 : w;
    });

    var mouse = { x: -99999, y: -99999 };
    function onMove(clientX, clientY) {
      var rect = root.getBoundingClientRect();
      mouse.x = clientX - rect.left;
      mouse.y = clientY - rect.top;
    }
    window.addEventListener("mousemove", function (e) { onMove(e.clientX, e.clientY); });
    window.addEventListener("touchmove", function (e) {
      if (e.touches && e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    function falloff(d) {
      var norm = Math.min(Math.max(1 - d / RADIUS, 0), 1);
      if (FALLOFF === "exponential") return norm * norm;
      if (FALLOFF === "gaussian") return Math.exp(-Math.pow(d / (RADIUS / 2), 2) / 2);
      return norm; // linear
    }

    function frame() {
      var rect = root.getBoundingClientRect();
      for (var i = 0; i < letters.length; i++) {
        var span = letters[i];
        var r = span.getBoundingClientRect();
        var cx = r.left + r.width / 2 - rect.left;
        var cy = r.top + r.height / 2 - rect.top;
        var dx = mouse.x - cx;
        var dy = mouse.y - cy;
        var d = Math.sqrt(dx * dx + dy * dy);
        var w = (d >= RADIUS)
          ? fromW[i]
          : fromW[i] + (TO_WGHT - fromW[i]) * falloff(d);
        w = Math.round(w);
        // 可变字体走 font-variation-settings；非可变字体走 font-weight（兜底）
        span.style.fontVariationSettings = "'wght' " + w;
        span.style.fontWeight = String(w);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function start() {
    var hero = document.querySelector(".hero__title");
    if (hero) initProximity(hero);
  }

  // 用 load 而非 DOMContentLoaded：确保 main.js 的 renderBrand() 先把 #hero-name
  // 的文本写好，避免被覆盖。
  if (document.readyState === "complete") {
    start();
  } else {
    window.addEventListener("load", start);
  }
})();
