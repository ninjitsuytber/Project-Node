(function () {
    const NOTIFS_STORAGE_KEY = 'project_node_notifications';

    const defaultNotifications = [
        {
            id: 'notif-1',
            type: 'urgent',
            title: 'Water Supply Pipeline Maintenance',
            description: 'Scheduled maintenance for main water supply line tomorrow from 10:00 AM to 2:00 PM. Affected units: Block A & B.',
            time: '35 mins ago',
            tag: 'Maintenance',
            category: 'maintenance',
            actionText: 'View Schedule',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M686-132 444-376q-20 8-40.5 12t-43.5 4q-100 0-170-70t-70-170q0-36 10-68.5t28-61.5l146 146 72-72-146-146q29-18 61.5-28t68.5-10q100 0 170 70t70 170q0 23-4 43.5T584-516l244 242q12 12 12 29t-12 29l-84 84q-12 12-29 12t-29-12Zm29-85 27-27-256-256q18-20 26-46.5t8-53.5q0-60-38.5-104.5T386-758l74 74q12 12 12 28t-12 28L332-500q-12 12-28 12t-28-12l-74-74q9 57 53.5 95.5T360-440q26 0 52-8t47-25l256 256ZM472-488Z"/></svg>`
        },
        {
            id: 'notif-2',
            type: 'package',
            title: 'Smart Parcel Locker Delivery',
            description: 'Courier parcel placed in Ground Floor Smart Locker #18. Pickup PIN: 8492. Locker reserved for 48 hours.',
            time: '2 hours ago',
            tag: 'Delivery',
            category: 'delivery',
            actionText: 'Locker PIN: 8492',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M155-195q-35-35-35-85H40v-440q0-33 23.5-56.5T120-800h560v160h120l120 160v200h-80q0 50-35 85t-85 35q-50 0-85-35t-35-85H360q0 50-35 85t-85 35q-50 0-85-35Zm113.5-56.5Q280-263 280-280t-11.5-28.5Q257-320 240-320t-28.5 11.5Q200-297 200-280t11.5 28.5Q223-240 240-240t28.5-11.5ZM120-360h32q17-18 39-29t49-11q27 0 49 11t39 29h272v-360H120v360Zm628.5 108.5Q760-263 760-280t-11.5-28.5Q737-320 720-320t-28.5 11.5Q680-297 680-280t11.5 28.5Q703-240 720-240t28.5-11.5ZM680-440h170l-90-120h-80v120ZM360-540Z"/></svg>`
        },
        {
            id: 'notif-3',
            type: 'event',
            title: 'Annual Neighborhood Community Gathering',
            description: 'Resident meetup this Saturday at 5:00 PM in the Central Courtyard. Catering provided. Please confirm attendance.',
            time: '5 hours ago',
            tag: 'Community',
            category: 'community',
            actionText: 'RSVP Attendance',
            icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/></svg>`
        },
        {
            id: 'notif-4',
            type: 'notice',
            title: 'Digital Visitor Access Protocol at Main Gate',
            description: 'Security intercom updated. Residents may issue guest entry passes directly through the Project Node directory.',
            time: 'Yesterday',
            tag: 'Security',
            category: 'security',
            actionText: 'Read Guidelines',
            icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>`
        },
        {
            id: 'notif-5',
            type: 'notice',
            title: 'Elevator 2 Preventative Inspection',
            description: 'Tower B elevator preventative maintenance check scheduled today between 1:00 PM and 3:00 PM.',
            time: '1 day ago',
            tag: 'Maintenance',
            category: 'maintenance',
            actionText: 'View Status',
            icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1.4c0-2 4-3.1 6-3.1s6 1.1 6 3.1V18z"/></svg>`
        },
        {
            id: 'notif-6',
            type: 'package',
            title: 'Fresh Organic Grocery Drop',
            description: 'Cold storage locker #4 has received your fresh produce delivery. Temperature regulated at 4°C.',
            time: '2 days ago',
            tag: 'Delivery',
            category: 'delivery',
            actionText: 'Cold Locker #4',
            icon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>`
        }
    ];

    let notifications = [];
    let stackInstances = [];

    function initData() {
        const storedNotifs = localStorage.getItem(NOTIFS_STORAGE_KEY);
        if (storedNotifs) {
            try {
                const parsed = JSON.parse(storedNotifs);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    notifications = parsed.map(notif => {
                        const defaultItem = defaultNotifications.find(d => d.id === notif.id);
                        if (defaultItem) {
                            return { ...defaultItem, ...notif, icon: defaultItem.icon };
                        }
                        return notif;
                    });
                } else {
                    notifications = defaultNotifications.slice();
                }
            } catch (e) {
                notifications = defaultNotifications.slice();
            }
        } else {
            notifications = defaultNotifications.slice();
        }

        renderActiveStacks();
        renderNotifications();
        updateCounters();
    }

    function saveNotifications() {
        localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(notifications));
        updateCounters();
    }

    function updateCounters() {
        const countDisplay = document.getElementById('notif-count-display');
        if (countDisplay) {
            countDisplay.textContent = `${notifications.length} Active`;
        }
    }

    function renderActiveStacks() {
        const leftContainer = document.getElementById('stack-left-pile');
        const leftDots = document.getElementById('dots-left-pile');
        const rightContainer = document.getElementById('stack-right-pile');
        const rightDots = document.getElementById('dots-right-pile');
        if (!leftContainer || !rightContainer) return;

        stackInstances.forEach(inst => {
            if (inst && inst.destroy) inst.destroy();
        });
        stackInstances = [];

        const leftItems = notifications.filter(n => n.category === 'maintenance' || n.category === 'security' || n.tag === 'Maintenance' || n.tag === 'Security');
        const rightItems = notifications.filter(n => n.category === 'delivery' || n.category === 'community' || n.tag === 'Delivery' || n.tag === 'Community');

        const fallbackLeft = [
            defaultNotifications[0],
            defaultNotifications[3],
            defaultNotifications[4]
        ];
        const fallbackRight = [
            defaultNotifications[1],
            defaultNotifications[2],
            defaultNotifications[5]
        ];

        const finalLeft = (leftItems.length >= 3 ? leftItems.slice(0, 3) : fallbackLeft);
        const finalRight = (rightItems.length >= 3 ? rightItems.slice(0, 3) : fallbackRight);

        leftContainer.innerHTML = finalLeft.map((item, idx) => createCardHtml(item, idx + 1)).join('');
        leftDots.innerHTML = finalLeft.map((_, idx) => `<span class="dot ${idx === 0 ? 'active' : ''}"></span>`).join('');

        rightContainer.innerHTML = finalRight.map((item, idx) => createCardHtml(item, idx + 1)).join('');
        rightDots.innerHTML = finalRight.map((_, idx) => `<span class="dot ${idx === 0 ? 'active' : ''}"></span>`).join('');

        const leftStack = setupSmartStack(leftContainer, leftDots, 3000, 0.95);
        const rightStack = setupSmartStack(rightContainer, rightDots, 3000, 0.95, 1500);

        if (leftStack) stackInstances.push(leftStack);
        if (rightStack) stackInstances.push(rightStack);
    }

    function formatCardTime(timeStr) {
        if (!timeStr) return '';
        return timeStr
            .replace(/(\d+)\s*mins?\s*ago/i, '$1m ago')
            .replace(/(\d+)\s*hours?\s*ago/i, '$1h ago')
            .replace(/(\d+)\s*days?\s*ago/i, '$1d ago');
    }

    function createCardHtml(notif, cardNum) {
        const badgeClass = 'badge-' + (notif.category || notif.tag.toLowerCase());
        const displayTime = formatCardTime(notif.time);
        return `
            <div class="card card-${cardNum}" data-index="${cardNum - 1}" data-id="${notif.id}">
                <div class="stack-card-top-row">
                    <span class="stack-card-badge ${badgeClass}">${notif.tag}</span>
                    <span class="stack-card-time" title="${notif.time}">${displayTime}</span>
                </div>
                <div class="stack-card-content">
                    <h4 class="stack-card-title">${notif.title}</h4>
                    <p class="stack-card-desc">${notif.description}</p>
                </div>
                <div class="stack-card-bottom-row">
                    <span class="stack-card-action-pill" onclick="event.stopPropagation(); NodeNotifications.handleAction('${notif.id}')">${notif.actionText}</span>
                    <div class="stack-card-icon-tag">${notif.icon}</div>
                </div>
            </div>
        `;
    }

    function setupSmartStack(stackEl, dotsContainer, autoIntervalMs, transitionDuration, initialDelay = 0) {
        if (!stackEl || !dotsContainer) return null;

        let cards = Array.from(stackEl.querySelectorAll('.card'));
        let dots = Array.from(dotsContainer.querySelectorAll('.dot'));
        if (cards.length < 3) return null;

        let startY = 0;
        let deltaY = 0;
        let isDragging = false;
        let autoTimer = null;
        let resumeTimer = null;

        const threshold = 40;
        const BASE_SCALE = 0.85;
        const Z_DEPTH = -40;

        function getCardOffset() {
            return stackEl.offsetHeight || 160;
        }

        function getCurrentIndex() {
            if (cards[0] && cards[0].dataset && cards[0].dataset.index !== undefined) {
                return parseInt(cards[0].dataset.index, 10);
            }
            const className = (cards[0] && cards[0].className) || '';
            const match = className.match(/card-(\d+)/);
            return match ? parseInt(match[1], 10) - 1 : 0;
        }

        function updateIndicators() {
            const index = getCurrentIndex();
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
        }

        function applyPositions() {
            const offset = getCardOffset();
            cards[0].style.zIndex = 3;
            cards[0].style.top = '0px';
            cards[0].style.transform = 'translateZ(0px) scale(1)';
            cards[0].style.opacity = '1';

            cards[1].style.zIndex = 2;
            cards[1].style.top = offset + 'px';
            cards[1].style.transform = 'translateZ(' + Z_DEPTH + 'px) scale(' + BASE_SCALE + ')';
            cards[1].style.opacity = '1';

            cards[2].style.zIndex = 1;
            cards[2].style.top = (-offset) + 'px';
            cards[2].style.transform = 'translateZ(' + Z_DEPTH + 'px) scale(' + BASE_SCALE + ')';
            cards[2].style.opacity = '1';

            updateIndicators();
        }

        function clamp(val, min, max) {
            return Math.max(min, Math.min(max, val));
        }

        function prepareNextCard(direction) {
            const offset = getCardOffset();
            const ghost = direction === 'up' ? cards[2] : cards[1];
            ghost.style.transition = 'none';
            ghost.style.top = direction === 'up' ? offset + 'px' : (-offset) + 'px';
            ghost.style.zIndex = 1;
            ghost.style.transform = 'translateZ(' + Z_DEPTH + 'px) scale(' + BASE_SCALE + ')';
            ghost.style.opacity = '0';
        }

        function nextCard(direction, customDuration) {
            const dur = customDuration || transitionDuration;
            cards.forEach(c => {
                c.style.transition = 'top ' + dur + 's cubic-bezier(0.22, 1, 0.36, 1), transform ' + dur + 's cubic-bezier(0.22, 1, 0.36, 1), opacity ' + (dur * 0.75) + 's ease';
            });

            if (direction === 'down') {
                cards.unshift(cards.pop());
            } else {
                cards.push(cards.shift());
            }

            applyPositions();
        }

        function startAutoLoop(firstDelay) {
            stopAutoLoop();
            const delay = (firstDelay !== undefined && firstDelay > 0) ? firstDelay : autoIntervalMs;
            if (delay > 0 && delay !== autoIntervalMs) {
                resumeTimer = setTimeout(() => {
                    if (!isDragging) {
                        nextCard('up', transitionDuration);
                    }
                    autoTimer = setInterval(() => {
                        if (!isDragging) {
                            nextCard('up', transitionDuration);
                        }
                    }, autoIntervalMs);
                }, delay);
            } else {
                autoTimer = setInterval(() => {
                    if (!isDragging) {
                        nextCard('up', transitionDuration);
                    }
                }, autoIntervalMs);
            }
        }

        function stopAutoLoop() {
            if (autoTimer) {
                clearInterval(autoTimer);
                autoTimer = null;
            }
        }

        function scheduleAutoResume() {
            clearTimeout(resumeTimer);
            resumeTimer = setTimeout(() => {
                startAutoLoop();
            }, 4000);
        }

        function onPointerDown(e) {
            isDragging = true;
            startY = e.clientY;
            deltaY = 0;
            stopAutoLoop();
            clearTimeout(resumeTimer);
            cards.forEach(c => (c.style.transition = 'none'));
        }

        function onPointerMove(e) {
            if (!isDragging) return;
            deltaY = e.clientY - startY;

            const offset = getCardOffset();
            const direction = deltaY > 0 ? 'down' : 'up';
            const offsetY = deltaY;

            const currentNormalized = clamp(1 - Math.abs(offsetY) / offset, 0, 1);
            const currentScale = BASE_SCALE + (1 - BASE_SCALE) * currentNormalized;

            const nextTop = direction === 'up' ? offsetY + offset : offsetY - offset;
            const nextNormalized = clamp(1 - Math.abs(nextTop) / offset, 0, 1);
            const nextScale = BASE_SCALE + (1 - BASE_SCALE) * nextNormalized;

            cards[0].style.top = offsetY + 'px';
            cards[0].style.transform = 'translateZ(0px) scale(' + currentScale + ')';
            cards[0].style.opacity = '1';

            prepareNextCard(direction);

            if (direction === 'up') {
                cards[1].style.top = (offsetY + offset) + 'px';
                cards[1].style.transform = 'translateZ(' + Z_DEPTH + 'px) scale(' + nextScale + ')';
                cards[1].style.opacity = '1';
            } else {
                cards[2].style.top = (offsetY - offset) + 'px';
                cards[2].style.transform = 'translateZ(' + Z_DEPTH + 'px) scale(' + nextScale + ')';
                cards[2].style.opacity = '1';
            }
        }

        function onPointerUp() {
            if (!isDragging) return;
            isDragging = false;

            cards.forEach(c => {
                c.style.transition = 'top 0.45s cubic-bezier(0.22, 1, 0.36, 1), transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease';
            });

            if (deltaY > threshold) {
                cards.unshift(cards.pop());
            } else if (deltaY < -threshold) {
                cards.push(cards.shift());
            }

            applyPositions();
            scheduleAutoResume();
        }

        dots.forEach((dot, dotIdx) => {
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                const curIdx = getCurrentIndex();
                if (dotIdx === curIdx) return;
                stopAutoLoop();
                const diff = (dotIdx - curIdx + cards.length) % cards.length;
                if (diff === 1) {
                    nextCard('up', 0.4);
                } else {
                    nextCard('down', 0.4);
                }
                scheduleAutoResume();
            });
        });

        stackEl.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);

        applyPositions();
        startAutoLoop(initialDelay);

        return {
            destroy: () => {
                stopAutoLoop();
                clearTimeout(resumeTimer);
                stackEl.removeEventListener('pointerdown', onPointerDown);
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('pointerup', onPointerUp);
            }
        };
    }

    function renderNotifications() {
        const container = document.getElementById('notifications-stream');
        if (!container) return;

        if (notifications.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2.5rem 1.5rem; color: var(--text-ghost); background: var(--bg-surface); border-radius: var(--r-md); border: 1px dashed var(--border-hair);">
                    <p style="font-size: 0.88rem; font-weight: 500;">No active notices.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = notifications.map(notif => `
            <div class="rectangle-notification priority-${notif.type}" data-id="${notif.id}">
                <div class="notif-icon-frame">
                    ${notif.icon}
                </div>
                <div class="notif-main-col">
                    <div class="notif-meta-strip">
                        <span class="notif-badge-pill">${notif.tag}</span>
                        <span class="notif-timestamp">${notif.time}</span>
                    </div>
                    <h4 class="notif-heading">${notif.title}</h4>
                    <p class="notif-paragraph">${notif.description}</p>
                    <div class="notif-actions-row">
                        <button class="notif-action-btn" onclick="NodeNotifications.handleAction('${notif.id}')">${notif.actionText}</button>
                    </div>
                </div>
                <button class="notif-close-action" title="Dismiss notice" onclick="NodeNotifications.dismissNotification('${notif.id}')">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </div>
        `).join('');
    }

    function dismissNotification(id) {
        notifications = notifications.filter(n => n.id !== id);
        saveNotifications();
        renderActiveStacks();
        renderNotifications();
        if (window.NodeApp && window.NodeApp.showToast) {
            window.NodeApp.showToast('Notice dismissed');
        }
    }

    function handleAction(id) {
        const notif = notifications.find(n => n.id === id);
        if (notif && window.NodeApp && window.NodeApp.showToast) {
            window.NodeApp.showToast(notif.title);
        }
    }

    window.NodeNotifications = {
        init: initData,
        renderNotifications: renderNotifications,
        renderActiveStacks: renderActiveStacks,
        dismissNotification: dismissNotification,
        handleAction: handleAction
    };

    document.addEventListener('DOMContentLoaded', () => {
        initData();
    });
})();
