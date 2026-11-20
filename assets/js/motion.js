/*
 * DAMSO 담소 — motion (no libraries).
 * Visual timing lives in CSS (main.css › Motion, tokens.css › --ease-*, --t1..t3).
 * This file only toggles classes:
 *   [data-reveal]      gets .in once it enters the viewport; siblings get --i: 0,1,2… for the stagger
 *   .to-top            shows after scrolling, zips its icon and scrolls to top on click
 *   html.motion        removed live if the visitor turns on "reduce motion"
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  // Accessibility: follow the OS setting live. Without .motion, everything is visible and still.
  if (reduce) {
    var sync = function () { root.classList.toggle('motion', !reduce.matches); };
    if (reduce.addEventListener) reduce.addEventListener('change', sync);
    else if (reduce.addListener) reduce.addListener(sync);
  }

  /* ---------- 2. Scroll reveal ---------- */
  var items = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));

  // Stagger index among reveal siblings, unless set by hand (style="--i:3").
  items.forEach(function (el) {
    if (el.style.getPropertyValue('--i')) return;
    var sibs = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.hasAttribute('data-reveal'); });
    el.style.setProperty('--i', sibs.indexOf(el));
  });

  if (!('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target); // once
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 7. Back to top ---------- */
  var top = document.querySelector('.to-top');
  if (top) {
    var ticking = false;
    var update = function () {
      top.classList.toggle('is-shown', window.scrollY > window.innerHeight * 0.8);
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();

    top.addEventListener('click', function () {
      top.classList.remove('zip');
      void top.offsetWidth; // restart the animation on repeated clicks
      top.classList.add('zip');
      window.scrollTo({ top: 0, behavior: reduce && reduce.matches ? 'auto' : 'smooth' });
    });
    top.addEventListener('animationend', function () { top.classList.remove('zip'); });
  }
})();
