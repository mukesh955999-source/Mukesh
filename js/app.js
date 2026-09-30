/**
 * J.M.S.D. Enterprises - Production Interactive Logic
 * High-performance, zero-dependency client engine
 */

(function () {
  'use strict';

  // State
  const state = {
    activePage: 'home',
    welcomeSeen: false,
    modalOpen: false
  };

  // Nav items definition
  const NAV_ITEMS = [
    { key: 'home', path: '/', label: 'Home' },
    { key: 'services', path: '/services', label: 'Services' },
    { key: 'projects', path: '/projects', label: 'Journal' },
    { key: 'gallery', path: '/gallery', label: 'Gallery' },
    { key: 'about', path: '/about', label: 'About' },
    { key: 'contact', path: '/contact', label: 'Contact' }
  ];

  /* ==========================================================================
     Welcome Screen & Liquid Canvas Animation
     ========================================================================== */
  function initWelcome() {
    const welcomeStage = document.getElementById('welcome-stage');
    if (!welcomeStage) return;

    try {
      if (sessionStorage.getItem('jmsd-welcome-seen') === '1') {
        welcomeStage.classList.add('is-hidden');
        welcomeStage.style.display = 'none';
        return;
      }
    } catch (e) {
      // Storage access blocked or restricted
    }

    // Start liquid canvas
    initLiquidCanvas();

    // Trigger blur words animation
    const words = welcomeStage.querySelectorAll('.blur-word');
    words.forEach((word, idx) => {
      setTimeout(() => {
        word.classList.add('is-visible');
      }, 150 + idx * 120);
    });

    let squeezeTimer = null;
    let finishTimer = null;

    function dismissWelcome() {
      if (squeezeTimer) clearTimeout(squeezeTimer);
      if (finishTimer) clearTimeout(finishTimer);

      welcomeStage.classList.add('squeeze');
      setTimeout(() => {
        welcomeStage.classList.add('is-hidden');
        try {
          sessionStorage.setItem('jmsd-welcome-seen', '1');
        } catch (e) {}
        setTimeout(() => {
          welcomeStage.style.display = 'none';
        }, 500);
      }, 400);
    }

    squeezeTimer = setTimeout(() => {
      welcomeStage.classList.add('squeeze');
    }, 3200);

    finishTimer = setTimeout(() => {
      welcomeStage.classList.add('is-hidden');
      try {
        sessionStorage.setItem('jmsd-welcome-seen', '1');
      } catch (e) {}
      setTimeout(() => {
        welcomeStage.style.display = 'none';
      }, 500);
    }, 4150);

    // Skip button & click anywhere to enter immediately
    const skipBtn = document.getElementById('welcome-skip-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dismissWelcome();
      });
    }

    welcomeStage.addEventListener('click', () => {
      dismissWelcome();
    });
  }

  /* Liquid Ferrofluid Canvas Simulation */
  function initLiquidCanvas() {
    const canvas = document.getElementById('welcome-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width, height;
    let animationFrameId;
    let mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false };

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });

    window.addEventListener('pointermove', (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    }, { passive: true });

    // Metaball / fluid particle field
    const particles = [];
    const count = 35;
    const colors = ['#ffffff', '#afc6d2', '#4f7488', '#2b4453'];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * (width || window.innerWidth),
        y: Math.random() * (height || window.innerHeight),
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        radius: Math.random() * 120 + 80,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.45 + 0.15
      });
    }

    let time = 0;
    function render() {
      time += 0.015;
      ctx.fillStyle = '#030303';
      ctx.fillRect(0, 0, width, height);

      // Smooth mouse interpolation
      if (mouse.active) {
        mouse.x += (mouse.targetX - mouse.x) * 0.1;
        mouse.y += (mouse.targetY - mouse.y) * 0.1;
      }

      // Draw fluid particles with additive glow
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      particles.forEach((p, idx) => {
        p.x += p.vx + Math.sin(time + idx) * 0.6;
        p.y += p.vy + Math.cos(time + idx * 0.7) * 0.6;

        if (p.x < -p.radius) p.x = width + p.radius;
        if (p.x > width + p.radius) p.x = -p.radius;
        if (p.y < -p.radius) p.y = height + p.radius;
        if (p.y > height + p.radius) p.y = -p.radius;

        // Attract gently to mouse if near
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 320 && dist > 1) {
            p.x += (dx / dist) * 1.8;
            p.y += (dy / dist) * 1.8;
          }
        }

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'rgba(3, 3, 3, 0)');

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();

      const welcomeStage = document.getElementById('welcome-stage');
      if (welcomeStage && !welcomeStage.classList.contains('is-hidden')) {
        animationFrameId = requestAnimationFrame(render);
      }
    }

    render();
  }

  /* ==========================================================================
     Fluid Dock Navigation
     ========================================================================== */
  function initDock() {
    const dock = document.getElementById('fluid-dock');
    const slider = document.getElementById('dock-slider');
    if (!dock || !slider) return;

    const links = dock.querySelectorAll('a[data-page]');

    function updateSlider(activeKey) {
      const activeLink = dock.querySelector(`a[data-page="${activeKey}"]`);
      if (activeLink) {
        slider.style.transform = `translateX(${activeLink.offsetLeft - slider.offsetLeft}px)`;
        links.forEach(link => {
          if (link === activeLink) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
          } else {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
          }
        });
      }
    }

    // Recalculate slider position on resize / orientation change
    window.addEventListener('resize', () => {
      updateSlider(state.activePage);
    }, { passive: true });

    // Determine current page from URL or attribute
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    let matchedKey = 'home';
    if (currentPath.includes('/services')) matchedKey = 'services';
    else if (currentPath.includes('/projects')) matchedKey = 'projects';
    else if (currentPath.includes('/gallery')) matchedKey = 'gallery';
    else if (currentPath.includes('/about')) matchedKey = 'about';
    else if (currentPath.includes('/contact')) matchedKey = 'contact';

    updateSlider(matchedKey);
    state.activePage = matchedKey;

    // Handle click on dock items
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        const pageKey = link.getAttribute('data-page');
        if (!pageKey) return;

        // If the subpage views are embedded in the page, switch smoothly
        const pageViews = document.querySelectorAll('[data-view]');
        if (pageViews.length > 1) {
          e.preventDefault();
          switchPageView(pageKey);
          updateSlider(pageKey);
          const targetUrl = link.getAttribute('href');
          if (targetUrl) {
            history.pushState({ page: pageKey }, '', targetUrl);
          }
        }
      });
    });

    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.page) {
        switchPageView(e.state.page);
        updateSlider(e.state.page);
      }
    });
  }

  function switchPageView(pageKey) {
    state.activePage = pageKey;
    const views = document.querySelectorAll('[data-view]');
    views.forEach(view => {
      if (view.getAttribute('data-view') === pageKey) {
        view.style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Trigger blur text in newly shown view
        const words = view.querySelectorAll('.blur-word');
        words.forEach((w, idx) => {
          w.classList.remove('is-visible');
          setTimeout(() => w.classList.add('is-visible'), 50 + idx * 60);
        });
      } else {
        view.style.display = 'none';
      }
    });
  }

  /* ==========================================================================
     Appointment Modal & WhatsApp Integration
     ========================================================================== */
  function initAppointmentModal() {
    const backdrop = document.getElementById('appointment-modal');
    const triggers = document.querySelectorAll('.appointment-trigger');
    const closeBtn = document.getElementById('modal-close-btn');
    const form = document.getElementById('appointment-form');

    if (!backdrop) return;

    function openModal() {
      backdrop.classList.add('is-open');
      backdrop.setAttribute('aria-hidden', 'false');
      state.modalOpen = true;
      document.body.style.overflow = 'hidden';
      const firstInput = backdrop.querySelector('input');
      if (firstInput) setTimeout(() => firstInput.focus(), 100);
    }

    function closeModal() {
      backdrop.classList.remove('is-open');
      backdrop.setAttribute('aria-hidden', 'true');
      state.modalOpen = false;
      document.body.style.overflow = '';
    }

    triggers.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal();
      });
    }

    backdrop.addEventListener('mousedown', (e) => {
      if (e.target === backdrop) {
        closeModal();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && state.modalOpen) {
        closeModal();
      }
    });

    // Form Submission -> WhatsApp Link
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(form);

        const name = (formData.get('name') || '').trim();
        const contact = (formData.get('contact') || '').trim();
        const address = (formData.get('address') || '').trim();
        const preference = (formData.get('preference') || '').trim();
        const project = (formData.get('project') || '').trim();
        const details = (formData.get('details') || '').trim();

        if (!name || !contact || !address || !preference || !project || !details) {
          alert('Please fill in all required fields.');
          return;
        }

        const lines = [
          'Appointment enquiry — J.M.S.D. Enterprises',
          `Name: ${name}`,
          `Contact: ${contact}`,
          `Address: ${address}`,
          `Preferred date/time: ${preference}`,
          `Project type: ${project}`,
          `Requirements: ${details}`
        ];

        const message = lines.join('\n');
        const whatsappUrl = `https://wa.me/919559997243?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        closeModal();
        form.reset();
      });
    }
  }

  /* ==========================================================================
     Video Player
     ========================================================================== */
  function initVideo() {
    const playBtn = document.getElementById('film-play-btn');
    const shell = document.getElementById('film-shell');

    if (!playBtn || !shell) return;

    playBtn.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/nVo0GuNm3Ek?autoplay=1&rel=0&modestbranding=1';
      iframe.title = 'How a central HVAC system works';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allowFullscreen = true;

      // Replace poster and button
      shell.innerHTML = '';
      shell.appendChild(iframe);
    });
  }

  /* ==========================================================================
     Scroll Animations & Blur-Text Reveal
     ========================================================================== */
  function initScrollAnimations() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const words = entry.target.querySelectorAll('.blur-word');
          words.forEach((word, idx) => {
            setTimeout(() => {
              word.classList.add('is-visible');
            }, idx * 45);
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.section-title, .hero-title, .film-title, .detail-title').forEach(el => {
      observer.observe(el);
    });
  }

  /* 3D tilt micro-interaction on cards (desktop pointer devices only) */
  function initCardTilt() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const cards = document.querySelectorAll('.shadow-card, .process-card, .detail-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const rotateX = -(y / (rect.height / 2)) * 6;
        const rotateY = (x / (rect.width / 2)) * 6;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ==========================================================================
     Gallery Filtering & Lightbox Modal
     ========================================================================== */
  function initGallery() {
    // Filter buttons logic
    const filterButtons = document.querySelectorAll('.gallery-filters .filter-btn');
    const galleryCards = document.querySelectorAll('.gallery-card');

    if (filterButtons.length && galleryCards.length) {
      filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const filter = btn.getAttribute('data-filter') || 'all';

          // Sync active filter button state across all instances
          filterButtons.forEach(b => {
            if (b.getAttribute('data-filter') === filter) {
              b.classList.add('active');
              b.setAttribute('aria-selected', 'true');
            } else {
              b.classList.remove('active');
              b.setAttribute('aria-selected', 'false');
            }
          });

          // Show/hide matching cards with smooth fade
          galleryCards.forEach(card => {
            const category = card.getAttribute('data-category');
            if (filter === 'all' || category === filter) {
              card.style.display = 'flex';
              setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = '';
              }, 10);
            } else {
              card.style.display = 'none';
            }
          });
        });
      });
    }

    // Lightbox modal logic
    const lightbox = document.getElementById('gallery-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxCategory = document.getElementById('lightbox-category');
    const closeBtn = document.getElementById('lightbox-close-btn');

    if (!lightbox || !lightboxImg) return;

    function openLightbox(imgSrc, title, desc, category) {
      lightboxImg.src = imgSrc;
      lightboxImg.alt = title || 'HVAC work project';
      if (lightboxCaption) {
        lightboxCaption.innerHTML = `<strong>${title || ''}</strong>${desc ? ' — ' + desc : ''}`;
      }
      if (lightboxCategory) {
        lightboxCategory.textContent = category || '';
      }
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      setTimeout(() => {
        if (!lightbox.classList.contains('is-open')) {
          lightboxImg.src = '';
        }
      }, 300);
    }

    document.querySelectorAll('.gallery-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // Prevent lightbox if clicking a direct link inside card
        if (e.target.closest('a')) return;
        const img = card.querySelector('img');
        const title = card.querySelector('.gallery-card-title')?.textContent || '';
        const desc = card.querySelector('.gallery-card-desc')?.textContent || '';
        const badge = card.querySelector('.gallery-card-badge')?.textContent || '';
        if (img) {
          openLightbox(img.src, title, desc, badge);
        }
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeLightbox();
      });
    }

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox-backdrop')) {
        closeLightbox();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('is-open')) {
        closeLightbox();
      }
    });
  }

  /* DOM Ready */
  document.addEventListener('DOMContentLoaded', () => {
    initWelcome();
    initDock();
    initAppointmentModal();
    initVideo();
    initScrollAnimations();
    initCardTilt();
    initGallery();
  });
})();
