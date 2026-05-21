/* Pelletbaits Shopify Theme JS — Light Edition */

(function () {
  'use strict';

  /* --- Scroll header shadow --- */
  var siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    window.addEventListener('scroll', function () {
      siteHeader.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }

  /* --- Language dropdown --- */
  function initLangDropdown() {
    var wrap = document.getElementById('lang-wrap');
    var btn  = document.getElementById('lang-btn');
    var drop = document.getElementById('lang-dropdown');
    if (!wrap || !btn || !drop) return;

    btn.addEventListener('click', function () {
      var isOpen = drop.classList.contains('is-open');
      drop.classList.toggle('is-open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) {
        drop.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
    drop.querySelectorAll('.header-lang-option').forEach(function (opt) {
      opt.addEventListener('click', function () {
        drop.querySelectorAll('.header-lang-option').forEach(function (o) {
          o.classList.remove('active');
          o.setAttribute('aria-selected', 'false');
        });
        opt.classList.add('active');
        opt.setAttribute('aria-selected', 'true');
        var labelEl = btn.querySelector('span');
        if (labelEl) labelEl.textContent = opt.textContent.trim();
        drop.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* --- Mobile nav --- */
  var mobileNav   = document.getElementById('mobile-nav');
  var mobileOpen  = document.getElementById('mobile-nav-open');
  var mobileClose = document.getElementById('mobile-nav-close');

  function openMobileNav() {
    if (!mobileNav) return;
    mobileNav.classList.add('is-open');
    mobileNav.setAttribute('aria-hidden', 'false');
    if (mobileOpen) mobileOpen.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeMobileNav() {
    if (!mobileNav) return;
    mobileNav.classList.remove('is-open');
    mobileNav.setAttribute('aria-hidden', 'true');
    if (mobileOpen) mobileOpen.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (mobileOpen)  mobileOpen.addEventListener('click', openMobileNav);
  if (mobileClose) mobileClose.addEventListener('click', closeMobileNav);

  /* --- Cart drawer --- */
  var cartDrawer  = document.getElementById('cart-drawer');
  var cartOverlay = document.getElementById('cart-overlay');
  var cartClose   = document.getElementById('cart-drawer-close');
  var cartItemsEl = document.getElementById('cart-drawer-items');

  function openCartDrawer() {
    if (!cartDrawer) return;
    cartDrawer.classList.add('open');
    cartDrawer.setAttribute('aria-hidden', 'false');
    if (cartOverlay) cartOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    fetchCartItems();
  }
  function closeCartDrawer() {
    if (!cartDrawer) return;
    cartDrawer.classList.remove('open');
    cartDrawer.setAttribute('aria-hidden', 'true');
    if (cartOverlay) cartOverlay.classList.remove('open');
    document.body.style.overflow = '';
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
      el.setAttribute('data-count', count);
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
          cartItemsEl.innerHTML =
            '<div class="cart-empty">' +
            '<div style="font-size:42px;margin-bottom:14px;opacity:.3">🛒</div>' +
            '<div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--ink)">Je winkelwagen is leeg</div>' +
            '<div style="font-size:13px;margin-top:6px">Voeg pellets toe en wij regelen de rest.</div>' +
            '</div>';
          return;
        }
        cartItemsEl.innerHTML = cart.items.map(function (item) {
          var imgTag = item.image
            ? '<img src="' + item.image + '" alt="' + item.product_title.replace(/"/g, '&quot;') + '" loading="lazy">'
            : '';
          return '<div class="cart-item">' +
            '<div class="cart-item-thumb">' + imgTag + '</div>' +
            '<div>' +
              '<p class="cart-item-type">' + (item.product_type || '') + '</p>' +
              '<p class="cart-item-name">' + item.product_title + '</p>' +
              '<p class="cart-item-qty">Aantal: ' + item.quantity + '</p>' +
            '</div>' +
            '<div style="text-align:right">' +
              '<p class="cart-item-price">' + formatMoney(item.final_line_price) + '</p>' +
              '<button class="cart-item-remove" data-key="' + item.key + '">Verwijderen</button>' +
            '</div>' +
          '</div>';
        }).join('');

        cartItemsEl.querySelectorAll('.cart-item-remove').forEach(function (btn) {
          btn.addEventListener('click', function () { removeCartItem(btn.dataset.key); });
        });
      })
      .catch(function () {
        if (cartItemsEl) cartItemsEl.innerHTML = '<p class="cart-empty">Fout bij laden van winkelwagen.</p>';
      });
  }

  window.pbUpdateCart = function () {
    fetch('/cart.js')
      .then(function (r) { return r.json(); })
      .then(function (cart) { updateCartBadges(cart.item_count); updateSubtotal(cart.total_price); })
      .catch(function () {});
  };

  /* --- Quantity controls (product page) --- */
  function initQtyControls() {
    document.querySelectorAll('.qty-control').forEach(function (ctrl) {
      var input = ctrl.querySelector('.qty-input');
      if (!input) return;
      var minus = ctrl.querySelector('[data-qty="minus"]');
      var plus  = ctrl.querySelector('[data-qty="plus"]');
      if (minus) minus.addEventListener('click', function () {
        var val = parseInt(input.value, 10);
        if (val > 1) { input.value = val - 1; input.dispatchEvent(new Event('change')); }
      });
      if (plus) plus.addEventListener('click', function () {
        input.value = parseInt(input.value, 10) + 1;
        input.dispatchEvent(new Event('change'));
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
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { observer.observe(el); });
  }

  /* --- Escape key --- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeMobileNav(); closeCartDrawer(); }
  });

  /* --- Init --- */
  document.addEventListener('DOMContentLoaded', function () {
    initLangDropdown();
    initQtyControls();
    initTabs();
    initAnimations();
    window.pbUpdateCart();
  });
})();
