(function () {
    const DEFAULT_IMAGES = [
        'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=500&auto=format',
        'https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=500&auto=format',
        'https://images.unsplash.com/photo-1452626212852-811d58933cae?q=80&w=500&auto=format',
        'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?q=80&w=500&auto=format'
    ];

    const ORIGINS = { fan: [0.9, 0.9], cascade: [0.5, 0.5], deck: [0.5, 0], pile: [0.5, 0.5] };
    const EXITS = { fan: [1, -0.3], cascade: [0.8, 0.6], deck: [0, 1] };
    const SHADOW = '0 14px 34px -10px rgba(0, 0, 0, 0.45), 0 3px 8px -2px rgba(0, 0, 0, 0.18)';
    const CLICK_SLOP = 6;
    const FLICK_SPEED = 650;
    const LEAN_SPEED = 1300;
    const LEAN_REACH = 260;
    const PRESS_SCALE = 1.035;
    const SPRINGS = {
        place: [260, 24],
        settle: [320, 34],
        tuck: [240, 28],
        face: [240, 30],
        lean: [240, 28],
        press: [420, 34],
        fling: [650, 42]
    };

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const mix = (a, b, t) => a + (b - a) * t;

    const noise = seed => {
        const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
        return value - Math.floor(value);
    };

    const placement = (layout, position, card, spread, depth) => {
        if (layout === 'cascade') {
            return { x: -position * spread * 28, y: -position * spread * 28, rotate: 0, scale: 1 - position * depth * 0.07 };
        }
        if (layout === 'deck') {
            return { x: 0, y: -position * spread * 32, rotate: 0, scale: 1 - position * depth * 0.1 };
        }
        if (layout === 'pile') {
            return {
                x: (noise(card + 1) - 0.5) * spread * 56,
                y: (noise(card + 2) - 0.5) * spread * 44,
                rotate: (noise(card + 3) - 0.5) * spread * 40,
                scale: 1 - position * depth * 0.03
            };
        }
        return { x: 0, y: 0, rotate: position * spread * 8, scale: 1 - position * depth * 0.12 };
    };

    const releaseVelocity = (samples, time) => {
        const recent = samples.filter(sample => time - sample[2] <= 100);
        if (recent.length < 2) return [0, 0];
        const first = recent[0];
        const last = recent[recent.length - 1];
        const elapsed = Math.max((last[2] - first[2]) / 1000, 0.008);
        return [(last[0] - first[0]) / elapsed, (last[1] - first[1]) / elapsed];
    };

    class SpringValue {
        constructor(initial = 0) {
            this.current = initial;
            this.target = initial;
            this.velocity = 0;
            this.stiffness = 260;
            this.damping = 24;
            this.isAnimating = false;
        }

        set(val) {
            this.current = val;
            this.target = val;
            this.velocity = 0;
            this.isAnimating = false;
        }

        animateTo(target, stiffness, damping, initialVelocity = null) {
            this.target = target;
            this.stiffness = stiffness;
            this.damping = damping;
            if (initialVelocity !== null) {
                this.velocity = initialVelocity;
            }
            this.isAnimating = true;
        }

        update(dt) {
            if (!this.isAnimating) return false;
            const SUB_STEPS = 4;
            const subDt = Math.min(0.032, dt) / SUB_STEPS;
            for (let i = 0; i < SUB_STEPS; i++) {
                const force = -this.stiffness * (this.current - this.target) - this.damping * this.velocity;
                this.velocity += force * subDt;
                this.current += this.velocity * subDt;
            }
            if (Math.abs(this.current - this.target) < 0.001 && Math.abs(this.velocity) < 0.01) {
                this.current = this.target;
                this.velocity = 0;
                this.isAnimating = false;
                return false;
            }
            return true;
        }
    }

    class CardMotionValues {
        constructor(startX = 0, startY = 0, startRotate = 0, startScale = 1, startZ = 1, startOpacity = 1) {
            this.x = new SpringValue(startX);
            this.y = new SpringValue(startY);
            this.rotate = new SpringValue(startRotate);
            this.scale = new SpringValue(startScale);
            this.tiltX = new SpringValue(0);
            this.tiltY = new SpringValue(0);
            this.spin = new SpringValue(0);
            this.lift = new SpringValue(1);
            this.grabX = 0.5;
            this.grabY = 0.5;
            this.z = startZ;
            this.opacity = new SpringValue(startOpacity);
            this.shade = new SpringValue(0);
        }

        update(dt) {
            let active = false;
            if (this.x.update(dt)) active = true;
            if (this.y.update(dt)) active = true;
            if (this.rotate.update(dt)) active = true;
            if (this.scale.update(dt)) active = true;
            if (this.tiltX.update(dt)) active = true;
            if (this.tiltY.update(dt)) active = true;
            if (this.spin.update(dt)) active = true;
            if (this.lift.update(dt)) active = true;
            if (this.opacity.update(dt)) active = true;
            if (this.shade.update(dt)) active = true;
            return active;
        }

        stop() {
            this.x.isAnimating = false;
            this.y.isAnimating = false;
            this.rotate.isAnimating = false;
            this.scale.isAnimating = false;
            this.tiltX.isAnimating = false;
            this.tiltY.isAnimating = false;
            this.spin.isAnimating = false;
            this.lift.isAnimating = false;
            this.opacity.isAnimating = false;
            this.shade.isAnimating = false;
        }
    }

    class Stack {
        constructor(container, options = {}) {
            if (!container) return;
            this.container = container;
            this.options = {
                cards: options.cards || null,
                layout: options.layout || 'fan',
                visible: options.visible !== undefined ? options.visible : 4,
                spread: options.spread !== undefined ? options.spread : 0.5,
                depth: options.depth !== undefined ? options.depth : 0.5,
                radius: options.radius !== undefined ? options.radius : 16,
                frame: options.frame !== undefined ? options.frame : 0,
                frameColor: options.frameColor || '#ffffff',
                shadow: options.shadow !== undefined ? options.shadow : true,
                tilt: options.tilt !== undefined ? options.tilt : 30,
                threshold: options.threshold !== undefined ? options.threshold : 90,
                speed: options.speed !== undefined ? options.speed : 1,
                sendToBackOnClick: !!options.sendToBackOnClick,
                autoplay: !!options.autoplay,
                autoplayDelay: options.autoplayDelay || 3000,
                pauseOnHover: !!options.pauseOnHover,
                onChange: options.onChange || null,
                onCardClick: options.onCardClick || null,
                className: options.className || '',
                style: options.style || null
            };

            this.items = this.normalizeCards(this.options.cards);
            this.count = this.items.length;
            this.shape = ORIGINS[this.options.layout] ? this.options.layout : 'fan';
            this.reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            this.order = Array.from({ length: this.count }, (_, index) => index);
            this.values = new Map();
            this.cardElements = new Map();
            this.flying = new Map();
            this.drag = null;
            this.alive = true;
            this.hovered = false;
            this.animating = false;
            this.lastFrameTime = performance.now();
            this.autoplayTimer = null;

            this.initSettings();
            this.renderDOM();
            this.bindEvents();
            this.placeAll({ stagger: 0.05 });
            this.startAutoplay();
        }

        normalizeCards(cards) {
            if (Array.isArray(cards) && cards.length) {
                return cards;
            }
            return DEFAULT_IMAGES.map(src => {
                const img = document.createElement('img');
                img.src = src;
                img.alt = 'Card';
                img.draggable = false;
                return img;
            });
        }

        initSettings() {
            this.settings = {
                layout: this.shape,
                visible: clamp(Math.round(this.options.visible), 1, Math.max(this.count, 1)),
                spread: clamp(this.options.spread, 0, 2),
                depth: clamp(this.options.depth, 0, 1),
                tilt: clamp(this.options.tilt, 0, 89),
                threshold: Math.max(this.options.threshold, 0),
                speed: clamp(this.options.speed, 0.2, 4),
                sendToBackOnClick: this.options.sendToBackOnClick,
                count: this.count,
                reduceMotion: this.reduceMotion
            };
        }

        springParams(kind) {
            const [stiffness, damping] = SPRINGS[kind];
            const speed = this.settings.speed;
            return {
                stiffness: stiffness * speed * speed,
                damping: damping * speed
            };
        }

        valuesFor(index) {
            let val = this.values.get(index);
            if (!val) {
                const s = this.settings;
                const position = Math.max(0, this.order.indexOf(index));
                const start = placement(s.layout, s.reduceMotion ? Math.min(position, s.visible - 1) : 0, index, s.spread, s.depth);
                val = new CardMotionValues(start.x, start.y, start.rotate, start.scale, s.count - position, position < s.visible ? 1 : 0);
                this.values.set(index, val);
            }
            return val;
        }

        renderDOM() {
            this.container.innerHTML = '';
            const root = document.createElement('div');
            root.className = `stack ${this.options.className}`.trim();
            root.tabIndex = 0;
            root.setAttribute('role', 'group');
            root.setAttribute('aria-label', 'Card stack');

            if (this.options.style && typeof this.options.style === 'object') {
                Object.assign(root.style, this.options.style);
            }

            this.rootElement = root;
            this.container.appendChild(root);

            const [originX, originY] = ORIGINS[this.shape];
            const innerRadius = Math.max(0, this.options.radius - this.options.frame);

            this.items.forEach((cardItem, index) => {
                const cardEl = document.createElement('div');
                cardEl.className = 'stack-card';
                cardEl.dataset.index = index;

                const faceEl = document.createElement('div');
                faceEl.className = 'stack-card-face';
                faceEl.style.borderRadius = `${this.options.radius}px`;
                faceEl.style.padding = `${this.options.frame}px`;
                faceEl.style.backgroundColor = this.options.frame > 0 ? this.options.frameColor : 'transparent';
                faceEl.style.boxShadow = this.options.shadow ? SHADOW : 'none';

                const contentEl = document.createElement('div');
                contentEl.className = 'stack-card-content';
                contentEl.style.borderRadius = `${innerRadius}px`;

                if (typeof cardItem === 'string') {
                    if (cardItem.startsWith('http') || cardItem.startsWith('data:') || cardItem.startsWith('/') || cardItem.startsWith('.')) {
                        const img = document.createElement('img');
                        img.src = cardItem;
                        img.alt = `Card ${index + 1}`;
                        img.draggable = false;
                        contentEl.appendChild(img);
                    } else {
                        contentEl.innerHTML = cardItem;
                    }
                } else if (cardItem instanceof HTMLElement) {
                    contentEl.appendChild(cardItem);
                }

                const shadeEl = document.createElement('div');
                shadeEl.className = 'stack-card-shade';
                shadeEl.style.borderRadius = `${this.options.radius}px`;

                faceEl.appendChild(contentEl);
                faceEl.appendChild(shadeEl);
                cardEl.appendChild(faceEl);
                root.appendChild(cardEl);

                this.cardElements.set(index, { cardEl, faceEl, contentEl, shadeEl });
            });

            this.applyTransforms();
        }

        applyTransforms() {
            const [originX, originY] = ORIGINS[this.shape];
            const topIndex = this.order[0];

            this.items.forEach((_, index) => {
                const item = this.cardElements.get(index);
                if (!item) return;
                const { cardEl, faceEl, shadeEl } = item;
                const val = this.valuesFor(index);
                const isTop = topIndex === index;

                if (isTop) {
                    cardEl.setAttribute('data-top', '');
                    cardEl.removeAttribute('aria-hidden');
                    cardEl.style.cursor = this.drag && this.drag.moved ? 'grabbing' : 'grab';
                    cardEl.style.touchAction = 'none';
                } else {
                    cardEl.removeAttribute('data-top');
                    cardEl.setAttribute('aria-hidden', 'true');
                    cardEl.style.cursor = 'default';
                    cardEl.style.touchAction = 'auto';
                }

                cardEl.style.transformOrigin = `${originX * 100}% ${originY * 100}%`;
                cardEl.style.transform = `translate3d(${val.x.current}px, ${val.y.current}px, 0px) rotate(${val.rotate.current}deg) scale(${val.scale.current})`;
                cardEl.style.zIndex = Math.round(val.z);
                cardEl.style.opacity = Math.max(0, Math.min(1, val.opacity.current));

                faceEl.style.transformOrigin = `${val.grabX * 100}% ${val.grabY * 100}%`;
                faceEl.style.transform = `perspective(800px) rotateX(${val.tiltX.current}deg) rotateY(${val.tiltY.current}deg) rotate(${val.spin.current}deg) scale(${val.lift.current})`;

                shadeEl.style.opacity = Math.max(0, Math.min(1, val.shade.current));
            });
        }

        requestAnimationTick() {
            if (this.animating) return;
            this.animating = true;
            this.lastFrameTime = performance.now();
            requestAnimationFrame(this.onAnimationTick.bind(this));
        }

        onAnimationTick(now) {
            if (!this.alive) {
                this.animating = false;
                return;
            }

            const dt = (now - this.lastFrameTime) / 1000;
            this.lastFrameTime = now;

            let anyMoving = false;
            this.values.forEach(val => {
                if (val.update(dt)) anyMoving = true;
            });

            this.applyTransforms();

            if (anyMoving || this.drag || this.flying.size > 0) {
                requestAnimationFrame(this.onAnimationTick.bind(this));
            } else {
                this.animating = false;
            }
        }

        settleFace(val, kind = 'face') {
            const { stiffness, damping } = this.springParams(kind);
            val.tiltX.animateTo(0, stiffness, damping);
            val.tiltY.animateTo(0, stiffness, damping);
            val.spin.animateTo(0, stiffness, damping);
            val.lift.animateTo(1, stiffness, damping);
            this.requestAnimationTick();
        }

        placeCard(index, position, { lift = 0, kind = 'place', velocity = null, keepZ = false } = {}) {
            const s = this.settings;
            const values = this.valuesFor(index);
            const shown = Math.min(position, s.visible - 1);
            const target = placement(s.layout, shown, index, s.spread, s.depth);

            if (lift > 0 && shown > 0) {
                const ahead = placement(s.layout, shown - 1, index, s.spread, s.depth);
                target.x = mix(target.x, ahead.x, lift);
                target.y = mix(target.y, ahead.y, lift);
                target.rotate = mix(target.rotate, ahead.rotate, lift);
                target.scale = mix(target.scale, ahead.scale, lift);
            }

            const { stiffness, damping } = this.springParams(kind);
            if (!keepZ) {
                values.z = s.count - position;
            }

            values.x.animateTo(target.x, stiffness, damping, velocity ? velocity[0] : null);
            values.y.animateTo(target.y, stiffness, damping, velocity ? velocity[1] : null);
            values.rotate.animateTo(target.rotate, stiffness, damping);
            values.scale.animateTo(target.scale, stiffness, damping);

            this.settleFace(values, 'face');

            const fadeSpeed = s.speed;
            values.opacity.animateTo(position < s.visible ? 1 : 0, 180 * fadeSpeed, 22 * fadeSpeed);
            values.shade.animateTo(Math.min(0.6, shown * s.depth * 0.14 * (1 - lift)), 180 * fadeSpeed, 22 * fadeSpeed);

            this.requestAnimationTick();
        }

        placeAll({ lift = 0, released = -1, velocity = null, kind = 'place' } = {}) {
            const drag = this.drag;
            this.order.forEach((index, position) => {
                const flight = this.flying.get(index);
                if (flight && !flight.turned) return;
                if (drag && drag.moved && drag.card === index) return;
                const isReleased = index === released;
                this.placeCard(index, position, {
                    lift: position > 0 ? lift : 0,
                    kind: flight ? 'tuck' : isReleased ? 'settle' : kind,
                    velocity: isReleased ? velocity : null,
                    keepZ: !!flight
                });
            });
        }

        sendToBack(direction = null, velocity = null) {
            const s = this.settings;
            const current = this.order;
            if (current.length < 2) return;
            const top = current[0];
            if (this.flying.has(top)) return;

            const next = [...current.slice(1), top];
            if (s.reduceMotion) {
                this.order = next;
                this.placeAll();
                if (this.options.onChange) this.options.onChange(next[0]);
                return;
            }

            let [dx, dy] = direction || EXITS[s.layout] || [Math.cos(noise(top + 9) * 6.283), Math.sin(noise(top + 9) * 6.283)];
            const length = Math.hypot(dx, dy) || 1;
            dx /= length;
            dy /= length;

            const bounds = this.rootElement.getBoundingClientRect();
            const width = bounds.width || 320;
            const height = bounds.height || 200;
            const clearance = Math.min(width / Math.max(Math.abs(dx), 0.01), height / Math.max(Math.abs(dy), 0.01));
            const home = placement(s.layout, 0, top, s.spread, s.depth);
            const travel = clearance * 1.12 + 40;
            const out = [home.x + dx * travel, home.y + dy * travel];
            const values = this.valuesFor(top);
            const { stiffness, damping } = this.springParams('fling');
            const flight = { turned: false };

            this.flying.set(top, flight);
            values.z = s.count + 1;

            values.x.animateTo(out[0], stiffness, damping, velocity ? velocity[0] : null);
            values.y.animateTo(out[1], stiffness, damping, velocity ? velocity[1] : null);
            this.settleFace(values, 'face');

            this.order = next;
            this.placeAll({ kind: 'place' });

            if (this.options.onChange) {
                this.options.onChange(next[0]);
            }

            const span = Math.max(Math.hypot(out[0] - values.x.current, out[1] - values.y.current), 1);
            let landed = false;

            const turn = () => {
                flight.turned = true;
                const position = this.order.indexOf(top);
                if (position >= 0) this.placeCard(top, position, { kind: 'tuck', keepZ: !landed });
            };

            const land = () => {
                landed = true;
                if (this.flying.get(top) === flight) this.flying.delete(top);
                const position = this.order.indexOf(top);
                if (position >= 0) values.z = this.settings.count - position;
                this.applyTransforms();
            };

            const fallback = setTimeout(() => {
                if (!flight.turned) turn();
                if (!landed) land();
            }, 1500 / s.speed);

            const watch = () => {
                if (!this.alive || (flight.turned && landed)) {
                    clearTimeout(fallback);
                    return;
                }
                const x = values.x.current;
                const y = values.y.current;
                const outward = values.x.velocity * dx + values.y.velocity * dy;
                if (!flight.turned && (Math.hypot(out[0] - x, out[1] - y) <= span * 0.08 || outward < 0)) turn();
                if (!landed && (flight.turned && (outward < 0 || Math.hypot(out[0] - x, out[1] - y) > span * 0.5))) land();
                requestAnimationFrame(watch);
            };

            this.requestAnimationTick();
            requestAnimationFrame(watch);
        }

        lean(drag) {
            const s = this.settings;
            if (s.reduceMotion) return;
            const values = this.valuesFor(drag.card);
            const offsetX = values.x.current - drag.homeX;
            const offsetY = values.y.current - drag.homeY;
            const sideways = clamp(drag.vx / LEAN_SPEED, -1, 1) * 0.7 + clamp(offsetX / LEAN_REACH, -1, 1) * 0.3;
            const upward = clamp(-drag.vy / LEAN_SPEED, -1, 1) * 0.7 + clamp(-offsetY / LEAN_REACH, -1, 1) * 0.3;
            const { stiffness, damping } = this.springParams('lean');

            values.tiltY.animateTo(sideways * s.tilt, stiffness, damping);
            values.tiltX.animateTo(upward * s.tilt, stiffness, damping);
            values.spin.animateTo(clamp(offsetX / LEAN_REACH, -1, 1) * 6, stiffness, damping);
            this.requestAnimationTick();
        }

        onPointerDown(event, index) {
            if (event.button !== 0 || this.drag) return;
            if (this.order[0] !== index || this.flying.has(index)) return;

            const s = this.settings;
            const values = this.valuesFor(index);
            const home = placement(s.layout, 0, index, s.spread, s.depth);
            const bounds = event.currentTarget.getBoundingClientRect();

            values.grabX = clamp((event.clientX - bounds.left) / Math.max(bounds.width, 1), 0, 1);
            values.grabY = clamp((event.clientY - bounds.top) / Math.max(bounds.height, 1), 0, 1);

            if (!s.reduceMotion) {
                const { stiffness, damping } = this.springParams('press');
                values.lift.animateTo(PRESS_SCALE, stiffness, damping);
            }

            this.drag = {
                card: index,
                id: event.pointerId,
                element: event.currentTarget,
                startX: event.clientX,
                startY: event.clientY,
                originX: 0,
                originY: 0,
                homeX: home.x,
                homeY: home.y,
                vx: 0,
                vy: 0,
                idle: 0,
                moved: false,
                progress: 0,
                samples: [[event.clientX, event.clientY, event.timeStamp]]
            };

            if (event.pointerType === 'mouse') event.preventDefault();

            window.addEventListener('pointermove', this.boundOnPointerMove);
            window.addEventListener('pointerup', this.boundOnPointerUp);
            window.addEventListener('pointercancel', this.boundOnPointerUp);

            this.requestAnimationTick();
        }

        onPointerMove(event) {
            const drag = this.drag;
            if (!drag || event.pointerId !== drag.id) return;

            const s = this.settings;
            const dx = event.clientX - drag.startX;
            const dy = event.clientY - drag.startY;
            const values = this.valuesFor(drag.card);

            if (!drag.moved) {
                if (Math.hypot(dx, dy) < CLICK_SLOP) return;
                drag.moved = true;
                values.x.set(values.x.current);
                values.y.set(values.y.current);
                drag.originX = values.x.current - dx;
                drag.originY = values.y.current - dy;
                try {
                    drag.element.setPointerCapture(drag.id);
                } catch (e) {}
            }

            values.x.set(drag.originX + dx);
            values.y.set(drag.originY + dy);

            drag.samples.push([event.clientX, event.clientY, event.timeStamp]);
            if (drag.samples.length > 12) drag.samples.shift();
            [drag.vx, drag.vy] = releaseVelocity(drag.samples, event.timeStamp);

            this.lean(drag);

            clearTimeout(drag.idle);
            drag.idle = setTimeout(() => {
                if (this.drag !== drag) return;
                drag.vx = 0;
                drag.vy = 0;
                this.lean(drag);
            }, 70);

            const progress = clamp(Math.hypot(dx, dy) / Math.max(s.threshold, 1), 0, 1);
            if (Math.abs(progress - drag.progress) > 0.02) {
                drag.progress = progress;
                this.placeAll({ lift: progress * 0.4, kind: 'settle' });
            }

            this.requestAnimationTick();
        }

        onPointerUp(event) {
            const drag = this.drag;
            if (!drag || event.pointerId !== drag.id) return;

            this.drag = null;
            clearTimeout(drag.idle);

            window.removeEventListener('pointermove', this.boundOnPointerMove);
            window.removeEventListener('pointerup', this.boundOnPointerUp);
            window.removeEventListener('pointercancel', this.boundOnPointerUp);

            try {
                drag.element.releasePointerCapture(drag.id);
            } catch (e) {}

            const s = this.settings;
            if (!drag.moved) {
                if (event.type === 'pointerup' && s.sendToBackOnClick) {
                    this.sendToBack(null);
                } else {
                    this.settleFace(this.valuesFor(drag.card), 'face');
                    if (this.options.onCardClick) {
                        this.lastCardClickTriggerTime = Date.now();
                        this.options.onCardClick(drag.card);
                    }
                }
                return;
            }

            const dx = event.clientX - drag.startX;
            const dy = event.clientY - drag.startY;
            const [vx, vy] = releaseVelocity(drag.samples, event.timeStamp);
            const distance = Math.hypot(dx, dy);
            const pace = Math.hypot(vx, vy);
            const flick = pace > FLICK_SPEED && distance > 16 && vx * dx + vy * dy > 0;

            if (event.type === 'pointerup' && s.count > 1 && (distance > s.threshold || flick)) {
                this.sendToBack(pace > 300 ? [vx, vy] : [dx, dy], [vx, vy]);
            } else {
                this.placeAll({ released: drag.card, velocity: [clamp(vx, -3000, 3000), clamp(vy, -3000, 3000)] });
            }
        }

        onKeyDown(event) {
            if (event.target !== this.rootElement) return;
            if (['ArrowRight', 'ArrowDown', 'Enter', ' '].includes(event.key)) {
                event.preventDefault();
                this.sendToBack(null);
            }
        }

        bindEvents() {
            this.boundOnPointerMove = this.onPointerMove.bind(this);
            this.boundOnPointerUp = this.onPointerUp.bind(this);

            this.cardElements.forEach((item, index) => {
                item.cardEl.addEventListener('pointerdown', e => this.onPointerDown(e, index));
                item.cardEl.addEventListener('click', e => {
                    if (this.lastCardClickTriggerTime && Date.now() - this.lastCardClickTriggerTime < 450) {
                        return;
                    }
                    if (this.order[0] === index && this.options.onCardClick) {
                        this.lastCardClickTriggerTime = Date.now();
                        this.options.onCardClick(index);
                    }
                });
            });

            this.rootElement.addEventListener('keydown', this.onKeyDown.bind(this));
            this.rootElement.addEventListener('mouseenter', () => {
                this.hovered = true;
            });
            this.rootElement.addEventListener('mouseleave', () => {
                this.hovered = false;
            });
        }

        startAutoplay() {
            if (!this.options.autoplay || this.count < 2) return;
            clearInterval(this.autoplayTimer);
            this.autoplayTimer = setInterval(() => {
                if (this.options.pauseOnHover && this.hovered) return;
                if (this.drag) return;
                this.sendToBack(null);
            }, Math.max(300, this.options.autoplayDelay));
        }

        stopAutoplay() {
            if (this.autoplayTimer) {
                clearInterval(this.autoplayTimer);
                this.autoplayTimer = null;
            }
        }

        setLayout(newLayout) {
            if (!ORIGINS[newLayout]) return;
            this.shape = newLayout;
            this.settings.layout = newLayout;
            this.placeAll({ kind: 'place' });
        }

        setCards(newCards) {
            this.items = this.normalizeCards(newCards);
            this.count = this.items.length;
            this.order = Array.from({ length: this.count }, (_, index) => index);
            this.values.clear();
            this.flying.clear();
            this.cardElements.clear();
            this.initSettings();
            this.renderDOM();
            this.bindEvents();
            this.placeAll({ stagger: 0.04 });
            this.startAutoplay();
        }

        getActiveIndex() {
            return this.order[0];
        }

        destroy() {
            this.alive = false;
            this.stopAutoplay();
            if (this.drag) {
                clearTimeout(this.drag.idle);
            }
            window.removeEventListener('pointermove', this.boundOnPointerMove);
            window.removeEventListener('pointerup', this.boundOnPointerUp);
            window.removeEventListener('pointercancel', this.boundOnPointerUp);
            this.values.forEach(v => v.stop());
            if (this.rootElement && this.rootElement.parentNode) {
                this.rootElement.parentNode.removeChild(this.rootElement);
            }
        }
    }

    window.Stack = Stack;
})();
