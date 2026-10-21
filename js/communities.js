(function () {
    const INVITATIONS_STORAGE_KEY = 'project_node_community_invitations';

    const locationsData = [
        {
            id: 'gym',
            name: 'Gym',
            subtitle: 'East Wing, Floor 4',
            description: 'Equipped with commercial-grade strength stations, Olympic free weights, connected cardiovascular equipment, and private stretching studio. Filtered hydration points and sanitization stations on-site.',
            stats: '84 people went to the gym today. Sure not to be one of them?',
            activeNow: '18 active right now',
            images: [
                'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80'
            ]
        },
        {
            id: 'park',
            name: 'Park',
            subtitle: 'Ground Level, Courtyard West',
            description: 'Lush native tree canopy, manicured lawn commons, botanical walking paths, and peaceful open-air reading benches. Pets on leash welcome during daylight hours.',
            stats: '142 people walked through the park today. Sure not to take some fresh air?',
            activeNow: '31 active right now',
            images: [
                'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1496347646636-ea47f7d6b37b?auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80'
            ]
        },
        {
            id: 'rooftop',
            name: 'Rooftop Lounge',
            subtitle: 'North Tower, Level 28',
            description: 'Elevated panoramic vista point overlooking the skyline. Features sheltered sunset seating pods, ambient evening warm lighting, and a resident reservation dining pavilion.',
            stats: '67 people relaxed on the rooftop today. Sure not to catch the evening breeze?',
            activeNow: '12 active right now',
            images: [
                'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=600&q=80'
            ]
        },
        {
            id: 'pool',
            name: 'Swimming Pool',
            subtitle: 'Clubhouse, Level 2',
            description: '25-meter temperature-controlled lap pool, heated recovery spa jacuzzi, shaded sun lounger deck, and poolside cabanas. Dedicated morning lap hours from 6:00 AM to 9:00 AM.',
            stats: '53 people swam in the pool today. Sure not to take a refreshing dip?',
            activeNow: '9 active right now',
            images: [
                'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1572331165267-854da2b10ccc?auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=600&q=80',
                'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?auto=format&fit=crop&w=600&q=80'
            ]
        }
    ];

    const defaultInvitations = [
        {
            id: 'inv-1',
            location: 'Gym',
            title: 'Evening High-Intensity Workout & Spotting',
            hostName: 'Marcus Vance',
            hostUnit: 'Block 2, #04-06',
            time: 'Today, 6:30 PM',
            capacity: 4,
            joinedCount: 2,
            note: 'Looking for 1-2 workout partners for chest and tricep sets. Glad to spot and share routines.',
            joinedByUser: false
        },
        {
            id: 'inv-2',
            location: 'Park',
            title: 'Sunrise Vinyasa Flow & Morning Walk',
            hostName: 'Sarah Chen',
            hostUnit: 'Block 4, #08-12',
            time: 'Tomorrow, 7:00 AM',
            capacity: 6,
            joinedCount: 3,
            note: 'Bring your own mat. 40 minutes gentle morning yoga on the lawn followed by tea.',
            joinedByUser: false
        },
        {
            id: 'inv-3',
            location: 'Rooftop Lounge',
            title: 'Sunset Photography & Golden Hour Meetup',
            hostName: 'Elena Rostova',
            hostUnit: 'Block 3, #02-15',
            time: 'Saturday, 5:45 PM',
            capacity: 5,
            joinedCount: 4,
            note: 'Relaxed gathering to watch the skyline sunset. Bring your camera or simply enjoy the view.',
            joinedByUser: false
        },
        {
            id: 'inv-4',
            location: 'Swimming Pool',
            title: 'Morning Freestyle Lap Interval Training',
            hostName: 'David Kim',
            hostUnit: 'Block 1, #09-02',
            time: 'Sunday, 8:00 AM',
            capacity: 3,
            joinedCount: 1,
            note: 'Pacing 50m intervals in the center lane. Great endurance session for swimming enthusiasts.',
            joinedByUser: false
        }
    ];

    let currentLocationIndex = 0;
    let currentLocationImages = [];
    let autoRotateInterval = null;
    let invitations = [];
    let invitationsScrollStack = null;

    function initCommunities() {
        currentLocationImages = [...locationsData[currentLocationIndex].images];
        loadInvitations();
        renderLocationContent();
        setupEventListeners();
        startAutoRotation();
    }

    function loadInvitations() {
        const stored = localStorage.getItem(INVITATIONS_STORAGE_KEY);
        if (stored) {
            try {
                invitations = JSON.parse(stored);
            } catch (e) {
                invitations = defaultInvitations;
            }
        } else {
            invitations = defaultInvitations;
            saveInvitations();
        }
    }

    function saveInvitations() {
        localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(invitations));
    }

    function renderLocationContent() {
        const loc = locationsData[currentLocationIndex];
        const nameEl = document.getElementById('location-name-display');
        const subEl = document.getElementById('location-subtitle-display');
        const descEl = document.getElementById('location-description-display');
        const statsEl = document.getElementById('location-statistics-display');
        const badgeEl = document.getElementById('location-active-badge');
        const dotsContainer = document.getElementById('location-dots-container');

        if (nameEl) nameEl.textContent = loc.name;
        if (subEl) subEl.textContent = loc.subtitle;
        if (descEl) descEl.textContent = loc.description;
        if (statsEl) statsEl.textContent = loc.stats;
        if (badgeEl) badgeEl.textContent = loc.activeNow;

        if (dotsContainer) {
            dotsContainer.innerHTML = locationsData.map((l, idx) => `
                <button type="button" class="location-pill-dot ${idx === currentLocationIndex ? 'active' : ''}" data-index="${idx}" aria-label="Go to ${l.name}"></button>
            `).join('');

            dotsContainer.querySelectorAll('.location-pill-dot').forEach(btn => {
                btn.addEventListener('click', function () {
                    const targetIdx = parseInt(this.dataset.index, 10);
                    if (!isNaN(targetIdx) && targetIdx !== currentLocationIndex) {
                        switchLocation(targetIdx);
                    }
                });
            });
        }

        renderBentoGrid();
    }

    function renderBentoGrid() {
        const mainImg = document.getElementById('bento-main-img');
        const thumbsCol = document.getElementById('bento-thumbnails-col');

        if (mainImg && currentLocationImages.length > 0) {
            mainImg.style.opacity = '0.7';
            setTimeout(() => {
                mainImg.src = currentLocationImages[0];
                mainImg.alt = `${locationsData[currentLocationIndex].name} featured view`;
                mainImg.style.opacity = '1';
            }, 120);
        }

        if (thumbsCol) {
            const sideImages = currentLocationImages.slice(1);
            thumbsCol.innerHTML = sideImages.map((imgUrl, idx) => `
                <div class="bento-thumb-item" data-thumb-index="${idx + 1}" title="Click to view in main bento view">
                    <img src="${imgUrl}" alt="${locationsData[currentLocationIndex].name} preview ${idx + 1}" loading="lazy" />
                </div>
            `).join('');

            thumbsCol.querySelectorAll('.bento-thumb-item').forEach(item => {
                item.addEventListener('click', function () {
                    const targetIndex = parseInt(this.dataset.thumbIndex, 10);
                    swapImageToMain(targetIndex);
                });
            });
        }
    }

    function swapImageToMain(clickedIndex) {
        if (clickedIndex < 1 || clickedIndex >= currentLocationImages.length) return;
        const clickedImg = currentLocationImages[clickedIndex];
        const currentMainImg = currentLocationImages[0];

        currentLocationImages[0] = clickedImg;
        currentLocationImages[clickedIndex] = currentMainImg;

        renderBentoGrid();
        restartAutoRotation();
    }

    function rotateImages() {
        if (currentLocationImages.length < 2) return;
        const first = currentLocationImages.shift();
        currentLocationImages.push(first);
        renderBentoGrid();
    }

    function startAutoRotation() {
        stopAutoRotation();
        autoRotateInterval = setInterval(rotateImages, 3000);
    }

    function stopAutoRotation() {
        if (autoRotateInterval) {
            clearInterval(autoRotateInterval);
            autoRotateInterval = null;
        }
    }

    function restartAutoRotation() {
        stopAutoRotation();
        startAutoRotation();
    }

    function switchLocation(newIndex) {
        currentLocationIndex = (newIndex + locationsData.length) % locationsData.length;
        currentLocationImages = [...locationsData[currentLocationIndex].images];
        renderLocationContent();
        restartAutoRotation();
    }

    function nextLocation() {
        switchLocation(currentLocationIndex + 1);
    }

    function prevLocation() {
        switchLocation(currentLocationIndex - 1);
    }

    function openInvitationsPage() {
        const activeLocation = locationsData[currentLocationIndex];
        const locationSelect = document.getElementById('select-inv-location');
        if (locationSelect) {
            locationSelect.value = activeLocation.name;
        }

        renderInvitationsList();

        if (window.NodeApp && window.NodeApp.navigateTo) {
            window.NodeApp.navigateTo('invitations');
        }

        setTimeout(() => {
            if (invitationsScrollStack && invitationsScrollStack.refresh) {
                invitationsScrollStack.refresh();
            }
        }, 60);
    }

    function createInvitationCardNode(inv) {
        const isFull = inv.joinedCount >= inv.capacity;
        const spotsRemaining = Math.max(0, inv.capacity - inv.joinedCount);
        const initials = (inv.hostName || 'Host')
            .trim()
            .split(' ')
            .map(w => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'H';

        const wrapper = document.createElement('div');
        wrapper.className = 'scroll-stack-invitation-card';
        wrapper.dataset.id = inv.id;
        wrapper.innerHTML = `
            <div class="ss-inv-top-bar">
                <span class="ss-inv-loc-badge">${inv.location}</span>
                <span class="ss-inv-time-badge">${inv.time}</span>
            </div>
            <div class="ss-inv-host-row">
                <div class="ss-inv-avatar">${initials}</div>
                <div class="ss-inv-host-meta">
                    <span class="ss-inv-host-label">HOSTED BY</span>
                    <strong class="ss-inv-host-name">${inv.hostName}</strong>
                    <span class="ss-inv-host-unit">${inv.hostUnit || ''}</span>
                </div>
            </div>
            <div class="ss-inv-body">
                <h3 class="ss-inv-title">${inv.title}</h3>
                ${inv.note ? `<p class="ss-inv-quote">"${inv.note}"</p>` : ''}
            </div>
            <div class="ss-inv-footer">
                <div class="ss-inv-capacity-pill">
                    <span class="ss-inv-capacity-text">${inv.joinedCount} / ${inv.capacity} Joined &bull; ${spotsRemaining} left</span>
                </div>
                <button type="button" class="ss-inv-join-btn ${inv.joinedByUser ? 'joined' : ''}" onclick="event.stopPropagation(); NodeCommunities.toggleJoin('${inv.id}')" ${isFull && !inv.joinedByUser ? 'disabled' : ''}>
                    ${inv.joinedByUser ? 'Joined' : (isFull ? 'Session Full' : 'Join Session')}
                </button>
            </div>
        `;
        return wrapper;
    }

    function renderInvitationsList() {
        const container = document.getElementById('invitations-list-container');
        const countBadge = document.getElementById('invitations-count-badge');
        if (!container) return;

        if (countBadge) {
            countBadge.textContent = `${invitations.length} Active`;
        }

        if (invitations.length === 0) {
            if (invitationsScrollStack) {
                invitationsScrollStack.destroy();
                invitationsScrollStack = null;
            }
            container.innerHTML = `
                <div style="text-align: center; padding: 2.5rem 1.5rem; color: var(--text-tertiary); background: var(--bg-surface); border-radius: var(--r-md); border: 1px dashed var(--border-hair);">
                    <p style="font-size: 0.9rem; font-weight: 500;">No community invitations posted yet. Be the first to invite your neighbors!</p>
                </div>
            `;
            return;
        }

        const cardNodes = invitations.map(inv => createInvitationCardNode(inv));

        if (invitationsScrollStack) {
            invitationsScrollStack.setItems(cardNodes);
        } else if (window.ScrollStack) {
            invitationsScrollStack = new window.ScrollStack(container, {
                items: cardNodes,
                itemDistance: 80,
                itemStackDistance: 20,
                stackPosition: '8%',
                itemScale: 0.045,
                baseScale: 0.84,
                dimAmount: 0,
                blurAmount: 0,
                tiltAmount: 0,
                rotationAmount: 0,
                holdDistance: 160,
                smoothScroll: true,
                snap: false,
                useWindowScroll: false
            });
        }
    }

    function toggleJoin(invitationId) {
        const inv = invitations.find(item => item.id === invitationId);
        if (!inv) return;

        if (inv.joinedByUser) {
            inv.joinedByUser = false;
            inv.joinedCount = Math.max(0, inv.joinedCount - 1);
            if (window.NodeApp && window.NodeApp.showToast) {
                window.NodeApp.showToast(`Left ${inv.title}`);
            }
        } else {
            if (inv.joinedCount >= inv.capacity) {
                if (window.NodeApp && window.NodeApp.showToast) {
                    window.NodeApp.showToast('This session has reached maximum capacity');
                }
                return;
            }
            inv.joinedByUser = true;
            inv.joinedCount += 1;
            if (window.NodeApp && window.NodeApp.showToast) {
                window.NodeApp.showToast(`You joined ${inv.title}!`);
            }
        }

        saveInvitations();

        const cardWrapper = document.querySelector(`.scroll-stack-invitation-card[data-id="${invitationId}"]`);
        if (cardWrapper) {
            const isFull = inv.joinedCount >= inv.capacity;
            const spotsRemaining = Math.max(0, inv.capacity - inv.joinedCount);
            const capText = cardWrapper.querySelector('.ss-inv-capacity-text');
            if (capText) {
                capText.innerHTML = `${inv.joinedCount} / ${inv.capacity} Joined &bull; ${spotsRemaining} left`;
            }

            const btn = cardWrapper.querySelector('.ss-inv-join-btn');
            if (btn) {
                btn.classList.toggle('joined', inv.joinedByUser);
                btn.textContent = inv.joinedByUser ? 'Joined' : (isFull ? 'Session Full' : 'Join Session');
                btn.disabled = isFull && !inv.joinedByUser;
            }
        } else {
            renderInvitationsList();
        }
    }

    function openCreateInvitationModal() {
        const modal = document.getElementById('create-invitation-modal');
        if (!modal) return;
        const locSelect = document.getElementById('select-inv-location');
        if (locSelect && locationsData[currentLocationIndex]) {
            locSelect.value = locationsData[currentLocationIndex].name;
        }
        modal.classList.add('active');
        const titleInput = document.getElementById('input-inv-title');
        if (titleInput) {
            setTimeout(() => titleInput.focus(), 120);
        }
    }

    function closeCreateInvitationModal() {
        const modal = document.getElementById('create-invitation-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    function handleCreateInvitation(e) {
        if (e) e.preventDefault();

        const titleInput = document.getElementById('input-inv-title');
        const locSelect = document.getElementById('select-inv-location');
        const timeInput = document.getElementById('input-inv-time');
        const capInput = document.getElementById('input-inv-capacity');
        const noteInput = document.getElementById('input-inv-note');

        const title = titleInput ? titleInput.value.trim() : '';
        const location = locSelect ? locSelect.value : 'Gym';
        const time = timeInput ? timeInput.value.trim() : '';
        const capacity = capInput ? parseInt(capInput.value, 10) || 4 : 4;
        const note = noteInput ? noteInput.value.trim() : '';

        if (!title || !time) {
            if (window.NodeApp && window.NodeApp.showToast) {
                window.NodeApp.showToast('Please fill in session title and time');
            }
            return;
        }

        let hostName = 'Resident';
        let hostUnit = '';
        if (window.NodeProfile && window.NodeProfile.getProfile) {
            const prof = window.NodeProfile.getProfile();
            if (prof && prof.nameCard) {
                hostName = prof.nameCard.fullName || prof.appearanceName || 'Resident';
                hostUnit = prof.nameCard.unit || '';
            } else if (prof && prof.appearanceName) {
                hostName = prof.appearanceName;
            }
        }

        const newInv = {
            id: `inv-${Date.now()}`,
            location: location,
            title: title,
            hostName: hostName,
            hostUnit: hostUnit,
            time: time,
            capacity: capacity,
            joinedCount: 1,
            note: note,
            joinedByUser: true
        };

        invitations.unshift(newInv);
        saveInvitations();
        renderInvitationsList();

        if (titleInput) titleInput.value = '';
        if (timeInput) timeInput.value = '';
        if (noteInput) noteInput.value = '';

        closeCreateInvitationModal();

        if (window.NodeApp && window.NodeApp.showToast) {
            window.NodeApp.showToast('Invitation created and posted!');
        }
    }

    function setupEventListeners() {
        const prevBtn = document.getElementById('btn-prev-location');
        const nextBtn = document.getElementById('btn-next-location');
        if (prevBtn) prevBtn.addEventListener('click', prevLocation);
        if (nextBtn) nextBtn.addEventListener('click', nextLocation);

        const bentoContainer = document.getElementById('bento-grid-container');
        if (bentoContainer) {
            bentoContainer.addEventListener('mouseenter', stopAutoRotation);
            bentoContainer.addEventListener('mouseleave', startAutoRotation);
        }

        const findCommunityBtn = document.getElementById('btn-find-community');
        if (findCommunityBtn) {
            findCommunityBtn.addEventListener('click', openInvitationsPage);
        }

        const backToCommBtn = document.getElementById('btn-back-to-communities');
        if (backToCommBtn) {
            backToCommBtn.addEventListener('click', () => {
                if (window.NodeApp && window.NodeApp.navigateTo) {
                    window.NodeApp.navigateTo('communities');
                }
            });
        }

        const openInvNavBtn = document.getElementById('btn-open-create-invitation-nav');
        if (openInvNavBtn) {
            openInvNavBtn.addEventListener('click', openCreateInvitationModal);
        }

        const closeInvModalBtn = document.getElementById('btn-close-create-invitation-modal');
        if (closeInvModalBtn) {
            closeInvModalBtn.addEventListener('click', closeCreateInvitationModal);
        }

        const createModal = document.getElementById('create-invitation-modal');
        if (createModal) {
            createModal.addEventListener('click', function (e) {
                if (e.target === this) {
                    closeCreateInvitationModal();
                }
            });
        }

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                closeCreateInvitationModal();
            }
        });

        const capDecreaseBtn = document.getElementById('btn-capacity-decrease');
        const capIncreaseBtn = document.getElementById('btn-capacity-increase');
        const capInput = document.getElementById('input-inv-capacity');
        const capDisplay = document.getElementById('capacity-counter-display');

        function updateCapacityDisplay(val) {
            if (capInput) capInput.value = val;
            if (capDisplay) capDisplay.textContent = `${val} people max`;
        }

        if (capDecreaseBtn) {
            capDecreaseBtn.addEventListener('click', () => {
                let current = parseInt(capInput.value, 10) || 4;
                if (current > 1) {
                    updateCapacityDisplay(current - 1);
                }
            });
        }

        if (capIncreaseBtn) {
            capIncreaseBtn.addEventListener('click', () => {
                let current = parseInt(capInput.value, 10) || 4;
                if (current < 20) {
                    updateCapacityDisplay(current + 1);
                }
            });
        }

        const form = document.getElementById('form-create-invitation');
        if (form) {
            form.addEventListener('submit', handleCreateInvitation);
        }
    }

    window.NodeCommunities = {
        init: initCommunities,
        nextLocation: nextLocation,
        prevLocation: prevLocation,
        switchLocation: switchLocation,
        swapImageToMain: swapImageToMain,
        openInvitationsPage: openInvitationsPage,
        renderInvitationsList: renderInvitationsList,
        openCreateInvitationModal: openCreateInvitationModal,
        closeCreateInvitationModal: closeCreateInvitationModal,
        toggleJoin: toggleJoin,
        handleCreateInvitation: handleCreateInvitation
    };

    document.addEventListener('DOMContentLoaded', initCommunities);
})();
