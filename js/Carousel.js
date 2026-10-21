(function () {
    const THEMES = {
        dark: {
            '--carousel-frame': 'rgba(38, 35, 46, 0.66)',
            '--carousel-frame-edge': 'rgba(255, 255, 255, 0.08)',
            '--carousel-frame-highlight': 'rgba(255, 255, 255, 0.07)',
            '--carousel-frame-shadow': '0 22px 44px -20px rgba(0, 0, 0, 0.8), 0 6px 16px -8px rgba(0, 0, 0, 0.5)',
            '--carousel-tile': 'linear-gradient(180deg, #3a3644 0%, #27242f 100%)',
            '--carousel-tile-edge': 'rgba(255, 255, 255, 0.07)',
            '--carousel-tile-highlight': 'rgba(255, 255, 255, 0.12)',
            '--carousel-tile-shadow': '0 4px 10px -4px rgba(0, 0, 0, 0.7)',
            '--carousel-ink': '#f4f4f5',
            '--carousel-muted': 'rgba(244, 244, 245, 0.6)',
            '--carousel-faint': 'rgba(255, 255, 255, 0.22)',
            '--carousel-soft': 'rgba(255, 255, 255, 0.42)',
            '--carousel-badge': 'rgba(255, 255, 255, 0.08)',
            '--carousel-hover': 'brightness(1.12)',
            '--carousel-press': 'brightness(0.8)'
        },
        light: {
            '--carousel-frame': 'rgba(240, 240, 243, 0.8)',
            '--carousel-frame-edge': 'rgba(24, 24, 27, 0.07)',
            '--carousel-frame-highlight': 'rgba(255, 255, 255, 0.95)',
            '--carousel-frame-shadow': '0 22px 44px -22px rgba(24, 24, 27, 0.3), 0 6px 16px -10px rgba(24, 24, 27, 0.16)',
            '--carousel-tile': 'linear-gradient(180deg, #ffffff 0%, #f6f6f8 100%)',
            '--carousel-tile-edge': 'rgba(24, 24, 27, 0.08)',
            '--carousel-tile-highlight': 'rgba(255, 255, 255, 1)',
            '--carousel-tile-shadow': '0 4px 10px -5px rgba(24, 24, 27, 0.25)',
            '--carousel-ink': '#27272a',
            '--carousel-muted': 'rgba(39, 39, 42, 0.6)',
            '--carousel-faint': 'rgba(24, 24, 27, 0.16)',
            '--carousel-soft': 'rgba(24, 24, 27, 0.34)',
            '--carousel-badge': 'rgba(24, 24, 27, 0.05)',
            '--carousel-hover': 'brightness(0.97)',
            '--carousel-press': 'brightness(0.92)'
        }
    };

    const EFFECTS = ['tilt', 'slide', 'scale', 'fade', 'cube'];
    const STIFFNESS = 150;
    const DAMPING = 24;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const wrap = (value, count) => ((value % count) + count) % count;
    const nearest = (offset, count) => wrap(offset + count / 2, count) - count / 2;
    const smootherstep = t => t * t * t * (t * (t * 6 - 15) + 10);

    const edgeMask = size => {
        const stops = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1].map(t => [smootherstep(t).toFixed(3), (t * size).toFixed(1)]);
        const left = stops.map(([alpha, x]) => `rgba(0, 0, 0, ${alpha}) ${x}px`);
        const right = [...stops].reverse().map(([alpha, x]) => `rgba(0, 0, 0, ${alpha}) calc(100% - ${x}px)`);
        return `linear-gradient(to right, ${[...left, ...right].join(', ')})`;
    };

    const band = (value, max) => {
        if (value < 0) return -0.3 * (1 - Math.exp(value / 0.55));
        if (value > max) return max + 0.3 * (1 - Math.exp((max - value) / 0.55));
        return value;
    };

    const pose = (index, position, s) => {
        const offset = s.loop ? nearest(index - position, s.count) : index - position;
        const distance = Math.abs(offset);
        const near = Math.min(distance, 1);
        const result = {
            transform: 'none',
            opacity: 1,
            visible: true,
            layer: 10 - Math.min(9, Math.round(distance * 2)),
            shade: 0,
            focus: 1
        };
        if (s.mode === 'fade') {
            const half = Math.min(1, near * 2);
            result.visible = distance < 1;
            result.opacity = 1 - near * near * (3 - 2 * near);
            result.transform = `scale(${1 - 0.04 * near})`;
            result.focus = 1 - half * half * (3 - 2 * half);
            return result;
        }
        if (s.mode === 'cube') {
            const half = s.cardWidth / 2;
            const turn = Math.sin(Math.PI * (position - Math.floor(position)));
            result.visible = distance < 1;
            result.transform = `scale(${1 - 0.12 * turn}) translateZ(${-half}px) rotateY(${clamp(offset, -1, 1) * 90}deg) translateZ(${half}px)`;
            result.shade = near * s.shade;
            return result;
        }
        let x = offset * s.span;
        result.visible = x > -(s.inset + s.cardWidth + 2) && x < s.width + s.bleed * 2 - s.inset + 2;
        result.focus = 1 - near * near * (3 - 2 * near);
        if (s.mode === 'tilt') {
            result.visible = result.visible && distance < 1;
            result.transform = `translate3d(${x}px, 0, 0) rotateY(${-clamp(offset, -1, 1) * 90}deg)`;
        } else if (s.mode === 'scale') {
            x -= Math.sign(offset) * near * s.cardWidth * 0.06;
            result.transform = `translate3d(${x}px, 0, 0) scale(${1 - 0.12 * near})`;
            result.opacity = 1 - 0.5 * near;
        } else {
            result.transform = `translate3d(${x}px, 0, 0)`;
        }
        return result;
    };

    class Carousel {
        constructor(target, options = {}) {
            this.container = typeof target === 'string' ? document.querySelector(target) : target;
            if (!this.container) throw new Error('Target container not found');

            this.options = Object.assign({
                items: [],
                baseWidth: 300,
                aspectRatio: 1.25,
                peek: 0,
                gap: 16,
                radius: 12,
                frame: true,
                effect: 'tilt',
                indicator: 'dots',
                arrows: false,
                autoplay: false,
                autoplayDelay: 3000,
                pauseOnHover: false,
                loop: false,
                draggable: true,
                round: false,
                initialIndex: 0,
                theme: 'dark',
                onChange: null,
                className: '',
                style: {}
            }, options);

            this.items = [...this.options.items];
            this.count = this.items.length;
            this.mode = EFFECTS.includes(this.options.effect) ? this.options.effect : 'tilt';
            this.stacked = this.mode === 'fade' || this.mode === 'cube';

            this.ratio = clamp(this.options.aspectRatio, 0.3, 4);
            const initialWidth = typeof this.options.baseWidth === 'number'
                ? this.options.baseWidth - (this.options.frame ? 20 : 0)
                : 300;
            this.width = initialWidth;
            this.active = clamp(Math.round(this.options.initialIndex), 0, Math.max(0, this.count - 1));

            this.state = {
                p: this.active,
                v: 0,
                target: this.active,
                shown: this.active,
                elapsed: 0,
                hovered: false,
                focused: false,
                visible: true,
                drag: null,
                wheeling: false,
                wheelTimer: 0,
                suppress: false,
                last: 0
            };

            this.slideRefs = [];
            this.shadeRefs = [];
            this.fillRefs = [];
            this.dotRefs = [];
            this.counterRef = null;

            this.alive = true;
            this.raf = 0;

            this.initDOM();
            this.recalculateSettings();
            this.initEvents();
            this.apply();
        }

        recalculateSettings() {
            const side = this.stacked || (this.options.round && this.options.frame) ? 0 : clamp(this.options.peek, 0, this.width * 0.2);
            const slot = Math.max(40, this.width - side * 2);
            const diameter = this.options.frame ? slot : Math.min(slot, slot / this.ratio);
            const cardWidth = this.options.round ? diameter : slot;
            const cardHeight = this.options.round ? diameter : slot / this.ratio;
            const clipped = !this.options.frame && !this.stacked;
            const bleed = clipped ? Math.round(Math.min(48, cardWidth * 0.12)) : 0;
            const inset = bleed + (this.width - cardWidth) / 2;

            this.settings = {
                count: this.count,
                mode: this.mode,
                width: this.width,
                bleed,
                inset,
                cardWidth,
                cardHeight,
                span: cardWidth + Math.max(0, this.options.gap),
                loop: this.options.loop && this.count > 1,
                autoplay: this.options.autoplay && this.count > 1,
                autoplayDelay: Math.max(600, this.options.autoplayDelay),
                pauseOnHover: this.options.pauseOnHover,
                draggable: this.options.draggable && this.count > 1,
                bars: this.options.indicator === 'bars',
                shade: this.options.theme === 'light' ? 0.3 : 0.6
            };

            if (this.viewportEl) {
                this.viewportEl.style.height = `${cardHeight}px`;
                this.viewportEl.style.marginInline = bleed ? `${-bleed}px` : '';
                this.viewportEl.style.perspective = this.mode === 'cube' ? `${Math.round(cardWidth * 2.6)}px` : this.mode === 'tilt' ? '1000px' : '';
                this.viewportEl.style.overflowX = clipped ? 'clip' : 'visible';
                const mask = clipped ? edgeMask(inset) : '';
                this.viewportEl.style.maskImage = mask;
                this.viewportEl.style.webkitMaskImage = mask;
            }

            if (this.controlsEl && this.cardWidth) {
                this.controlsEl.style.width = `${cardWidth}px`;
            }

            this.slideRefs.forEach(slide => {
                if (slide) {
                    slide.style.left = `${inset}px`;
                    slide.style.width = `${cardWidth}px`;
                    slide.style.height = `${cardHeight}px`;
                }
            });
        }

        initDOM() {
            this.container.innerHTML = '';

            this.rootEl = document.createElement('div');
            this.rootEl.className = `carousel-container${this.options.frame ? ' has-frame' : ''}${this.options.round ? ' is-round' : ''}${this.options.className ? ` ${this.options.className}` : ''}`;
            this.rootEl.setAttribute('role', 'region');
            this.rootEl.setAttribute('aria-roledescription', 'carousel');
            this.rootEl.setAttribute('aria-label', 'Carousel');
            this.rootEl.tabIndex = 0;

            const themeStyles = THEMES[this.options.theme] || THEMES.dark;
            Object.entries(themeStyles).forEach(([key, val]) => {
                this.rootEl.style.setProperty(key, val);
            });
            this.rootEl.style.setProperty('--carousel-radius', `${this.options.round ? 9999 : Math.max(0, this.options.radius)}px`);
            if (this.options.baseWidth) {
                this.rootEl.style.width = typeof this.options.baseWidth === 'number' ? '100%' : this.options.baseWidth;
                this.rootEl.style.maxWidth = typeof this.options.baseWidth === 'number' ? `${this.options.baseWidth}px` : undefined;
            }
            if (this.options.style) {
                Object.assign(this.rootEl.style, this.options.style);
            }

            this.stageEl = document.createElement('div');
            this.stageEl.className = 'carousel-stage';

            this.viewportEl = document.createElement('div');
            this.viewportEl.className = 'carousel-viewport';
            if (this.options.draggable && this.count > 1) {
                this.viewportEl.dataset.draggable = 'true';
            }
            this.viewportEl.setAttribute('aria-live', this.options.autoplay ? 'off' : 'polite');

            this.slideRefs = [];
            this.shadeRefs = [];
            this.items.forEach((item, index) => {
                const slide = document.createElement('div');
                slide.className = 'carousel-slide';
                slide.setAttribute('role', 'group');
                slide.setAttribute('aria-roledescription', 'slide');
                slide.setAttribute('aria-label', `${index + 1} of ${this.count}`);
                if (index === this.active) slide.dataset.current = 'true';

                slide.addEventListener('click', () => {
                    if (index !== this.active) this.goTo(index);
                });

                const cardEl = this.buildCardElement(item);
                slide.appendChild(cardEl);

                if (this.mode === 'cube') {
                    const shade = document.createElement('span');
                    shade.className = 'carousel-shade';
                    slide.appendChild(shade);
                    this.shadeRefs[index] = shade;
                }

                this.viewportEl.appendChild(slide);
                this.slideRefs[index] = slide;
            });

            this.stageEl.appendChild(this.viewportEl);

            const controls = this.count > 1 && (this.options.indicator !== 'none' || this.options.arrows);
            const inside = this.options.frame && !this.options.round;

            if (controls) {
                this.controlsEl = this.buildControls();
                if (inside) {
                    this.stageEl.appendChild(this.controlsEl);
                }
            }

            if (this.options.frame) {
                const frameRim = document.createElement('span');
                frameRim.className = 'carousel-frame-rim';
                this.stageEl.appendChild(frameRim);
            }

            this.rootEl.appendChild(this.stageEl);

            if (controls && !inside && this.controlsEl) {
                this.rootEl.appendChild(this.controlsEl);
            }

            this.container.appendChild(this.rootEl);
        }

        buildCardElement(item) {
            if (item instanceof HTMLElement) {
                const card = document.createElement('div');
                card.className = `carousel-card is-custom${this.options.round ? ' is-round' : ''}`;
                card.appendChild(item);
                const rim = document.createElement('span');
                rim.className = 'carousel-card-rim';
                card.appendChild(rim);
                return card;
            }

            if (typeof item === 'object' && item.element instanceof HTMLElement) {
                const card = document.createElement('div');
                card.className = `carousel-card is-custom${this.options.round ? ' is-round' : ''}`;
                card.appendChild(item.element);
                const rim = document.createElement('span');
                rim.className = 'carousel-card-rim';
                card.appendChild(rim);
                return card;
            }

            if (typeof item === 'object' && item.html) {
                const card = document.createElement('div');
                card.className = `carousel-card is-custom${this.options.round ? ' is-round' : ''}`;
                card.innerHTML = item.html;
                const rim = document.createElement('span');
                rim.className = 'carousel-card-rim';
                card.appendChild(rim);
                return card;
            }

            const data = typeof item === 'string' ? { image: item } : (item || {});
            const hasImage = Boolean(data.image);
            const hasText = Boolean(data.title || data.description);

            const card = document.createElement('div');
            card.className = `carousel-card${hasImage ? ' has-image' : ''}${this.options.round ? ' is-round' : ''}`;

            if (data.image) {
                const img = document.createElement('img');
                img.className = 'carousel-image';
                img.src = data.image;
                img.alt = data.alt || '';
                img.draggable = false;
                img.decoding = 'async';
                card.appendChild(img);
            }

            if (hasImage && hasText) {
                const scrim = document.createElement('span');
                scrim.className = 'carousel-scrim';
                card.appendChild(scrim);
            }

            if (data.icon) {
                const icon = document.createElement('span');
                icon.className = 'carousel-icon';
                if (data.icon instanceof HTMLElement) {
                    icon.appendChild(data.icon);
                } else {
                    icon.innerHTML = data.icon;
                }
                card.appendChild(icon);
            }

            if (hasText) {
                const textWrap = document.createElement('div');
                textWrap.className = 'carousel-text';
                if (data.title) {
                    const title = document.createElement('div');
                    title.className = 'carousel-title';
                    title.textContent = data.title;
                    textWrap.appendChild(title);
                }
                if (data.description && (!this.options.round || this.width >= 240)) {
                    const desc = document.createElement('p');
                    desc.className = 'carousel-description';
                    desc.textContent = data.description;
                    textWrap.appendChild(desc);
                }
                card.appendChild(textWrap);
            }

            const rim = document.createElement('span');
            rim.className = 'carousel-card-rim';
            card.appendChild(rim);

            return card;
        }

        buildControls() {
            const controls = document.createElement('div');
            controls.className = 'carousel-controls';

            if (this.options.arrows) {
                const prevBtn = document.createElement('button');
                prevBtn.type = 'button';
                prevBtn.className = 'carousel-arrow';
                prevBtn.setAttribute('aria-label', 'Previous slide');
                prevBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>`;
                prevBtn.addEventListener('click', () => this.step(-1));
                controls.appendChild(prevBtn);
                this.prevArrow = prevBtn;
            }

            if (this.options.indicator === 'dots') {
                const dotsWrap = document.createElement('div');
                dotsWrap.className = 'carousel-dots';
                this.dotRefs = [];
                for (let i = 0; i < this.count; i++) {
                    const dot = document.createElement('button');
                    dot.type = 'button';
                    dot.className = `carousel-dot${i === this.active ? ' is-active' : ''}`;
                    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
                    if (i === this.active) dot.setAttribute('aria-current', 'true');
                    dot.innerHTML = `<span class="carousel-dot-mark"></span>`;
                    dot.addEventListener('click', () => this.goTo(i));
                    dotsWrap.appendChild(dot);
                    this.dotRefs[i] = dot;
                }
                controls.appendChild(dotsWrap);
            }

            if (this.options.indicator === 'bars') {
                const barsWrap = document.createElement('div');
                barsWrap.className = 'carousel-bars';
                this.fillRefs = [];
                for (let i = 0; i < this.count; i++) {
                    const bar = document.createElement('button');
                    bar.type = 'button';
                    bar.className = 'carousel-bar';
                    bar.setAttribute('aria-label', `Go to slide ${i + 1}`);
                    bar.innerHTML = `<span class="carousel-bar-track"><span class="carousel-bar-fill"></span></span>`;
                    const fill = bar.querySelector('.carousel-bar-fill');
                    this.fillRefs[i] = fill;
                    bar.addEventListener('click', () => this.goTo(i));
                    barsWrap.appendChild(bar);
                }
                controls.appendChild(barsWrap);
            }

            if (this.options.indicator === 'counter') {
                const counter = document.createElement('div');
                counter.className = 'carousel-counter';
                counter.innerHTML = `<span class="carousel-counter-current">${String(this.active + 1).padStart(2, '0')}</span><span>/</span><span>${String(this.count).padStart(2, '0')}</span>`;
                this.counterRef = counter.querySelector('.carousel-counter-current');
                controls.appendChild(counter);
            }

            if (this.options.arrows) {
                const nextBtn = document.createElement('button');
                nextBtn.type = 'button';
                nextBtn.className = 'carousel-arrow';
                nextBtn.setAttribute('aria-label', 'Next slide');
                nextBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`;
                nextBtn.addEventListener('click', () => this.step(1));
                controls.appendChild(nextBtn);
                this.nextArrow = nextBtn;
            }

            return controls;
        }

        initEvents() {
            this.boundOnPointerDown = this.onPointerDown.bind(this);
            this.boundOnPointerMove = this.onPointerMove.bind(this);
            this.boundOnPointerUp = this.onPointerUp.bind(this);
            this.boundOnClickCapture = this.onClickCapture.bind(this);
            this.boundOnWheel = this.onWheel.bind(this);
            this.boundOnKeyDown = this.onKeyDown.bind(this);
            this.boundTick = this.tick.bind(this);

            this.viewportEl.addEventListener('pointerdown', this.boundOnPointerDown);
            window.addEventListener('pointermove', this.boundOnPointerMove);
            window.addEventListener('pointerup', this.boundOnPointerUp);
            window.addEventListener('pointercancel', this.boundOnPointerUp);
            this.viewportEl.addEventListener('click', this.boundOnClickCapture, true);
            this.viewportEl.addEventListener('wheel', this.boundOnWheel, { passive: false });

            this.rootEl.addEventListener('keydown', this.boundOnKeyDown);
            this.rootEl.addEventListener('mouseenter', () => {
                this.state.hovered = true;
            });
            this.rootEl.addEventListener('mouseleave', () => {
                this.state.hovered = false;
                this.wake();
            });

            this.resizeObserver = new ResizeObserver(entries => {
                const box = entries[entries.length - 1]?.contentRect;
                if (box && box.width > 40) {
                    const newW = Math.round(box.width);
                    if (newW !== this.width) {
                        this.width = newW;
                        this.recalculateSettings();
                        this.apply();
                    }
                }
            });
            this.resizeObserver.observe(this.stageEl);

            this.visibilityObserver = new IntersectionObserver(entries => {
                this.state.visible = entries.some(entry => entry.isIntersecting);
                if (this.state.visible) this.wake();
            });
            this.visibilityObserver.observe(this.rootEl);
        }

        unit() {
            return this.settings.mode === 'fade' || this.settings.mode === 'cube'
                ? this.settings.cardWidth
                : this.settings.span;
        }

        limit(value) {
            return this.settings.loop ? value : clamp(value, 0, this.settings.count - 1);
        }

        apply() {
            const s = this.settings;
            for (let i = 0; i < s.count; i++) {
                const slide = this.slideRefs[i];
                if (!slide) continue;
                const next = pose(i, this.state.p, s);
                slide.style.transform = next.transform;
                slide.style.opacity = String(next.opacity);
                slide.style.visibility = next.visible ? 'visible' : 'hidden';
                slide.style.zIndex = String(next.layer);
                slide.style.setProperty('--carousel-focus', String(next.focus));
                const shade = this.shadeRefs[i];
                if (shade) shade.style.opacity = String(next.shade);
            }

            if (this.prevArrow) {
                this.prevArrow.disabled = !s.loop && this.active === 0;
            }
            if (this.nextArrow) {
                this.nextArrow.disabled = !s.loop && this.active === s.count - 1;
            }

            if (this.dotRefs.length) {
                this.dotRefs.forEach((dot, idx) => {
                    dot.classList.toggle('is-active', idx === this.active);
                    if (idx === this.active) {
                        dot.setAttribute('aria-current', 'true');
                    } else {
                        dot.removeAttribute('aria-current');
                    }
                });
            }

            if (this.counterRef) {
                this.counterRef.textContent = String(this.active + 1).padStart(2, '0');
            }

            if (s.bars) {
                const progress = s.autoplay ? clamp(this.state.elapsed / s.autoplayDelay, 0, 1) : 1;
                for (let i = 0; i < s.count; i++) {
                    const fill = this.fillRefs[i];
                    if (fill) {
                        fill.style.transform = `scaleX(${i < this.state.shown ? 1 : i === this.state.shown ? progress : 0})`;
                    }
                }
            }
        }

        announce() {
            const s = this.settings;
            if (!s.count) return;
            const index = s.loop ? wrap(Math.round(this.state.target), s.count) : clamp(Math.round(this.state.target), 0, s.count - 1);
            if (index === this.state.shown) return;
            this.state.shown = index;
            this.active = index;

            this.slideRefs.forEach((slide, idx) => {
                if (idx === index) {
                    slide.dataset.current = 'true';
                } else {
                    delete slide.dataset.current;
                }
            });

            if (typeof this.options.onChange === 'function') {
                this.options.onChange(index);
            }
        }

        paused() {
            const s = this.settings;
            return (s.pauseOnHover && this.state.hovered) ||
                this.state.focused ||
                Boolean(this.state.drag) ||
                this.state.wheeling ||
                !this.state.visible ||
                document.hidden;
        }

        tick(now) {
            this.raf = 0;
            if (!this.alive) return;
            const s = this.settings;
            const dt = this.state.last ? Math.min(0.05, (now - this.state.last) / 1000) : 1 / 60;
            this.state.last = now;
            let busy = false;

            if (!this.state.drag?.moved && !this.state.wheeling) {
                const steps = Math.ceil(dt * 240);
                const h = dt / steps;
                for (let k = 0; k < steps; k++) {
                    this.state.v += (STIFFNESS * (this.state.target - this.state.p) - DAMPING * this.state.v) * h;
                    this.state.p += this.state.v * h;
                }
                if (Math.abs(this.state.target - this.state.p) < 0.0004 && Math.abs(this.state.v) < 0.004) {
                    this.state.p = this.state.target;
                    this.state.v = 0;
                } else {
                    busy = true;
                }
                if (!busy && s.loop && s.count) {
                    this.state.target = wrap(Math.round(this.state.target), s.count);
                    this.state.p = this.state.target;
                }
            }

            if (s.autoplay && !this.paused()) {
                this.state.elapsed += dt * 1000;
                if (this.state.elapsed >= s.autoplayDelay) {
                    this.step(1, true);
                }
                busy = true;
            }

            this.apply();

            if (busy) {
                this.raf = requestAnimationFrame(this.boundTick);
            } else {
                this.state.last = 0;
            }
        }

        wake() {
            if (!this.raf && this.alive) {
                this.raf = requestAnimationFrame(this.boundTick);
            }
        }

        moveTo(target) {
            this.state.target = target;
            this.state.elapsed = 0;
            this.announce();
            this.apply();
            this.wake();
        }

        step(direction, auto = false) {
            const s = this.settings;
            if (s.count < 2) return;
            let next = Math.round(this.state.target) + direction;
            if (!s.loop) {
                if (auto && next > s.count - 1) next = 0;
                next = clamp(next, 0, s.count - 1);
            }
            this.moveTo(next);
        }

        goTo(index) {
            const s = this.settings;
            if (!s.count) return;
            const goal = clamp(Math.round(index), 0, s.count - 1);
            const current = Math.round(this.state.target);
            this.moveTo(s.loop ? current + nearest(goal - wrap(current, s.count), s.count) : goal);
        }

        onPointerDown(event) {
            const s = this.settings;
            if (!s.draggable || (event.pointerType === 'mouse' && event.button !== 0)) return;
            this.state.drag = {
                id: event.pointerId,
                x: event.clientX,
                y: event.clientY,
                p: this.state.p,
                from: 0,
                moved: false,
                samples: []
            };
        }

        onPointerMove(event) {
            const drag = this.state.drag;
            if (!drag || event.pointerId !== drag.id) return;
            const s = this.settings;

            if (!drag.moved) {
                const dx = event.clientX - drag.x;
                const dy = event.clientY - drag.y;
                if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
                if (Math.abs(dy) > Math.abs(dx)) {
                    this.state.drag = null;
                    return;
                }
                drag.moved = true;
                drag.x = event.clientX;
                drag.p = this.state.p;
                drag.from = Math.round(this.state.target);
                this.viewportEl.setPointerCapture?.(event.pointerId);
                this.viewportEl.dataset.dragging = 'true';
            }

            const raw = drag.p - (event.clientX - drag.x) / this.unit();
            this.state.p = s.loop ? raw : band(raw, s.count - 1);
            this.state.v = 0;
            this.state.target = Math.round(this.limit(this.state.p));
            drag.samples.push([event.timeStamp, event.clientX]);
            if (drag.samples.length > 8) drag.samples.shift();
            this.announce();
            this.apply();
        }

        onPointerUp(event) {
            const drag = this.state.drag;
            if (!drag || event.pointerId !== drag.id) return;
            this.state.drag = null;
            delete this.viewportEl.dataset.dragging;

            if (!drag.moved) {
                this.wake();
                return;
            }

            this.state.suppress = true;
            window.setTimeout(() => {
                this.state.suppress = false;
            }, 0);

            const s = this.settings;
            const sample = drag.samples.find(([time]) => event.timeStamp - time < 90) ?? [event.timeStamp, event.clientX];
            const elapsed = Math.max(16, event.timeStamp - sample[0]);
            const velocity = clamp(((sample[1] - event.clientX) / elapsed) * (1000 / this.unit()), -12, 12);
            const travelled = this.state.p - drag.from;
            let target = Math.round(this.state.p + velocity * 0.2);
            if (target === drag.from) {
                if (Math.abs(velocity) > 0.8) target += Math.sign(velocity);
                else if (Math.abs(travelled) > 0.18) target += Math.sign(travelled);
            }
            if (!s.loop) target = clamp(target, 0, s.count - 1);
            const inside = s.loop || (this.state.p >= 0 && this.state.p <= s.count - 1);
            this.state.v = inside ? velocity : 0;
            this.moveTo(target);
        }

        onClickCapture(event) {
            if (!this.state.suppress) return;
            event.preventDefault();
            event.stopPropagation();
            this.state.suppress = false;
        }

        onWheel(event) {
            const s = this.settings;
            if (!s.draggable || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
            event.preventDefault();
            const raw = this.state.p + event.deltaX / this.unit();
            this.state.p = s.loop ? raw : clamp(raw, -0.15, s.count - 0.85);
            this.state.v = 0;
            this.state.wheeling = true;
            this.state.target = Math.round(this.limit(this.state.p));
            this.announce();
            this.apply();
            window.clearTimeout(this.state.wheelTimer);
            this.state.wheelTimer = window.setTimeout(() => {
                this.state.wheeling = false;
                this.moveTo(Math.round(this.limit(this.state.p)));
            }, 120);
        }

        onKeyDown(event) {
            if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"]')) {
                return;
            }
            const keys = {
                ArrowRight: () => this.step(1),
                ArrowLeft: () => this.step(-1),
                Home: () => this.goTo(0),
                End: () => this.goTo(this.count - 1)
            };
            if (keys[event.key]) {
                event.preventDefault();
                keys[event.key]();
            }
        }

        setItems(newItems) {
            this.items = [...newItems];
            this.count = this.items.length;
            this.active = clamp(this.active, 0, Math.max(0, this.count - 1));
            this.state.p = this.active;
            this.state.target = this.active;
            this.state.shown = this.active;
            this.initDOM();
            this.recalculateSettings();
            this.initEvents();
            this.apply();
            this.wake();
        }

        getActiveIndex() {
            return this.active;
        }

        refresh() {
            if (this.stageEl) {
                const rect = this.stageEl.getBoundingClientRect();
                if (rect.width > 40) {
                    this.width = Math.round(rect.width);
                }
            }
            this.recalculateSettings();
            this.apply();
            this.wake();
        }

        destroy() {
            this.alive = false;
            cancelAnimationFrame(this.raf);
            window.clearTimeout(this.state.wheelTimer);
            if (this.resizeObserver) this.resizeObserver.disconnect();
            if (this.visibilityObserver) this.visibilityObserver.disconnect();
            window.removeEventListener('pointermove', this.boundOnPointerMove);
            window.removeEventListener('pointerup', this.boundOnPointerUp);
            window.removeEventListener('pointercancel', this.boundOnPointerUp);
            if (this.rootEl && this.rootEl.parentNode) {
                this.rootEl.parentNode.removeChild(this.rootEl);
            }
        }
    }

    window.Carousel = Carousel;
})();
