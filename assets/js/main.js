/* DAMSO 담소 — page interactions (no dependencies). */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var setText = function (sel, text) { $$(sel).forEach(function (el) { el.textContent = text; }); };

  /* ---------- Choice chips ----------
   * <div data-choice="name"><button class="chip" data-value="a" aria-pressed="true">…</button>…</div>
   * Clicking a chip selects it and calls every listener registered with onChoice(name, fn).
   */
  var listeners = {};
  function onChoice(name, fn) { (listeners[name] = listeners[name] || []).push(fn); }
  function selectChip(group, btn) {
    $$('[data-value]', group).forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
    (listeners[group.dataset.choice] || []).forEach(function (fn) { fn(btn.dataset.value, btn); });
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-choice] [data-value]');
    if (btn) selectChip(btn.closest('[data-choice]'), btn);
  });
  function current(name) {
    var b = $('[data-choice="' + name + '"] [aria-pressed="true"]');
    return b ? b.dataset.value : '';
  }

  /* ---------- Home: find your table ---------- */
  var TABLES = {
    '4': { name: '타원형 원목 식탁 1800', size: '1800 × 900 mm', room: '약 3.6 × 2.7 m', price: '450만 원부터' },
    '6': { name: '타원형 원목 식탁 2100', size: '2100 × 950 mm', room: '약 3.9 × 2.75 m', price: '520만 원부터' },
    '8': { name: '타원형 원목 식탁 2400', size: '2400 × 1000 mm', room: '약 4.2 × 2.8 m', price: '590만 원부터' }
  };
  onChoice('seats', function (v) {
    var t = TABLES[v];
    if (!t) return;
    Object.keys(t).forEach(function (k) { setText('[data-fit="' + k + '"]', t[k]); });
  });

  /* ---------- Home: craftsman quotes ---------- */
  var quoteRoot = $('[data-quotes]');
  if (quoteRoot) {
    var QUOTES = [
      '한 점의 식탁은 한 사람의 손이 처음부터 끝까지 맡아요. 그래야 어디가 어떻게 이어졌는지 끝까지 책임질 수 있으니까요.',
      '나무는 서두르면 반드시 티가 나요. 충분히 말리고, 결을 읽고, 대패질은 손이 기억할 때까지 천천히 합니다.',
      '못을 쓰지 않는 건 고집이 아니에요. 다시 풀고 조일 수 있어야, 다음 세대까지 고쳐 쓸 수 있거든요.'
    ];
    var text = $('blockquote', quoteRoot);
    var dots = $$('.dots button', quoteRoot);
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        text.textContent = QUOTES[i];
        dots.forEach(function (d, j) { d.setAttribute('aria-pressed', String(i === j)); });
      });
    });
  }

  /* ---------- Home: real-homes rail ---------- */
  var track = $('[data-track]');
  if (track) {
    var nextBtn = $('[data-track-next]');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        var card = $('article', track);
        var step = card ? card.offsetWidth + 24 : track.clientWidth * 0.4;
        var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
        track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + step, behavior: 'smooth' });
      });
    }
    var drag = null;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      drag = { x: e.clientX, left: track.scrollLeft };
      track.classList.add('is-dragging');
    });
    track.addEventListener('pointermove', function (e) {
      if (drag) track.scrollLeft = drag.left - (e.clientX - drag.x);
    });
    var end = function () { drag = null; track.classList.remove('is-dragging'); };
    track.addEventListener('pointerup', end);
    track.addEventListener('pointerleave', end);
  }

  /* ---------- Product: wood & size ---------- */
  var PRICES = { '1800': '450만 원부터', '2100': '520만 원부터', '2400': '590만 원부터' };
  onChoice('wood', function (v, btn) { setText('[data-out="woodName"]', btn.textContent); });
  onChoice('size', function (v) {
    setText('[data-out="sizeName"]', v + ' mm');
    setText('[data-out="price"]', PRICES[v]);
  });

  /* ---------- Showroom: reservation ---------- */
  var form = $('[data-reserve-form]');
  if (form) {
    var WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
    var daysEl = $('[data-choice="day"]', form);
    // Next six open days (closed Mondays), starting tomorrow.
    var d = new Date();
    var added = 0;
    while (added < 6) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() === 1) continue;
      var label = (d.getMonth() + 1) + '/' + d.getDate() + ' (' + WEEKDAYS[d.getDay()] + ')';
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip chip--field';
      b.dataset.value = label;
      b.setAttribute('aria-pressed', 'false');
      b.textContent = label;
      daysEl.appendChild(b);
      added++;
    }

    var submit = $('[data-reserve-submit]', form);
    var done = $('[data-reserve-done]');
    var refresh = function () {
      var day = current('day'), time = current('time');
      var ready = Boolean(day && time);
      submit.textContent = ready ? day + ' ' + time + ' 예약 요청' : '날짜와 시간을 선택해 주세요';
      submit.setAttribute('aria-disabled', String(!ready));
      return ready;
    };
    onChoice('day', refresh);
    onChoice('time', refresh);
    refresh();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!refresh()) return;
      setText('[data-out="summary"]', current('day') + ' ' + current('time') + ' · ' + current('purpose'));
      form.hidden = true;
      done.hidden = false;
      done.focus({ preventScroll: true });
      afterLayoutChange();
    });
    $('[data-reserve-reset]').addEventListener('click', function () {
      $$('[data-choice="day"] [data-value], [data-choice="time"] [data-value]', form)
        .forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      refresh();
      done.hidden = true;
      form.hidden = false;
      afterLayoutChange();
    });

    // The form and the confirmation differ in height: keep the section's top in view.
    function afterLayoutChange() {
      var section = document.getElementById('reserve');
      if (section.getBoundingClientRect().top < 0) section.scrollIntoView({ block: 'start' });
    }
  }
})();
