/*
 * FoldText —— React Bits 组件的原生移植（零依赖 / file:// 直开）
 * 用浏览器内置 Web Animations API 替代 gsap，用真实子元素 + opacity 动画替代
 * 原组件依赖 Houdini 的 --fold-crease 自定义属性。
 *
 * 用法：在任意元素上加 data-foldtext，并用 data-* 覆盖配置：
 *   data-split="char|word|line"   拆分粒度（默认 char）
 *   data-hinge="top|bottom|left|right"  折叠铰链边（默认 top）
 *   data-trigger="mount|scroll|hover"   触发时机（默认 mount；scroll=进入视口播放一次）
 *   data-duration="0.65"  data-stagger="0.045"  data-perspective="700"  data-crease="0.55"
 * 元素内的原始文本会被保留为无障碍文本，并作为无 JS 时的回退显示。
 */
(function () {
  'use strict';

  var HINGE = {
    top:    { origin: '50% 0%',   rotateX: -92, rotateY: 0 },
    bottom: { origin: '50% 100%', rotateX: 92,  rotateY: 0 },
    left:   { origin: '0% 50%',   rotateX: 0,   rotateY: 92 },
    right:  { origin: '100% 50%', rotateX: 0,   rotateY: -92 }
  };

  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  // gsap 默认 ease "power3.out" ≈ CSS easeOutCubic
  var EASE = 'cubic-bezier(0.215, 0.61, 0.355, 1)';

  function buildPieces(text, splitBy, hinge, perspective) {
    var frag = document.createDocumentFragment();
    var pieces = [];

    function makeSegment(content) {
      var seg = document.createElement('span');
      seg.className = 'fold-text-segment';
      seg.setAttribute('data-fold-split', splitBy);
      seg.style.setProperty('--fold-perspective', perspective + 'px');

      var piece = document.createElement('span');
      piece.className = 'fold-text-piece';
      piece.setAttribute('data-fold-hinge', hinge);
      piece.style.transformOrigin = (HINGE[hinge] || HINGE.top).origin;
      if (content) piece.textContent = content;

      var crease = document.createElement('span');
      crease.className = 'fold-text__crease';
      crease.setAttribute('aria-hidden', 'true');
      piece.appendChild(crease);

      seg.appendChild(piece);
      frag.appendChild(seg);
      pieces.push(piece);
    }

    function makeWhitespace(str) {
      var ws = document.createElement('span');
      ws.className = 'fold-text-whitespace';
      ws.textContent = str.replace(/ /g, ' ');
      frag.appendChild(ws);
    }

    if (splitBy === 'line') {
      text.split('\n').forEach(function (line) {
        var wrap = document.createElement('span');
        wrap.className = 'fold-text-line';
        makeSegment(line || ' ');
        wrap.appendChild(frag.lastChild);
        frag.appendChild(wrap);
      });
    } else if (splitBy === 'word') {
      text.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { makeWhitespace(part); return; }
        makeSegment(part);
      });
    } else {
      for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        if (ch === '\n') { frag.appendChild(document.createElement('br')); continue; }
        if (ch === ' ') { makeWhitespace(' '); continue; }
        makeSegment(ch);
      }
    }

    return { frag: frag, pieces: pieces };
  }

  function initFold(el) {
    var text = (el.textContent || '').trim();
    if (!text) return;

    var splitBy = el.getAttribute('data-split') || 'char';
    var hinge = el.getAttribute('data-hinge') || 'top';
    var trigger = el.getAttribute('data-trigger') || 'mount';
    var duration = parseFloat(el.getAttribute('data-duration')) || 0.65;
    var stagger = parseFloat(el.getAttribute('data-stagger')) || 0.045;
    var perspective = Math.max(120, parseFloat(el.getAttribute('data-perspective')) || 700);
    var creaseShading = clamp(parseFloat(el.getAttribute('data-crease')) || 0.55, 0, 1);
    var hc = HINGE[hinge] || HINGE.top;

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return; // 尊重「减少动态效果」：保留原文本，不做折叠

    var built = buildPieces(text, splitBy, hinge, perspective);
    el.textContent = '';

    var sr = document.createElement('span');
    sr.className = 'fold-text-sr-only';
    sr.textContent = text;

    var visual = document.createElement('span');
    visual.className = 'fold-text-visual';
    visual.setAttribute('aria-hidden', 'true');
    visual.appendChild(built.frag);

    el.appendChild(sr);
    el.appendChild(visual);

    var pieces = built.pieces;

    function play() {
      pieces.forEach(function (piece, i) {
        var delay = i * stagger * 1000;
        var dur = duration * 1000;
        piece.animate(
          [
            { opacity: 0, transform: 'rotateX(' + hc.rotateX + 'deg) rotateY(' + hc.rotateY + 'deg)' },
            { opacity: 1, transform: 'rotateX(0deg) rotateY(0deg)' }
          ],
          { duration: dur, delay: delay, easing: EASE, fill: 'both' }
        );
        var crease = piece.querySelector('.fold-text__crease');
        if (crease) {
          crease.animate(
            [{ opacity: creaseShading }, { opacity: 0 }],
            { duration: dur, delay: delay, easing: EASE, fill: 'both' }
          );
        }
      });
    }

    if (trigger === 'scroll') {
      if (!('IntersectionObserver' in window)) { play(); return; }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { play(); io.disconnect(); }
        });
      }, { threshold: 0.15 });
      io.observe(el);
    } else if (trigger === 'hover') {
      // 初始为展开态，悬停时重新折叠播放一次
      el.addEventListener('mouseenter', play);
    } else {
      // mount
      play();
    }
  }

  function initAll() {
    var els = document.querySelectorAll('[data-foldtext]');
    Array.prototype.forEach.call(els, initFold);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
