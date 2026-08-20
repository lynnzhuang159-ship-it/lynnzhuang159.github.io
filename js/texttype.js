/* ============================================================
   TextType —— React Bits 组件的无依赖原生移植
   ------------------------------------------------------------
   原组件依赖 React + gsap，但本站点要求「零依赖 / file:// 直开 / 无构建」，
   因此用纯原生 JS 复刻其打字机效果：
     - 逐字打出文本（支持多句循环）
     - 光标闪烁用 CSS 动画替代 gsap（见 style.css 的 @keyframes textTypeBlink）
   目标元素 #hero-intro 由 main.js 在 DOMContentLoaded 填入 SITE.intro；
   本脚本在同一 DOMContentLoaded 批次之后接管，清空并重打，避免闪烁。
   ============================================================ */

(function () {
  "use strict";

  // —— 可调参数（对应 React Bits 的 props）——
  var TYPING_SPEED = 75;      // 每个字间隔(ms)
  var DELETING_SPEED = 30;    // 删除速度(ms)
  var PAUSE_DURATION = 1600;  // 打完一句后的停顿(ms)
  var INITIAL_DELAY = 400;    // 起始延迟(ms)
  var LOOP = false;           // 多句时是否循环；单句设 false = 只打一次后停住
  var SHOW_CURSOR = true;
  var CURSOR_CHAR = "|";      // 光标字符

  function initTextType(el, textArray) {
    if (!el || !textArray || !textArray.length) return;

    // 偏好减少动效：直接显示全文，不打字
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = textArray.join(" ");
      return;
    }

    var content = document.createElement("span");
    content.className = "text-type__content";

    var cursor = document.createElement("span");
    cursor.className = "text-type__cursor";
    cursor.textContent = CURSOR_CHAR;

    // 清空 main.js 填入的全文，开始逐字重打（同批次 DOMContentLoaded，不会先闪现）
    el.textContent = "";
    el.appendChild(content);
    if (SHOW_CURSOR) el.appendChild(cursor);

    var displayed = "";
    var charIndex = 0;
    var isDeleting = false;
    var textIndex = 0;
    var timer = null;

    function render() { content.textContent = displayed; }

    function step() {
      var current = textArray[textIndex];

      if (isDeleting) {
        if (displayed === "") {
          isDeleting = false;
          if (textIndex === textArray.length - 1 && !LOOP) {
            return; // 单句不循环：删空即停，保留光标
          }
          textIndex = (textIndex + 1) % textArray.length;
          charIndex = 0;
          timer = setTimeout(step, PAUSE_DURATION);
        } else {
          timer = setTimeout(function () {
            displayed = displayed.slice(0, -1);
            render();
            step();
          }, DELETING_SPEED);
        }
      } else {
        if (charIndex < current.length) {
          timer = setTimeout(function () {
            displayed += current[charIndex];
            charIndex++;
            render();
            step();
          }, TYPING_SPEED);
        } else if (textArray.length >= 1) {
          if (!LOOP && textIndex === textArray.length - 1) {
            return; // 单句打完，停住（光标继续闪烁）
          }
          timer = setTimeout(function () {
            isDeleting = true;
            step();
          }, PAUSE_DURATION);
        }
      }
    }

    timer = setTimeout(step, INITIAL_DELAY);
  }

  function start() {
    var intro = document.querySelector("#hero-intro");
    if (intro && typeof SITE !== "undefined" && SITE.intro) {
      initTextType(intro, [SITE.intro]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
