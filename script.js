// ============================================================
// VANTRA — interactions
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 1. Navbar shrink + drawer toggle ---------- */
  const nav = document.getElementById('nav');
  const burger = document.getElementById('navBurger');
  const drawer = document.getElementById('navDrawer');

  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 24);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  burger.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('open');
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
  });

  // close drawer when a link inside it is tapped
  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      drawer.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- 2. Scroll-reveal for .reveal elements ---------- */
  const revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => io.observe(el));
  } else {
    // fallback: just show everything
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ---------- 3. Animated stat counters ---------- */
  const counters = document.querySelectorAll('.stat-num');

  const animateCount = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const duration = 1200;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(eased * target);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target;
      }
    };
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window && counters.length) {
    const counterIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          counterIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });

    counters.forEach(el => counterIO.observe(el));
  } else {
    counters.forEach(el => { el.textContent = el.dataset.count; });
  }

  /* ---------- 4. Smooth-close drawer on resize past tablet breakpoint ---------- */
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
      drawer.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });

  /* ============================================================
     5. PRODUCT CATALOGUE + CART + RAZORPAY CHECKOUT
     ============================================================ */

  // ---- 5a. Replace with your own Razorpay TEST Key ID. ----
  // This must be the public "Key ID" (starts with rzp_test_...), never the
  // Key Secret — the secret should only ever live on a server, never here.
  const RAZORPAY_KEY_ID = 'rzp_test_REPLACE_WITH_YOUR_KEY_ID';

  // ---- 5b. Product catalogue (mirrors products.sql — see server-example.js
  // for the live SQL-backed /api/search endpoint this falls back from).
  // Prices are in rupees; converted to paise only at checkout time.
  const PRODUCTS = [
    { id: 'mob-01a', name: 'Lumen X12 5G', cat: 'Mobiles', variant: '128GB · Graphite', icon: '📱', spec: '5000mAh · 5G', price: 24999 },
    { id: 'mob-01b', name: 'Lumen X12 5G', cat: 'Mobiles', variant: '256GB · Ocean Blue', icon: '📱', spec: '5000mAh · 5G', price: 27999 },
    { id: 'mob-02a', name: 'Aria Lite 5G', cat: 'Mobiles', variant: '64GB · Black', icon: '📱', spec: '4500mAh · 5G', price: 14499 },
    { id: 'mob-02b', name: 'Aria Lite 5G', cat: 'Mobiles', variant: '128GB · Silver', icon: '📱', spec: '4500mAh · 5G', price: 16499 },
    { id: 'lap-01a', name: 'Forge 14 Ultrabook', cat: 'Laptops', variant: '16GB / 512GB · Space Grey', icon: '💻', spec: 'Intel i5', price: 54990 },
    { id: 'lap-01b', name: 'Forge 14 Ultrabook', cat: 'Laptops', variant: '16GB / 1TB · Silver', icon: '💻', spec: 'Intel i5', price: 59990 },
    { id: 'lap-02',  name: 'Workbench Pro 16',   cat: 'Laptops', variant: '32GB / 1TB · Black', icon: '💻', spec: 'Intel i7', price: 89990 },
    { id: 'tv-01a',  name: 'Vantra 55" 4K Smart TV', cat: 'TV & Audio', variant: '55-inch', icon: '📺', spec: '4K HDR · WebOS', price: 42990 },
    { id: 'tv-01b',  name: 'Vantra 65" 4K Smart TV', cat: 'TV & Audio', variant: '65-inch', icon: '📺', spec: '4K HDR · WebOS', price: 58990 },
    { id: 'tv-02',   name: 'Pulse Soundbar 2.1',     cat: 'TV & Audio', variant: '2.1 Channel · Black', icon: '🔊', spec: '120W · Bluetooth', price: 6499 },
    { id: 'app-01a', name: 'ChillCore Fridge', cat: 'Appliances', variant: '260L · Silver', icon: '🧊', spec: 'Frost-free · 3 Star', price: 28990 },
    { id: 'app-01b', name: 'ChillCore Fridge', cat: 'Appliances', variant: '340L · Black Steel', icon: '🧊', spec: 'Frost-free · 4 Star', price: 34990 },
    { id: 'app-02',  name: 'SpinWash Washer',  cat: 'Appliances', variant: '7kg · White', icon: '🌀', spec: 'Front-load · Inverter', price: 19990 },
    { id: 'app-03a', name: 'AeroCool Tower Fan', cat: 'Appliances', variant: 'Standard · White', icon: '🌬', spec: 'Remote · 3 Speeds', price: 3499 },
    { id: 'app-03b', name: 'AeroCool Tower Fan', cat: 'Appliances', variant: 'Smart Wi-Fi · Black', icon: '🌬', spec: 'App Control', price: 4999 },
  ];

  // Shared id -> product lookup. Search results (whether from the SQL API
  // or the client-side fallback) get merged into this so cart rendering
  // always has a single source of truth, regardless of where a product
  // was added from (catalogue grid vs. search panel).
  const PRODUCT_INDEX = {};
  PRODUCTS.forEach(p => { PRODUCT_INDEX[p.id] = p; });

  const rupee = (n) => '₹' + n.toLocaleString('en-IN');

  // ---- 5c. Cart state, persisted in localStorage so it survives reloads ----
  let cart = JSON.parse(localStorage.getItem('vantra_cart') || '{}'); // { productId: qty }

  const saveCart = () => localStorage.setItem('vantra_cart', JSON.stringify(cart));

  const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = () => Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = PRODUCT_INDEX[id];
    return sum + (p ? p.price * qty : 0);
  }, 0);

  // ---- 5d. Render product grid ----
  const productGrid = document.getElementById('productGrid');
  const productCardHtml = (p) => `
    <article class="product-card" data-id="${p.id}">
      <span class="product-icon">${p.icon}</span>
      <span class="product-cat">${p.cat}</span>
      <h3>${p.name}</h3>
      <p class="product-spec">${p.variant} · ${p.spec}</p>
      <div class="product-foot">
        <span class="product-price">${rupee(p.price)}<small>incl. GST</small></span>
        <button class="add-to-cart-btn" data-id="${p.id}">Add to Cart</button>
      </div>
    </article>`;

  if (productGrid) {
    productGrid.innerHTML = PRODUCTS.map(productCardHtml).join('');
  }

  // ---- 5e. Cart drawer elements ----
  const cartOverlay = document.getElementById('cartOverlay');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartItemsEl = document.getElementById('cartItems');
  const cartEmptyEl = document.getElementById('cartEmpty');
  const cartSubtotalEl = document.getElementById('cartSubtotal');
  const cartTotalEl = document.getElementById('cartTotal');
  const cartBadge = document.getElementById('cartBadge');
  const cartBadgeMobile = document.getElementById('cartBadgeMobile');

  const openCart = () => { cartDrawer.classList.add('open'); cartOverlay.classList.add('open'); };
  const closeCart = () => { cartDrawer.classList.remove('open'); cartOverlay.classList.remove('open'); };

  document.getElementById('cartBtn')?.addEventListener('click', openCart);
  document.getElementById('cartBtnMobile')?.addEventListener('click', () => {
    drawer.classList.remove('open'); burger.classList.remove('open');
    openCart();
  });
  document.getElementById('cartClose')?.addEventListener('click', closeCart);
  cartOverlay?.addEventListener('click', closeCart);

  function renderCart() {
    const entries = Object.entries(cart).filter(([, qty]) => qty > 0);

    cartEmptyEl.style.display = entries.length ? 'none' : 'block';
    cartItemsEl.querySelectorAll('.cart-item').forEach(el => el.remove());

    entries.forEach(([id, qty]) => {
      const p = PRODUCT_INDEX[id];
      if (!p) return;
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <span class="cart-item-icon">${p.icon}</span>
        <div>
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-price">${rupee(p.price)} × ${qty}</div>
        </div>
        <div class="cart-item-actions">
          <div class="qty-stepper">
            <button data-action="dec" data-id="${id}" aria-label="Decrease quantity">−</button>
            <span>${qty}</span>
            <button data-action="inc" data-id="${id}" aria-label="Increase quantity">+</button>
          </div>
          <button class="cart-item-remove" data-action="remove" data-id="${id}">Remove</button>
        </div>`;
      cartItemsEl.appendChild(row);
    });

    const total = cartTotal();
    cartSubtotalEl.textContent = rupee(total);
    cartTotalEl.textContent = rupee(total);

    const count = cartCount();
    cartBadge.textContent = count;
    cartBadgeMobile.textContent = count;
  }

  // delegated click handling for qty steppers / remove / add-to-cart
  document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.add-to-cart-btn');
    if (addBtn) {
      const id = addBtn.dataset.id;
      cart[id] = (cart[id] || 0) + 1;
      saveCart();
      renderCart();
      addBtn.textContent = 'Added ✓';
      addBtn.classList.add('in-cart');
      setTimeout(() => { addBtn.textContent = 'Add to Cart'; addBtn.classList.remove('in-cart'); }, 1100);
      return;
    }

    const stepBtn = e.target.closest('.qty-stepper button, .cart-item-remove');
    if (stepBtn) {
      const id = stepBtn.dataset.id;
      const action = stepBtn.dataset.action;
      if (action === 'inc') cart[id] = (cart[id] || 0) + 1;
      if (action === 'dec') cart[id] = Math.max(0, (cart[id] || 0) - 1);
      if (action === 'remove') delete cart[id];
      saveCart();
      renderCart();
    }
  });

  renderCart(); // initial paint from localStorage

  /* ============================================================
     5f. SEARCH PANEL — queries the SQL-backed /api/search endpoint
     (see server-example.js + products.sql), with a client-side
     fallback so the page still works when no backend is running.
     ============================================================ */
  const searchOverlay = document.getElementById('searchOverlay');
  const searchPanel = document.getElementById('searchPanel');
  const searchInput = document.getElementById('searchInput');
  const searchResultsEl = document.getElementById('searchResults');
  const searchMetaEl = document.getElementById('searchMeta');
  const searchHintEl = document.getElementById('searchHint');

  const openSearch = () => {
    searchPanel.classList.add('open');
    searchOverlay.classList.add('open');
    setTimeout(() => searchInput.focus(), 150);
  };
  const closeSearch = () => {
    searchPanel.classList.remove('open');
    searchOverlay.classList.remove('open');
  };

  document.getElementById('searchIconBtn')?.addEventListener('click', openSearch);
  document.getElementById('searchIconBtnMobile')?.addEventListener('click', () => {
    drawer.classList.remove('open'); burger.classList.remove('open');
    openSearch();
  });
  document.getElementById('searchClose')?.addEventListener('click', closeSearch);
  searchOverlay?.addEventListener('click', closeSearch);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchPanel.classList.contains('open')) closeSearch();
  });

  // Client-side fallback search — same matching fields the SQL query
  // checks (name, category, variant, spec), used only if /api/search
  // is unreachable (e.g. server-example.js isn't running locally).
  function localSearch(query) {
    const q = query.toLowerCase();
    return PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.cat.toLowerCase().includes(q) ||
      p.variant.toLowerCase().includes(q) ||
      p.spec.toLowerCase().includes(q)
    );
  }

  function renderSearchResults(results, source) {
    searchHintEl.style.display = results.length ? 'none' : 'block';
    searchHintEl.textContent = results.length ? '' : `No products match that search.`;

    searchMetaEl.textContent = results.length
      ? `${results.length} result${results.length === 1 ? '' : 's'} · via ${source}`
      : '';

    results.forEach(p => { PRODUCT_INDEX[p.id] = p; }); // keep cart lookups in sync

    const grid = results.length ? `<div class="search-grid">${results.map(p => `
      <article class="search-result-card" data-id="${p.id}">
        <span class="search-result-icon">${p.icon}</span>
        <div class="search-result-info">
          <div class="search-result-name">${p.name}</div>
          <div class="search-result-variant">${p.variant}</div>
          <div class="search-result-price">${rupee(p.price)}</div>
        </div>
        <button class="search-result-add" data-id="${p.id}" aria-label="Add ${p.name} to cart">+</button>
      </article>`).join('')}</div>` : '';

    searchResultsEl.querySelectorAll('.search-grid').forEach(el => el.remove());
    searchResultsEl.insertAdjacentHTML('beforeend', grid);
  }

  // clicking a result (or its + button) adds it to the cart
  searchResultsEl.addEventListener('click', (e) => {
    const card = e.target.closest('.search-result-card');
    if (!card) return;
    const id = card.dataset.id;
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    renderCart();
    const addBtn = card.querySelector('.search-result-add');
    addBtn.textContent = '✓';
    setTimeout(() => { addBtn.textContent = '+'; }, 900);
  });

  let searchDebounce;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    const query = searchInput.value.trim();

    if (!query) {
      searchResultsEl.querySelectorAll('.search-grid').forEach(el => el.remove());
      searchMetaEl.textContent = '';
      searchHintEl.style.display = 'block';
      searchHintEl.textContent = 'Search runs against the product database — try a category, a spec, or a brand-style keyword.';
      return;
    }

    searchDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(2500) });
        if (!res.ok) throw new Error('search api error');
        const data = await res.json();
        renderSearchResults(data.results || [], 'SQL database');
      } catch (err) {
        // No backend running (or it's offline) — fall back to an
        // identical search over the local catalogue copy.
        renderSearchResults(localSearch(query), 'local catalogue');
      }
    }, 250); // debounce so we're not hammering the API on every keystroke
  });

  /* ============================================================
     6. CHECKOUT MODAL + RAZORPAY PAYMENT
     ============================================================ */
  const checkoutOverlay = document.getElementById('checkoutOverlay');
  const checkoutForm = document.getElementById('checkoutForm');
  const checkoutAmountEl = document.getElementById('checkoutAmount');
  const payNowBtn = document.getElementById('payNowBtn');
  const payToast = document.getElementById('payToast');
  const payToastDetail = document.getElementById('payToastDetail');

  document.getElementById('openCheckoutBtn')?.addEventListener('click', () => {
    if (cartCount() === 0) return;
    checkoutAmountEl.textContent = rupee(cartTotal());
    checkoutOverlay.classList.add('open');
    closeCart();
  });
  document.getElementById('checkoutClose')?.addEventListener('click', () => {
    checkoutOverlay.classList.remove('open');
  });
  checkoutOverlay?.addEventListener('click', (e) => {
    if (e.target === checkoutOverlay) checkoutOverlay.classList.remove('open');
  });

  function showPayToast(message) {
    payToastDetail.textContent = message;
    payToast.classList.add('show');
    setTimeout(() => payToast.classList.remove('show'), 5000);
  }

  checkoutForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    if (typeof Razorpay === 'undefined') {
      alert('Razorpay script failed to load — check your internet connection and try again.');
      return;
    }

    const name = document.getElementById('custName').value.trim();
    const email = document.getElementById('custEmail').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const amountRupees = cartTotal();

    if (amountRupees <= 0) return;

    payNowBtn.disabled = true;
    payNowBtn.textContent = 'Opening Razorpay…';

    // ------------------------------------------------------------------
    // PRODUCTION NOTE:
    // In a real deployment, do NOT build the order client-side like this.
    // Instead:
    //   1. POST the cart to your backend.
    //   2. Backend calls Razorpay Orders API with your Key Secret to
    //      create an `order_id` for this exact amount.
    //   3. Backend returns that order_id to the browser.
    //   4. Pass `order_id` into the options below instead of a raw amount.
    //   5. On success, verify the returned signature on your backend
    //      (razorpay_payment_id, razorpay_order_id, razorpay_signature)
    //      before marking the order as paid.
    // This client-only flow is fine for a demo / test-mode walkthrough,
    // but a payment without server-side order creation + signature
    // verification can be tampered with and should never be trusted
    // for real transactions. See server-example.js for a reference
    // Node/Express implementation of steps 2 and 5.
    // ------------------------------------------------------------------

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: Math.round(amountRupees * 100), // paise
      currency: 'INR',
      name: 'Vantra Electronics',
      description: `${cartCount()} item(s) — Order`,
      image: '',
      prefill: { name, email, contact: phone },
      notes: { address },
      theme: { color: '#FF5A1F' },

      handler: function (response) {
        // response.razorpay_payment_id is available here.
        // In production, send this to your backend for signature
        // verification before treating the order as confirmed.
        showPayToast(`Payment ID ${response.razorpay_payment_id} · ${rupee(amountRupees)} from ${name}.`);
        cart = {};
        saveCart();
        renderCart();
        checkoutForm.reset();
        checkoutOverlay.classList.remove('open');
      },

      modal: {
        ondismiss: function () {
          payNowBtn.disabled = false;
          payNowBtn.textContent = 'Pay with Razorpay';
        }
      }
    };

    const rzp = new Razorpay(options);

    rzp.on('payment.failed', function (response) {
      payNowBtn.disabled = false;
      payNowBtn.textContent = 'Pay with Razorpay';
      showPayToast(`Payment failed: ${response.error.description}`);
    });

    rzp.open();
    payNowBtn.disabled = false;
    payNowBtn.textContent = 'Pay with Razorpay';
  });

});
