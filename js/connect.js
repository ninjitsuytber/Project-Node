(function () {
    const NEARBY_RESIDENTS = [
        {
            id: 'resident-elena',
            fullName: 'Elena Vance',
            initials: 'EV',
            unit: 'Block 4, #08-04',
            occupation: 'Senior Landscape Architect',
            distance: 3,
            location: 'Courtyard Garden',
            phone: '+1 (555) 831-2940',
            email: 'elena.vance@residence.node',
            handle: '@elena_arch',
            bio: 'Living on Floor 8. Passionate about balcony botany, tool sharing, and sustainable living.',
            helperTags: ['Plant Care', 'Book Exchange', 'Tool Sharing'],
            connected: true,
            connectedAt: 1
        },
        {
            id: 'resident-marcus',
            fullName: 'Marcus Chen',
            initials: 'MC',
            unit: 'Block 4, #05-18',
            occupation: 'Embedded Systems Engineer',
            distance: 6,
            location: 'Lobby West',
            phone: '+1 (555) 749-1022',
            email: 'marcus.chen@residence.node',
            handle: '@marcus_node',
            bio: 'Smart home enthusiast and weekend cyclist. Always glad to lend hand tools or fix smart devices.',
            helperTags: ['Tech Support', '3D Printing', 'Carpooling'],
            connected: true,
            connectedAt: 2
        },
        {
            id: 'resident-priya',
            fullName: 'Priya Patel',
            initials: 'PP',
            unit: 'Block 4, #12-02',
            occupation: 'Yoga & Wellness Instructor',
            distance: 9,
            location: 'Rooftop Lounge',
            phone: '+1 (555) 620-3388',
            email: 'priya.patel@residence.node',
            handle: '@priya_yoga',
            bio: 'Morning runner and yoga instructor. Hosting sunrise meditation sessions on the rooftop garden.',
            helperTags: ['First Aid', 'Pet Sitting', 'Plant Care'],
            connected: true,
            connectedAt: 3
        },
        {
            id: 'resident-lucas',
            fullName: 'Lucas Silva',
            initials: 'LS',
            unit: 'Block 4, #03-09',
            occupation: 'Acoustic Guitarist & Designer',
            distance: 13,
            location: 'Coffee Lounge',
            phone: '+1 (555) 412-9954',
            email: 'lucas.silva@residence.node',
            handle: '@lucas_music',
            bio: 'Acoustic music lover on Floor 3. Always up for friendly terrace jam sessions and weekend cycling.',
            helperTags: ['Pet Sitting', 'Tool Sharing'],
            connected: false
        },
        {
            id: 'resident-clara',
            fullName: 'Clara Oswald',
            initials: 'CO',
            unit: 'Block 2, #14-01',
            occupation: 'Urban Planner',
            distance: 28,
            location: 'Far Park West',
            phone: '+1 (555) 902-1144',
            email: 'clara@residence.node',
            handle: '@clara_o',
            bio: 'Urban planner.',
            helperTags: ['Tool Sharing'],
            connected: false
        }
    ];

    let pendingTargetResident = null;
    let gpsWatchActive = false;
    let stackInstance = null;
    let activeResidentIndex = 0;
    let currentStackLayout = 'fan';
    let airdropPeerHoloInstance = null;
    let connectedStackInstance = null;
    let inspectHoloCardInstance = null;
    let isInspectingConnectedCard = false;
    let lastInspectOpenTime = 0;

    function getNearbyResidentsWithinRange(maxMeters = 15) {
        return NEARBY_RESIDENTS.filter(r => r.distance <= maxMeters);
    }

    function renderActionBar() {
        const barContainer = document.getElementById('nearby-stack-action-bar');
        if (!barContainer) return;

        const inRangeList = getNearbyResidentsWithinRange(15);
        if (!inRangeList.length) {
            barContainer.innerHTML = '';
            return;
        }

        const activeRes = inRangeList[activeResidentIndex] || inRangeList[0];

        barContainer.innerHTML = `
            <div class="nearby-active-card-meta">
                <div class="nearby-active-left">
                    <div class="nearby-active-name-row">
                        <span class="nearby-active-name">${activeRes.fullName}</span>
                    </div>
                    <p class="nearby-active-sub">${activeRes.unit} &bull; ${activeRes.occupation}</p>
                </div>
                <div class="nearby-active-right">
                    <div class="nearby-distance-tag">
                        <span>${activeRes.distance}m &bull; ${activeRes.location}</span>
                    </div>
                </div>
            </div>

            <div class="nearby-active-action-row">
                ${activeRes.connected ? `
                    <span class="connected-badge large">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                        </svg>
                        <span>Connected</span>
                    </span>
                ` : `
                    <button type="button" class="btn-connect-request large" id="btn-stack-request-connect" data-target-id="${activeRes.id}">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                        <span>Request Connect</span>
                    </button>
                `}
            </div>

            <div class="nearby-stack-gesture-hint">
                <span>Swipe card to browse &bull; Tap card to connect</span>
            </div>
        `;

        const connectBtn = barContainer.querySelector('#btn-stack-request-connect');
        if (connectBtn) {
            connectBtn.addEventListener('click', function () {
                promptConnectionFlow(this.dataset.targetId);
            });
        }
    }

    function renderNearbyStack() {
        const stackContainer = document.getElementById('nearby-cards-stack');
        if (!stackContainer) return;

        const inRangeList = getNearbyResidentsWithinRange(15);
        const counterPill = document.getElementById('nearby-counter-pill');
        if (counterPill) {
            counterPill.textContent = `${inRangeList.length} nearby`;
        }

        inRangeList.forEach(res => {
            if (!res.cardFrontDataUrl && window.NodeProfile && window.NodeProfile.generateResidentCardFront) {
                res.cardFrontDataUrl = window.NodeProfile.generateResidentCardFront({ nameCard: res });
            }
        });

        const cardNodes = inRangeList.map((resident, idx) => {
            const img = document.createElement('img');
            img.src = resident.cardFrontDataUrl || '';
            img.alt = resident.fullName;
            img.draggable = false;
            return img;
        });

        const handleNearbyCardClick = topIndex => {
            const list = getNearbyResidentsWithinRange(15);
            const resident = list[topIndex];
            if (resident) {
                promptConnectionFlow(resident.id);
            }
        };

        if (stackInstance) {
            stackInstance.options.onCardClick = handleNearbyCardClick;
            stackInstance.options.onChange = newTopIndex => {
                activeResidentIndex = newTopIndex;
                renderActionBar();
            };
            stackInstance.setCards(cardNodes);
        } else if (window.Stack) {
            stackInstance = new window.Stack(stackContainer, {
                cards: cardNodes,
                layout: currentStackLayout,
                visible: 4,
                spread: 0.5,
                depth: 0.5,
                radius: 14,
                frame: 0,
                frameColor: '#ffffff',
                shadow: true,
                tilt: 28,
                threshold: 85,
                speed: 1,
                sendToBackOnClick: false,
                onChange: newTopIndex => {
                    activeResidentIndex = newTopIndex;
                    renderActionBar();
                },
                onCardClick: handleNearbyCardClick
            });
        }

        renderActionBar();
    }

    function promptConnectionFlow(residentId) {
        const resident = NEARBY_RESIDENTS.find(r => r.id === residentId);
        if (!resident) return;

        pendingTargetResident = resident;

        if (window.NodeApp && window.NodeApp.showToast) {
            window.NodeApp.showToast(`Requesting NameDrop connection with ${resident.fullName} (${resident.distance}m away)...`);
        }

        setTimeout(() => {
            openIncomingRequestModal(resident);
        }, 550);
    }

    function openIncomingRequestModal(resident) {
        const modal = document.getElementById('connect-request-modal');
        if (!modal) return;

        const avatar = document.getElementById('incoming-request-avatar');
        const name = document.getElementById('incoming-request-name');
        const dist = document.getElementById('incoming-request-distance');

        if (avatar) avatar.textContent = resident.initials;
        if (name) name.textContent = resident.fullName;
        if (dist) dist.textContent = `${resident.distance}m away • ${resident.location}`;

        modal.classList.add('active');
    }

    function closeIncomingRequestModal() {
        const modal = document.getElementById('connect-request-modal');
        if (modal) modal.classList.remove('active');
    }

    function handleDeclineConnect() {
        closeIncomingRequestModal();
        if (window.NodeApp && window.NodeApp.showToast) {
            window.NodeApp.showToast('Connection declined. Nothing was shared.');
        }
        pendingTargetResident = null;
    }

    function handleAcceptConnect() {
        if (!pendingTargetResident) return;
        const target = pendingTargetResident;
        closeIncomingRequestModal();
        triggerAirDropAnimation(target);
    }

    function triggerAirDropAnimation(peer) {
        const overlay = document.getElementById('airdrop-transfer-overlay');
        if (!overlay) return;

        pendingTargetResident = peer;
        peer.connected = true;
        peer.connectedAt = Date.now();
        renderNearbyStack();
        renderConnectedStack();

        let myProfile = {};
        if (window.NodeProfile && window.NodeProfile.getProfile) {
            myProfile = window.NodeProfile.getProfile();
        }

        const myFrontUrl = window.NodeProfile && window.NodeProfile.generateResidentCardFront
            ? window.NodeProfile.generateResidentCardFront(myProfile)
            : '';

        const peerFrontUrl = peer.cardFrontDataUrl || (window.NodeProfile && window.NodeProfile.generateResidentCardFront
            ? window.NodeProfile.generateResidentCardFront({ nameCard: peer })
            : '');

        const peerBackUrl = window.NodeProfile && window.NodeProfile.generateResidentCardBack
            ? window.NodeProfile.generateResidentCardBack({ nameCard: peer })
            : '';

        const userCardBox = document.getElementById('airdrop-user-card-content');
        if (userCardBox) {
            userCardBox.innerHTML = `
                <div class="airdrop-rendered-pass-frame">
                    <img src="${myFrontUrl}" alt="Your Resident Pass" draggable="false" />
                </div>
            `;
        }

        const connectedText = document.getElementById('airdrop-connected-peer-text');
        if (connectedText) {
            connectedText.textContent = `Connected with ${peer.fullName}`;
        }

        if (airdropPeerHoloInstance) {
            airdropPeerHoloInstance.destroy();
            airdropPeerHoloInstance = null;
        }

        const peerCardContainer = document.getElementById('airdrop-peer-card-holocard');
        if (peerCardContainer) {
            peerCardContainer.innerHTML = '';
            const cardW = window.innerWidth <= 360 ? 288 : 320;
            const preset = localStorage.getItem('node_holo_preset') || (myProfile.nameCard && myProfile.nameCard.holoPreset) || 'bursts';

            if (window.HoloCard) {
                const holoOpts = {
                    image: peerFrontUrl,
                    backImage: peerBackUrl,
                    preset: preset,
                    width: cardW,
                    radius: 14,
                    glare: 0.55,
                    tiltMax: 14,
                    hoverScale: 1.04,
                    shadow: true,
                    idle: true
                };
                if (typeof window.HoloCard.init === 'function') {
                    airdropPeerHoloInstance = window.HoloCard.init(peerCardContainer, holoOpts);
                } else if (typeof window.HoloCard === 'function') {
                    airdropPeerHoloInstance = new window.HoloCard(peerCardContainer, holoOpts);
                }
            }
        }

        overlay.className = 'airdrop-overlay active phase-user-center';

        setTimeout(() => {
            overlay.classList.add('phase-user-exit');
        }, 850);

        setTimeout(() => {
            overlay.classList.add('phase-liquid-ripple');
            if (navigator.vibrate) {
                try {
                    navigator.vibrate([30, 40, 60, 40, 70]);
                } catch (e) {}
            }
        }, 1300);

        setTimeout(() => {
            overlay.classList.add('phase-peer-enter');
        }, 1650);

        setTimeout(() => {
            overlay.classList.add('phase-peer-settled');
        }, 2350);

        if (window.NodeApp && window.NodeApp.showToast) {
            window.NodeApp.showToast(`AirDrop Connected with ${peer.fullName}!`);
        }
    }

    function closeAirDropAnimation() {
        const overlay = document.getElementById('airdrop-transfer-overlay');
        if (!overlay) return;
        overlay.classList.add('closing');
        setTimeout(() => {
            overlay.className = 'airdrop-overlay';
            if (airdropPeerHoloInstance) {
                airdropPeerHoloInstance.destroy();
                airdropPeerHoloInstance = null;
            }
        }, 320);
    }

    function initGpsLocation() {
        if (gpsWatchActive) return;
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                () => {
                    gpsWatchActive = true;
                },
                () => {
                    gpsWatchActive = true;
                },
                { timeout: 4000 }
            );
        }
    }

    function getConnectedResidentsList() {
        return NEARBY_RESIDENTS.filter(r => r.connected).sort((a, b) => (b.connectedAt || 0) - (a.connectedAt || 0));
    }

    function getUserHoloPreset() {
        if (window.NodeProfile && typeof window.NodeProfile.getHoloPreset === 'function') {
            return window.NodeProfile.getHoloPreset();
        }
        return localStorage.getItem('node_holo_preset') || 'bursts';
    }

    function renderConnectedStack() {
        const stackContainer = document.getElementById('connected-cards-stack');
        if (!stackContainer) return;

        const stage = document.getElementById('connected-residents-stage');
        const userPreset = getUserHoloPreset();
        if (stage) {
            stage.dataset.holoPreset = userPreset;
        }

        const connectedList = getConnectedResidentsList();
        const counterPill = document.getElementById('connected-counter-pill');
        if (counterPill) {
            counterPill.textContent = `${connectedList.length} connected`;
        }

        connectedList.forEach(res => {
            if (!res.cardFrontDataUrl && window.NodeProfile && window.NodeProfile.generateResidentCardFront) {
                res.cardFrontDataUrl = window.NodeProfile.generateResidentCardFront({ nameCard: res });
            }
            if (!res.cardBackDataUrl && window.NodeProfile && window.NodeProfile.generateResidentCardBack) {
                res.cardBackDataUrl = window.NodeProfile.generateResidentCardBack({ nameCard: res });
            }
        });

        const cardNodes = connectedList.map(resident => {
            const img = document.createElement('img');
            img.src = resident.cardFrontDataUrl || '';
            img.alt = resident.fullName;
            img.draggable = false;
            return img;
        });

        const handleConnectedCardClick = topIndex => {
            const list = getConnectedResidentsList();
            const resident = list[topIndex];
            if (resident) {
                openInspectConnectedCard(resident);
            }
        };

        if (connectedStackInstance) {
            connectedStackInstance.options.onCardClick = handleConnectedCardClick;
            connectedStackInstance.setCards(cardNodes);
        } else if (window.Stack) {
            connectedStackInstance = new window.Stack(stackContainer, {
                cards: cardNodes,
                layout: currentStackLayout,
                visible: 4,
                spread: 0.5,
                depth: 0.5,
                radius: 14,
                frame: 0,
                frameColor: '#ffffff',
                shadow: true,
                tilt: 28,
                threshold: 85,
                speed: 1,
                sendToBackOnClick: false,
                onCardClick: handleConnectedCardClick
            });
        }
    }

    function openInspectConnectedCard(resident) {
        if (!resident) return;
        const now = Date.now();
        if (now - lastInspectOpenTime < 450) return;
        lastInspectOpenTime = now;

        const stage = document.getElementById('connected-residents-stage');
        const inspectContainer = document.getElementById('connected-inspect-holocard');
        if (!stage || !inspectContainer) return;

        const userPreset = getUserHoloPreset();
        stage.dataset.holoPreset = userPreset;

        if (inspectHoloCardInstance) {
            inspectHoloCardInstance.destroy();
            inspectHoloCardInstance = null;
        }

        inspectContainer.innerHTML = '';
        inspectContainer.removeAttribute('aria-pressed');
        inspectContainer.style.pointerEvents = 'none';

        const frontUrl = resident.cardFrontDataUrl || (window.NodeProfile ? window.NodeProfile.generateResidentCardFront({ nameCard: resident }) : '');
        const backUrl = resident.cardBackDataUrl || (window.NodeProfile ? window.NodeProfile.generateResidentCardBack({ nameCard: resident }) : '');
        const cardW = window.innerWidth <= 380 ? 304 : 340;

        if (window.HoloCard) {
            const holoOpts = {
                image: frontUrl,
                backImage: backUrl,
                alt: `${resident.fullName} Resident Card`,
                preset: userPreset,
                width: cardW,
                ratio: 1.6,
                radius: 14,
                intensity: 0.85,
                frame: 4,
                glare: 0.55,
                scale: 1,
                tiltMax: 14,
                hoverScale: 1.04,
                shadow: true,
                idle: true
            };
            if (typeof window.HoloCard.init === 'function') {
                inspectHoloCardInstance = window.HoloCard.init(inspectContainer, holoOpts);
            } else if (typeof window.HoloCard === 'function') {
                inspectHoloCardInstance = new window.HoloCard(inspectContainer, holoOpts);
            }
            if (inspectHoloCardInstance && typeof inspectHoloCardInstance.reset === 'function') {
                inspectHoloCardInstance.reset();
            }
        }

        stage.classList.add('is-inspecting');
        setTimeout(() => {
            isInspectingConnectedCard = true;
            if (inspectContainer) {
                inspectContainer.style.pointerEvents = 'auto';
            }
        }, 350);
    }

    function closeInspectConnectedCard() {
        if (!isInspectingConnectedCard) return;
        const stage = document.getElementById('connected-residents-stage');
        const inspectContainer = document.getElementById('connected-inspect-holocard');
        if (!stage) return;

        if (inspectContainer) {
            inspectContainer.style.pointerEvents = 'none';
        }
        isInspectingConnectedCard = false;
        stage.classList.remove('is-inspecting');

        setTimeout(() => {
            if (!isInspectingConnectedCard && inspectHoloCardInstance) {
                inspectHoloCardInstance.destroy();
                inspectHoloCardInstance = null;
                if (inspectContainer) inspectContainer.innerHTML = '';
            }
        }, 400);
    }

    function initConnectedResidentsView() {
        closeInspectConnectedCard();
        renderConnectedStack();
    }

    function initConnectView() {
        initGpsLocation();
        renderNearbyStack();
        if (window.NodeProfile && window.NodeProfile.renderConnectHoloCard) {
            window.NodeProfile.renderConnectHoloCard();
        } else if (window.NodeProfile && window.NodeProfile.renderHoloCardPreview) {
            window.NodeProfile.renderHoloCardPreview();
        }
    }

    function setupEventListeners() {
        const declineBtn = document.getElementById('btn-decline-connect');
        if (declineBtn) {
            declineBtn.addEventListener('click', handleDeclineConnect);
        }

        const acceptBtn = document.getElementById('btn-accept-connect');
        if (acceptBtn) {
            acceptBtn.addEventListener('click', handleAcceptConnect);
        }

        const overlay = document.getElementById('airdrop-transfer-overlay');
        if (overlay) {
            overlay.addEventListener('click', function (e) {
                if (!e.target.closest('#airdrop-peer-card-holocard') && !e.target.closest('#airdrop-user-card-flyer')) {
                    closeAirDropAnimation();
                }
            });
        }

        const connectModal = document.getElementById('connect-request-modal');
        if (connectModal) {
            connectModal.addEventListener('click', function (e) {
                if (e.target === this) {
                    closeIncomingRequestModal();
                    pendingTargetResident = null;
                }
            });
        }

        const openConnectedBtn = document.getElementById('btn-open-connected-residents');
        if (openConnectedBtn) {
            openConnectedBtn.addEventListener('click', () => {
                if (window.NodeApp && window.NodeApp.navigateTo) {
                    window.NodeApp.navigateTo('connected-residents');
                }
            });
        }

        const backFromConnectedBtn = document.getElementById('btn-back-to-connect-from-connected');
        if (backFromConnectedBtn) {
            backFromConnectedBtn.addEventListener('click', () => {
                if (window.NodeApp && window.NodeApp.navigateTo) {
                    window.NodeApp.navigateTo('connect');
                }
            });
        }

        const connectedView = document.getElementById('view-connected-residents');
        if (connectedView) {
            connectedView.addEventListener('click', function (e) {
                if (!isInspectingConnectedCard) return;
                if (e.target.closest('#connected-inspect-holocard') || e.target.closest('#connected-cards-stack')) {
                    return;
                }
                closeInspectConnectedCard();
            });
        }
    }

    window.NodeConnect = {
        initConnectView: initConnectView,
        renderNearbyStack: renderNearbyStack,
        getNearbyResidents: getNearbyResidentsWithinRange,
        triggerAirDropAnimation: triggerAirDropAnimation,
        initConnectedResidentsView: initConnectedResidentsView,
        renderConnectedStack: renderConnectedStack,
        closeInspectConnectedCard: closeInspectConnectedCard
    };

    document.addEventListener('click', function (e) {
        const btn = e.target.closest('#btn-open-connected-residents');
        if (btn) {
            if (window.NodeApp && window.NodeApp.navigateTo) {
                window.NodeApp.navigateTo('connected-residents');
            }
        }
        const backBtn = e.target.closest('#btn-back-to-connect-from-connected');
        if (backBtn) {
            if (window.NodeApp && window.NodeApp.navigateTo) {
                window.NodeApp.navigateTo('connect');
            }
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setupEventListeners();
            renderNearbyStack();
        });
    } else {
        setupEventListeners();
        renderNearbyStack();
    }
})();
