(function () {
  'use strict';

  var d = document;
  var root = d.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var themeToggle = d.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (error) { /* Storage may be unavailable. */ }
    });
  }

  var nav = d.querySelector('.site-nav');
  var navToggle = d.getElementById('nav-toggle');
  var navLinks = d.getElementById('nav-links');
  if (nav && navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
    });
    navLinks.addEventListener('click', function () {
      nav.classList.remove('nav-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', '打开导航');
    });
  }

  var navSpyItems = [];
  var navSpyHome = null;
  var navSpyLock = 0;

  if (navLinks && d.body.classList.contains('home-page')) {
    Array.prototype.forEach.call(navLinks.querySelectorAll('a'), function (link) {
      var hash = link.getAttribute('data-nav-hash');
      if (hash) {
        var target = d.getElementById(hash);
        if (target) navSpyItems.push({ link: link, target: target });
        return;
      }
      if (link.getAttribute('data-nav-root') === '1') navSpyHome = { link: link, target: null };
    });
  }

  function setNavActive(activeItem) {
    if (navSpyHome) navSpyHome.link.classList.toggle('active', activeItem === navSpyHome);
    navSpyItems.forEach(function (item) { item.link.classList.toggle('active', item === activeItem); });
  }

  function syncNavActive() {
    if (!navSpyItems.length || Date.now() < navSpyLock) return;
    var line = (nav ? nav.offsetHeight : 60) + 8;
    var current = navSpyHome;
    navSpyItems.forEach(function (item) {
      if (item.target.getBoundingClientRect().top <= line) current = item;
    });
    if (current) setNavActive(current);
  }

  if (navSpyItems.length) {
    var navSpyAll = navSpyHome ? [navSpyHome].concat(navSpyItems) : navSpyItems.slice();
    navSpyAll.forEach(function (item) {
      item.link.addEventListener('click', function (event) {
        if (item === navSpyHome) {
          event.preventDefault();
          window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        }
        navSpyLock = Date.now() + 1000;
        setNavActive(item);
      });
    });
  }

  Array.prototype.forEach.call(d.querySelectorAll('figure.highlight'), function (figure) {
    var classes = figure.className.split(/\s+/);
    var language = '';
    classes.forEach(function (name) {
      if (name && name !== 'highlight') language = name;
    });
    if (language && language !== 'plain' && language !== 'undefined') {
      var label = d.createElement('span');
      label.className = 'code-lang';
      label.textContent = language.toUpperCase();
      figure.appendChild(label);
    }

    var button = d.createElement('button');
    button.className = 'copy-btn';
    button.type = 'button';
    button.textContent = '复制';
    button.setAttribute('aria-label', '复制代码');
    button.addEventListener('click', function () {
      var pre = figure.querySelector('.code pre') || figure.querySelector('pre');
      var text = pre ? pre.innerText : '';
      function finish(ok) {
        button.textContent = ok ? '已复制' : '复制失败';
        window.setTimeout(function () { button.textContent = '复制'; }, 1500);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { finish(true); }, function () { finish(false); });
        return;
      }
      var textarea = d.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      d.body.appendChild(textarea);
      textarea.select();
      var copied = false;
      try { copied = d.execCommand('copy'); } catch (error) { copied = false; }
      d.body.removeChild(textarea);
      finish(copied);
    });
    figure.appendChild(button);
  });

  var searchDialog = d.getElementById('search-dialog');
  var searchOpen = d.getElementById('search-open');
  var searchClose = d.getElementById('search-close');
  var searchInput = d.getElementById('search-input');
  var searchResults = d.getElementById('search-results');
  var searchDataNode = d.getElementById('search-data');
  var searchData = [];
  var searchMaxResults = 8;
  var searchShortcut = '/';

  if (searchDataNode) {
    try { searchData = JSON.parse(searchDataNode.textContent || '[]'); } catch (error) { searchData = []; }
  }

  if (searchDialog) {
    var maxResultsAttr = parseInt(searchDialog.getAttribute('data-max-results'), 10);
    if (maxResultsAttr > 0) searchMaxResults = maxResultsAttr;
    var shortcutAttr = searchDialog.getAttribute('data-shortcut');
    if (shortcutAttr) searchShortcut = shortcutAttr;
  }

  function isSearchOpen() {
    return searchDialog && searchDialog.hasAttribute('open');
  }

  function openSearch() {
    if (!searchDialog) return;
    if (typeof searchDialog.showModal === 'function') searchDialog.showModal();
    else searchDialog.setAttribute('open', '');
    window.setTimeout(function () { if (searchInput) searchInput.focus(); }, 0);
  }

  function closeSearch() {
    if (!searchDialog) return;
    if (typeof searchDialog.close === 'function') searchDialog.close();
    else searchDialog.removeAttribute('open');
  }

  function makeResult(post, query) {
    var link = d.createElement('a');
    link.className = 'search-result';
    link.href = post.url;

    var title = d.createElement('strong');
    title.textContent = post.title;
    link.appendChild(title);

    var normalizedText = post.text || '';
    var position = normalizedText.toLowerCase().indexOf(query);
    var start = Math.max(0, position > -1 ? position - 34 : 0);
    var excerpt = normalizedText.slice(start, start + 110);
    if (start > 0) excerpt = '…' + excerpt;
    if (start + 110 < normalizedText.length) excerpt += '…';
    var paragraph = d.createElement('p');
    paragraph.textContent = excerpt || '打开文章查看详情';
    link.appendChild(paragraph);

    var meta = d.createElement('span');
    meta.className = 'search-result-meta';
    meta.textContent = [post.date].concat((post.tags || []).slice(0, 3)).join(' · ');
    link.appendChild(meta);
    return link;
  }

  function renderSearch(value) {
    if (!searchResults) return;
    var query = String(value || '').trim().toLowerCase();
    searchResults.textContent = '';
    if (!query) {
      var hint = d.createElement('p');
      hint.className = 'search-empty';
      hint.textContent = '输入关键词开始搜索';
      searchResults.appendChild(hint);
      return;
    }
    var matches = searchData.filter(function (post) {
      return [post.title, post.text, (post.tags || []).join(' ')].join(' ').toLowerCase().indexOf(query) !== -1;
    }).slice(0, searchMaxResults);
    if (!matches.length) {
      var empty = d.createElement('p');
      empty.className = 'search-empty';
      empty.textContent = '没有找到相关记录，换个关键词试试。';
      searchResults.appendChild(empty);
      return;
    }
    matches.forEach(function (post) { searchResults.appendChild(makeResult(post, query)); });
  }

  if (searchOpen) searchOpen.addEventListener('click', openSearch);
  if (searchClose) searchClose.addEventListener('click', closeSearch);
  if (searchInput) searchInput.addEventListener('input', function () { renderSearch(searchInput.value); });
  if (searchDialog) {
    searchDialog.addEventListener('click', function (event) {
      if (event.target !== searchDialog) return;
      var rect = searchDialog.getBoundingClientRect();
      var inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (!inside) closeSearch();
    });
  }
  d.addEventListener('keydown', function (event) {
    var target = event.target;
    var typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);
    if ((event.key === searchShortcut && !typing) || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')) {
      event.preventDefault();
      if (!isSearchOpen()) openSearch();
    }
  });

  var progress = d.getElementById('reading-progress');
  var backTop = d.getElementById('back-top');
  var article = d.querySelector('.article-entry');
  var tocItems = [];
  Array.prototype.forEach.call(d.querySelectorAll('#post-toc a'), function (link) {
    var href = link.getAttribute('href') || '';
    var id = '';
    try { id = href.charAt(0) === '#' ? decodeURIComponent(href.slice(1)) : ''; } catch (error) { id = ''; }
    var heading = id ? d.getElementById(id) : null;
    if (heading) tocItems.push({ heading: heading, link: link });
  });

  function updateToc(scrollTop) {
    var active = -1;
    tocItems.forEach(function (item, index) {
      if (item.heading.getBoundingClientRect().top + window.scrollY <= scrollTop + 104) active = index;
    });
    tocItems.forEach(function (item, index) { item.link.classList.toggle('active', index === active); });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      var scrollTop = window.scrollY || root.scrollTop;
      if (progress) {
        if (article) {
          var start = article.getBoundingClientRect().top + window.scrollY;
          var total = article.offsetHeight - window.innerHeight;
          var percent = total > 0 ? ((scrollTop - start) / total) * 100 : 0;
          progress.style.width = Math.min(100, Math.max(0, percent)) + '%';
        } else progress.style.width = '0';
      }
      if (backTop) backTop.classList.toggle('show', scrollTop > 500);
      if (tocItems.length) updateToc(scrollTop);
      syncNavActive();
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', syncNavActive);
  onScroll();
  if (backTop) {
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }
})();
