/* ============================================
   BRAWL — SHARED JAVASCRIPT
   Nav toggle, scroll reveal, countdown, helpers
   ============================================ */

// === MOBILE NAV TOGGLE ===
(function() {
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if (!navToggle || !navLinks) return;

  navToggle.addEventListener('click', function() {
    var isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen);
  });

  navLinks.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', function(e) {
    if (!navLinks.contains(e.target) && !navToggle.contains(e.target)) {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
})();

// === REVEAL ON SCROLL ===
(function() {
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(function(el) {
    observer.observe(el);
  });
})();

// === COUNTDOWN TO 21:00 LOCAL ===
(function() {
  function updateCountdown() {
    var now = new Date();
    var target = new Date(now);
    target.setHours(21, 0, 0, 0);
    if (now > target) target.setDate(target.getDate() + 1);

    var diff = target - now;
    var h = String(Math.floor(diff / 3600000)).padStart(2, '0');
    var m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    var s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');

    document.querySelectorAll('.countdown').forEach(function(el) {
      el.textContent = h + ':' + m + ':' + s;
    });
  }

  var countdownInterval = null;
  function startCountdown() {
    if (!countdownInterval) {
      updateCountdown();
      countdownInterval = setInterval(updateCountdown, 1000);
    }
  }
  function stopCountdown() {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }

  document.addEventListener('visibilitychange', function() {
    if (document.hidden) stopCountdown();
    else startCountdown();
  });

  startCountdown();
})();

// === HELPER: Format numbers ===
window.Brawl = {
  formatNumber: function(n) {
    return n.toLocaleString('en-IN');
  },

  // Simple localStorage wrapper for clout/votes
  store: {
    get: function(key, fallback) {
      try {
        var v = localStorage.getItem('brawl_' + key);
        return v ? JSON.parse(v) : fallback;
      } catch(e) { return fallback; }
    },
    set: function(key, val) {
      try { localStorage.setItem('brawl_' + key, JSON.stringify(val)); } catch(e) {}
    }
  }
};
