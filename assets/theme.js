/* Pelletbaits Shopify Theme JS */

(function () {
  'use strict';

  /* --- Scroll header --- */
  var siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    window.addEventListener('scroll', function () {
      siteHeader.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  /* --- Mobile nav --- */
  var mobileNav   = document.getElementById('mobile-nav');
  var mobileOpen  = document.getElementById('mobile-nav-open');
  var mobileClose = document.getElementById('mobile-nav-close');

  function openMobileNav() {
    if (!mobileNav) return;
    mobileNav.classList.add('is-open');
    mobileNav.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeMobileNav() {
    if (!mobileNav) return;
    mobileNav.classList.remove('is-open');
    mobileNav.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (mobileOpen)  mobileOpen.addEventListener('click', openMobileNav);
  if (mobileClose) mobileClose.addEventListener('click', closeMobileNav);

  /* --- Cart drawer --- */
  var cartDrawer  = document.getElementById('cart-drawer');
  var cartOverlay = document.getElementById('cart-overlay');
  var cartClose   = document.getElementById('cart-drawer-close');
  var cartItemsEl = document.getElementById('cart-drawer-items');
  var waBtn       = document.querySelector('.wa-btn');

  function openCartDrawer() {
    if (!cartDrawer) return;
    cartDrawer.classList.add('open');
    cartDrawer.setAttribute('aria-hidden', 'false');
    if (cartOverlay) cartOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (waBtn) waBtn.style.display = 'none';
    fetchCartItems();
  }
  function closeCartDrawer() {
    if (!cartDrawer) return;
    cartDrawer.classList.remove('open');
    cartDrawer.setAttribute('aria-hidden', 'true');
    if (cartOverlay) cartOverlay.classList.remove('open');
    document.body.style.overflow = '';
    if (waBtn) waBtn.style.display = '';
  }

  window.pbOpenCart  = openCartDrawer;
  window.pbCloseCart = closeCartDrawer;

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-cart-open]')) {
      e.preventDefault();
      openCartDrawer();
    }
  });
  if (cartClose)   cartClose.addEventListener('click', closeCartDrawer);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);

  function formatMoney(cents) {
    var currency = (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) || 'EUR';
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: currency }).format(cents / 100);
  }

  function updateCartBadges(count) {
    document.querySelectorAll('.cart-count, #cart-count').forEach(function (el) {
      el.textContent = count;
      el.style.display = count > 0 ? 'inline' : 'none';
    });
  }

  function updateSubtotal(totalPrice) {
    var el = document.getElementById('cart-subtotal-value');
    if (el) el.textContent = formatMoney(totalPrice);
  }

  function removeCartItem(key) {
    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: key, quantity: 0 })
    })
    .then(function (r) { return r.json(); })
    .then(function () { fetchCartItems(); })
    .catch(function () {});
  }

  function fetchCartItems() {
    if (!cartItemsEl) return;
    fetch('/cart.js')
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        updateCartBadges(cart.item_count);
        updateSubtotal(cart.total_price);
        if (cart.item_count === 0) {
          cartItemsEl.innerHTML = '<p class="cart-empty">Je winkelwagen is leeg.</p>';
          return;
        }
        cartItemsEl.innerHTML = cart.items.map(function (item) {
          var imgTag = item.image
            ? '<img src="' + item.image + '" alt="' + item.product_title + '" loading="lazy">'
            : '';
          return '<div class="cart-item">' +
            '<div class="cart-item-thumb">' + imgTag + '</div>' +
            '<div>' +
              '<p class="cart-item-type">' + (item.product_type || '') + '</p>' +
              '<p class="cart-item-name">' + item.product_title + '</p>' +
              '<p class="cart-item-qty">&times; ' + item.quantity + '</p>' +
            '</div>' +
            '<div style="text-align:right">' +
              '<p class="cart-item-price">' + formatMoney(item.final_line_price) + '</p>' +
              '<button class="cart-item-remove" data-key="' + item.key + '">Verwijder</button>' +
            '</div>' +
          '</div>';
        }).join('');

        cartItemsEl.querySelectorAll('.cart-item-remove').forEach(function (btn) {
          btn.addEventListener('click', function () { removeCartItem(btn.dataset.key); });
        });
      })
      .catch(function () {
        if (cartItemsEl) cartItemsEl.innerHTML = '<p class="cart-empty">Fout bij laden.</p>';
      });
  }

  window.pbUpdateCart = function () {
    fetch('/cart.js')
      .then(function (r) { return r.json(); })
      .then(function (cart) { updateCartBadges(cart.item_count); updateSubtotal(cart.total_price); })
      .catch(function () {});
  };

  /* --- Category interactive list --- */
  function initCategoryList() {
    var catItems = document.querySelectorAll('.cat-item');
    if (!catItems.length) return;
    catItems.forEach(function (item) {
      item.addEventListener('mouseenter', function () {
        catItems.forEach(function (i) { i.classList.remove('active'); });
        item.classList.add('active');
        var id = item.dataset.cat;
        document.querySelectorAll('.cat-image-wrap img').forEach(function (img) {
          img.classList.toggle('active', img.dataset.cat === id);
        });
        var labelEl = document.querySelector('.cat-image-label-name');
        if (labelEl) {
          var nameEl = item.querySelector('.cat-item-name');
          if (nameEl) labelEl.textContent = nameEl.textContent.trim();
        }
      });
    });
  }

  /* --- Quantity control --- */
  function initQtyControls() {
    document.querySelectorAll('.qty-control').forEach(function (ctrl) {
      var input = ctrl.querySelector('.qty-input');
      var minus = ctrl.querySelector('[data-qty="minus"]');
      var plus  = ctrl.querySelector('[data-qty="plus"]');
      if (minus) minus.addEventListener('click', function () {
        var val = parseInt(input.value, 10);
        if (val > 1) input.value = val - 1;
      });
      if (plus) plus.addEventListener('click', function () {
        input.value = parseInt(input.value, 10) + 1;
      });
    });
  }

  /* --- Product tabs --- */
  function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        document.querySelectorAll('.tab-panel').forEach(function (p) {
          p.classList.toggle('active', p.id === target);
        });
      });
    });
  }

  /* --- Theme toggle --- */
  function initThemeToggle() {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var html = document.documentElement;
      var isLight = html.getAttribute('data-theme') === 'light';
      html.classList.add('theme-transition');
      setTimeout(function () { html.classList.remove('theme-transition'); }, 320);
      if (isLight) {
        html.removeAttribute('data-theme');
        localStorage.removeItem('pb-theme');
      } else {
        html.setAttribute('data-theme', 'light');
        localStorage.setItem('pb-theme', 'light');
      }
    });
  }

  /* --- Scroll-in animations --- */
  function initAnimations() {
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var els = document.querySelectorAll('[data-anim]');
    if (prefersReduced || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('anim-visible'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = el.dataset.animDelay;
        if (delay) el.style.transitionDelay = delay + 'ms';
        el.classList.add('anim-visible');
        observer.unobserve(el);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -48px 0px' });
    els.forEach(function (el) { observer.observe(el); });
  }

  /* --- Language dropdown --- */
  function initLangDropdown() {
    var btn = document.getElementById('lang-btn');
    var dropdown = document.getElementById('lang-dropdown');
    if (!btn || !dropdown) return;

    btn.addEventListener('click', function () {
      var isOpen = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!isOpen));
      dropdown.hidden = isOpen;
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('#lang-select-wrap')) {
        btn.setAttribute('aria-expanded', 'false');
        dropdown.hidden = true;
      }
    });
  }

  /* --- Escape key --- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeMobileNav();
      closeCartDrawer();
      var langBtn = document.getElementById('lang-btn');
      var langDrop = document.getElementById('lang-dropdown');
      if (langBtn) langBtn.setAttribute('aria-expanded', 'false');
      if (langDrop) langDrop.hidden = true;
    }
  });

  /* --- Init --- */
  document.addEventListener('DOMContentLoaded', function () {
    initCategoryList();
    initQtyControls();
    initTabs();
    initThemeToggle();
    initAnimations();
    initLangDropdown();
    window.pbUpdateCart();
  });
})();
