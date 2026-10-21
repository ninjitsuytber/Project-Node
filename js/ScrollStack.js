(function () {
    const resolveOffset = (value, size) => {
        if (typeof value === 'number') return value;
        const text = String(value).trim();
        if (text.endsWith('%')) return (parseFloat(text) / 100) * size;
        return parseFloat(text) || 0;
    };

    const toLength = value => (typeof value === 'number' ? `${value}px` : value);

    const scrollsInside = (node, stop, delta) => {
        for (let element = node; element && element !== stop; element = element.parentElement) {
            if (element.scrollHeight <= element.clientHeight + 1) continue;
            const overflow = getComputedStyle(element).overflowY;
            if (overflow !== 'auto' && overflow !== 'scroll') continue;
            if (delta > 0 ? element.scrollTop + element.clientHeight < element.scrollHeight - 1 : element.scrollTop > 0) {
                return true;
            }
        }
        return false;
    };

    class ScrollStack {
        constructor(container, options = {}) {
            this.container = typeof container === 'string' ? document.querySelector(container) : container;
            if (!this.container) return;

            this.options = Object.assign({
                items: [],
                className: '',
                itemClassName: '',
                itemDistance: 100,
                itemStackDistance: 24,
                stackPosition: '15%',
                itemScale: 0.05,
                baseScale: 0.8,
                dimAmount: 0.2,
                blurAmount: 0,
                tiltAmount: 0,
                rotationAmount: 0,
                holdDistance: 200,
                smoothScroll: true,
                snap: false,
                useWindowScroll: false,
                onStackComplete: null
            }, options);

            this.root = null;
            this.inner = null;
            this.end = null;
            this.cache = new Map();
            this.frame = 0;
            this.glide = 0;
            this.rest = 0;
            this.complete = false;
            this.gliding = false;
            this.pressed = false;
            this.current = 0;
            this.goal = 0;
            this.written = 0;
            this.last = 0;
            this.points = [];
            this.reach = 0;

            this.onScroll = this.onScroll.bind(this);
            this.onWheel = this.onWheel.bind(this);
            this.onPress = this.onPress.bind(this);
            this.onRelease = this.onRelease.bind(this);
            this.step = this.step.bind(this);
            this.schedule = this.schedule.bind(this);
            this.update = this.update.bind(this);

            this.motion = window.matchMedia('(prefers-reduced-motion: reduce)');
            this.renderDOM();
            this.attachEvents();
        }

        renderDOM() {
            this.container.innerHTML = '';
            const windowed = this.options.useWindowScroll;

            const root = document.createElement('div');
            root.className = `scroll-stack ${windowed ? 'scroll-stack--window' : 'scroll-stack--contained'} ${this.options.className}`.trim();

            const inner = document.createElement('div');
            inner.className = 'scroll-stack__inner';

            const items = this.options.items || [];
            const count = items.length;

            items.forEach((item, index) => {
                const gap = this.options.itemDistance - (count - index) * this.options.itemStackDistance;
                if (index > 0) {
                    const spacer = document.createElement('div');
                    spacer.setAttribute('aria-hidden', 'true');
                    spacer.style.height = `${Math.max(0, gap)}px`;
                    spacer.style.marginTop = `${Math.min(0, gap)}px`;
                    inner.appendChild(spacer);
                }

                const slot = document.createElement('div');
                slot.setAttribute('data-stack-slot', '');
                slot.className = 'scroll-stack__slot';
                slot.style.top = `calc(${toLength(this.options.stackPosition)} + ${index * this.options.itemStackDistance}px)`;
                slot.style.marginBottom = `${(count - 1 - index) * this.options.itemStackDistance}px`;
                slot.style.zIndex = `${index + 1}`;

                const card = document.createElement('div');
                card.className = `scroll-stack-card ${this.options.itemClassName}`.trim();

                if (typeof item === 'string') {
                    card.innerHTML = item;
                } else if (item instanceof HTMLElement) {
                    card.appendChild(item);
                }

                const shade = document.createElement('span');
                shade.className = 'scroll-stack-card__shade';
                shade.setAttribute('aria-hidden', 'true');
                card.appendChild(shade);

                slot.appendChild(card);
                inner.appendChild(slot);
            });

            const end = document.createElement('div');
            end.className = 'scroll-stack__end';
            end.setAttribute('aria-hidden', 'true');
            inner.appendChild(end);

            root.appendChild(inner);
            this.container.appendChild(root);

            this.root = root;
            this.inner = inner;
            this.end = end;
        }

        readScroll() {
            return this.options.useWindowScroll ? window.scrollY : this.root.scrollTop;
        }

        maxScroll() {
            if (this.options.useWindowScroll) {
                return document.documentElement.scrollHeight - window.innerHeight;
            }
            return this.root.scrollHeight - this.root.clientHeight;
        }

        writeScroll(value) {
            this.written = value;
            const target = this.options.useWindowScroll ? window : this.root;
            target.scrollTo({ top: value, behavior: 'instant' });
        }

        write(key, value, apply) {
            if (this.cache.get(key) === value) return false;
            this.cache.set(key, value);
            apply(value);
            return true;
        }

        schedule() {
            if (!this.frame) {
                this.frame = requestAnimationFrame(this.update);
            }
        }

        update() {
            this.frame = 0;
            const settings = this.options;
            const root = this.root;
            const inner = this.inner;
            const end = this.end;
            if (!root || !inner || !end) return;

            const slots = Array.from(inner.children).filter(child => child.hasAttribute('data-stack-slot'));
            if (!slots.length) return;

            const windowed = settings.useWindowScroll;
            const viewHeight = windowed ? window.innerHeight : root.clientHeight;
            if (!windowed && viewHeight < 40) return;
            const viewTop = windowed ? 0 : root.getBoundingClientRect().top + root.clientTop;
            const stackTop = resolveOffset(settings.stackPosition, viewHeight);
            const offset = settings.itemStackDistance;
            const heights = slots.map(slot => slot.offsetHeight);
            const tops = slots.map(slot => slot.getBoundingClientRect().top);
            const lastPin = stackTop + (slots.length - 1) * offset;
            const padTop = windowed ? 0 : stackTop;
            const endHeight =
                settings.holdDistance + (windowed ? 0 : Math.max(0, viewHeight - lastPin - heights[heights.length - 1]));

            let moved = this.write('padTop', padTop, value => {
                inner.style.paddingTop = `${value}px`;
            });
            moved =
                this.write('endHeight', endHeight, value => {
                    end.style.height = `${value}px`;
                }) || moved;

            let flow = inner.getBoundingClientRect().top - viewTop + this.readScroll() + padTop;
            this.points = heights.map((height, i) => {
                const point = flow - stackTop - i * offset;
                flow += height + settings.itemDistance;
                return point;
            });
            this.reach = Math.max(40, (heights[0] + settings.itemDistance - offset) / 2);

            const depths = slots.map(() => 0);
            let lastCover = 0;
            for (let j = 1; j < slots.length; j++) {
                const pinBefore = viewTop + stackTop + (j - 1) * offset;
                const start = pinBefore + heights[j - 1];
                const span = Math.max(1, start - pinBefore - offset);
                const cover = Math.min(1, Math.max(0, (start - tops[j]) / span));
                for (let i = 0; i < j; i++) depths[i] += cover;
                lastCover = cover;
            }

            const dimStep = Math.min(Math.max(settings.dimAmount, 0), 1);
            slots.forEach((slot, i) => {
                const card = slot.firstElementChild;
                if (!card) return;
                const depth = depths[i];
                const lean = Math.min(depth, 1);
                const scale = Math.max(Math.min(settings.baseScale, 1), 1 - depth * settings.itemScale);
                const tilt = -lean * settings.tiltAmount;
                const turn = lean * settings.rotationAmount * (i % 2 ? -1 : 1);
                const blur = depth * settings.blurAmount;
                const dim = 1 - Math.pow(1 - dimStep, depth);
                const transform =
                    depth < 0.0005
                        ? ''
                        : `perspective(1200px) rotateX(${tilt.toFixed(2)}deg) rotate(${turn.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
                this.write(`transform${i}`, transform, value => {
                    card.style.transform = value;
                });
                this.write(`filter${i}`, blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : '', value => {
                    card.style.filter = value;
                });
                this.write(`dim${i}`, dim.toFixed(3), value => {
                    card.style.setProperty('--scroll-stack-dim', value);
                });
            });

            const done = slots.length > 1 && lastCover >= 0.999;
            if (done !== this.complete) {
                this.complete = done;
                if (done && typeof settings.onStackComplete === 'function') {
                    settings.onStackComplete();
                }
            }

            if (moved) this.schedule();
        }

        step(now) {
            const dt = Math.min(0.05, (now - this.last) / 1000);
            this.last = now;
            if (Math.abs(this.readScroll() - this.written) > 2) {
                this.gliding = false;
                this.glide = 0;
                this.settleSoon();
                return;
            }
            this.current += (this.goal - this.current) * (1 - Math.pow(0.9, dt * 60));
            if (Math.abs(this.goal - this.current) < 0.5) this.current = this.goal;
            this.writeScroll(this.current);
            if (this.current === this.goal) {
                this.gliding = false;
                this.glide = 0;
                this.settleSoon();
                return;
            }
            this.glide = requestAnimationFrame(this.step);
        }

        glideTo(value) {
            this.goal = Math.min(Math.max(value, 0), this.maxScroll());
            if (this.motion.matches) {
                this.writeScroll(this.goal);
                return;
            }
            if (this.gliding) return;
            this.gliding = true;
            this.current = this.readScroll();
            this.written = this.current;
            this.last = performance.now();
            this.glide = requestAnimationFrame(this.step);
        }

        settle() {
            this.rest = 0;
            if (!this.options.snap || this.gliding || this.pressed || !this.points.length) return;
            const now = this.readScroll();
            const nearest = this.points.reduce((best, point) => (Math.abs(point - now) < Math.abs(best - now) ? point : best));
            const gap = Math.abs(nearest - now);
            if (gap > 1 && gap < this.reach) this.glideTo(nearest);
        }

        settleSoon() {
            window.clearTimeout(this.rest);
            this.rest = window.setTimeout(() => this.settle(), 140);
        }

        onScroll() {
            this.schedule();
            if (!this.gliding) this.settleSoon();
        }

        onWheel(event) {
            if (!this.options.smoothScroll || this.motion.matches || event.defaultPrevented || event.ctrlKey) return;
            if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
            const windowed = this.options.useWindowScroll;
            const page = windowed ? window.innerHeight : this.root.clientHeight;
            const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? page : 1);
            if (!delta || scrollsInside(event.target, windowed ? document.body : this.root, delta)) return;
            const base = this.gliding ? this.goal : this.readScroll();
            if ((delta < 0 && base <= 0) || (delta > 0 && base >= this.maxScroll() - 0.5)) return;
            event.preventDefault();
            window.clearTimeout(this.rest);
            this.glideTo(base + delta);
        }

        onPress() {
            this.pressed = true;
            window.clearTimeout(this.rest);
        }

        onRelease() {
            if (!this.pressed) return;
            this.pressed = false;
            this.settleSoon();
        }

        attachEvents() {
            const target = this.options.useWindowScroll ? window : this.root;
            this.observer = new ResizeObserver(() => this.schedule());
            if (this.root) this.observer.observe(this.root);
            if (this.inner) this.observer.observe(this.inner);

            target.addEventListener('scroll', this.onScroll, { passive: true });
            target.addEventListener('wheel', this.onWheel, { passive: false });
            target.addEventListener('pointerdown', this.onPress, { passive: true });
            window.addEventListener('pointerup', this.onRelease, { passive: true });
            window.addEventListener('pointercancel', this.onRelease, { passive: true });
            window.addEventListener('resize', this.schedule);

            this.update();
        }

        setItems(items) {
            const prevScroll = this.readScroll();
            this.options.items = items;
            this.cache.clear();
            this.renderDOM();
            if (this.observer) {
                this.observer.disconnect();
                if (this.root) this.observer.observe(this.root);
                if (this.inner) this.observer.observe(this.inner);
            }
            this.writeScroll(prevScroll);
            this.update();
        }

        refresh() {
            this.schedule();
        }

        destroy() {
            cancelAnimationFrame(this.frame);
            cancelAnimationFrame(this.glide);
            window.clearTimeout(this.rest);
            if (this.observer) this.observer.disconnect();

            const target = this.options.useWindowScroll ? window : this.root;
            if (target) {
                target.removeEventListener('scroll', this.onScroll);
                target.removeEventListener('wheel', this.onWheel);
                target.removeEventListener('pointerdown', this.onPress);
            }
            window.removeEventListener('pointerup', this.onRelease);
            window.removeEventListener('pointercancel', this.onRelease);
            window.removeEventListener('resize', this.schedule);
            this.cache.clear();
        }
    }

    window.ScrollStack = ScrollStack;
})();
