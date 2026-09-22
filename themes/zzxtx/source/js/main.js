/* zzxtx 主题交互脚本：暗色切换 / 阅读进度 / 目录高亮 / 代码复制 / 返回顶部 */
(function () {
  var d = document;
  var root = d.documentElement;

  /* ---------- 暗色模式切换（持久化） ---------- */
  var toggle = d.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { /* 隐私模式下忽略 */ }
    });
  }

  /* ---------- 代码块：语言标签 + 复制按钮 ---------- */
  Array.prototype.forEach.call(d.querySelectorAll('figure.highlight'), function (fig) {
    var classes = fig.className.split(/\s+/);
    var lang = '';
    classes.forEach(function (c) {
      if (c && c !== 'highlight') lang = c;
    });
    if (lang && lang !== 'plain' && lang !== 'undefined') {
      var lb = d.createElement('span');
      lb.className = 'code-lang';
      lb.textContent = lang.toUpperCase();
      fig.appendChild(lb);
    }

    var btn = d.createElement('button');
    btn.className = 'copy-btn';
    btn.type = 'button';
    btn.textContent = '复制';
    btn.addEventListener('click', function () {
      var pre = fig.querySelector('.code pre') || fig.querySelector('pre');
      var text = pre ? pre.innerText : '';
      function done(ok) {
        btn.textContent = ok ? '已复制' : '复制失败';
        setTimeout(function () { btn.textContent = '复制'; }, 1600);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
      } else {
        var ta = d.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        d.body.appendChild(ta);
        ta.select();
        var ok = false;
        try { ok = d.execCommand('copy'); } catch (e) { ok = false; }
        d.body.removeChild(ta);
        done(ok);
      }
    });
    fig.appendChild(btn);
  });

  /* ---------- 滚动相关：进度条 / 返回顶部 / 目录高亮 ---------- */
  var bar = d.getElementById('reading-progress');
  var backTop = d.getElementById('back-top');
  var entry = d.querySelector('.article-entry');

  var tocItems = [];
  Array.prototype.forEach.call(d.querySelectorAll('#post-toc a'), function (a) {
    var href = a.getAttribute('href') || '';
    var id = href.charAt(0) === '#' ? decodeURIComponent(href.slice(1)) : '';
    var h = id ? d.getElementById(id) : null;
    if (h) tocItems.push({ h: h, a: a });
  });

  function highlightToc() {
    var pos = window.scrollY + 96;
    var idx = -1;
    tocItems.forEach(function (t, i) {
      if (t.h.getBoundingClientRect().top + window.scrollY <= pos) idx = i;
    });
    tocItems.forEach(function (t, i) {
      t.a.classList.toggle('active', i === idx);
    });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      var st = window.scrollY || root.scrollTop;

      if (bar) {
        if (entry) {
          var start = entry.getBoundingClientRect().top + window.scrollY;
          var total = entry.offsetHeight - window.innerHeight;
          var p = total > 0 ? ((st - start) / total) * 100 : 0;
          bar.style.width = Math.min(100, Math.max(0, p)) + '%';
        } else {
          bar.style.width = '0';
        }
      }

      if (backTop) backTop.classList.toggle('show', st > 400);

      if (tocItems.length) highlightToc();

      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  if (backTop) {
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
})();
