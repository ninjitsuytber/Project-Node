

(function () {
    let currentView = 'home';
    let toastTimeout = null;

    
    function navigateTo(viewName) {
        currentView = viewName;
        document.body.classList.toggle('view-invitations-active', viewName === 'invitations');
        document.body.classList.toggle('view-connected-residents-active', viewName === 'connected-residents');

        
        document.querySelectorAll('.app-view').forEach(view => {
            view.classList.remove('active');
        });

        const targetView = document.getElementById(`view-${viewName}`);
        if (targetView) {
            targetView.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        
        document.querySelectorAll('nav.bottom-nav ul li a').forEach(link => {
            const matches = link.dataset.target === viewName || (viewName === 'connected-residents' && link.dataset.target === 'connect');
            link.classList.toggle('active', matches);
        });

        if (viewName === 'settings' && window.NodeProfile) {
            window.NodeProfile.loadProfile();
        }
        if (viewName === 'connect') {
            if (window.NodeProfile && window.NodeProfile.renderConnectHoloCard) {
                window.NodeProfile.renderConnectHoloCard();
            } else if (window.NodeProfile && window.NodeProfile.renderHoloCardPreview) {
                window.NodeProfile.renderHoloCardPreview();
            }
            if (window.NodeConnect && window.NodeConnect.initConnectView) {
                window.NodeConnect.initConnectView();
            }
        }
        if (viewName === 'connected-residents') {
            if (window.NodeConnect && window.NodeConnect.initConnectedResidentsView) {
                window.NodeConnect.initConnectedResidentsView();
            }
        }
        if (viewName === 'card-preview') {
            if (window.NodeProfile && window.NodeProfile.renderPreviewHoloCard) {
                window.NodeProfile.renderPreviewHoloCard();
            }
        }
        if (viewName === 'invitations') {
            if (window.NodeCommunities && window.NodeCommunities.renderInvitationsList) {
                window.NodeCommunities.renderInvitationsList();
            }
        }
    }

    
    function showToast(message) {
        let toastEl = document.getElementById('global-toast');
        if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.id = 'global-toast';
            toastEl.className = 'toast-notice';
            document.body.appendChild(toastEl);
        }

        toastEl.textContent = message;
        toastEl.classList.add('show');

        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toastEl.classList.remove('show');
        }, 3200);
    }

    
    function setupRouting() {
        
        const profileBtn = document.getElementById('profile-btn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => {
                navigateTo('settings');
            });
        }

        
        const backToHomeBtn = document.getElementById('btn-back-to-home');
        if (backToHomeBtn) {
            backToHomeBtn.addEventListener('click', () => {
                navigateTo('home');
            });
        }

        
        document.querySelectorAll('nav.bottom-nav ul li a').forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const target = this.dataset.target;

                if (target === 'home') {
                    navigateTo('home');
                } else if (target === 'communities') {
                    navigateTo('communities');
                } else if (target === 'connect') {
                    navigateTo('connect');
                } else if (target === 'settings') {
                    navigateTo('settings');
                }
            });
        });

        const connectToProfileBtn = document.getElementById('btn-open-settings-from-connect');
        if (connectToProfileBtn) {
            connectToProfileBtn.addEventListener('click', () => {
                navigateTo('settings');
            });
        }

        const backFromConnectBtn = document.getElementById('btn-back-to-home-from-connect');
        if (backFromConnectBtn) {
            backFromConnectBtn.addEventListener('click', () => {
                navigateTo('home');
            });
        }

        
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', function (e) {
                if (e.target === this) {
                    this.classList.remove('active');
                }
            });
        });

        const initialHash = window.location.hash.replace('#', '');
        if (initialHash && ['home', 'communities', 'connect', 'settings', 'card-preview', 'invitations', 'connected-residents'].includes(initialHash)) {
            navigateTo(initialHash);
        }

        window.addEventListener('hashchange', () => {
            const h = window.location.hash.replace('#', '');
            if (h && ['home', 'communities', 'connect', 'settings', 'card-preview', 'invitations', 'connected-residents'].includes(h)) {
                navigateTo(h);
            }
        });
    }

    function initLaunchScreen() {
        const screen = document.getElementById('app-loading-screen');
        const iconBox = document.getElementById('launch-icon-box');
        const appName = document.getElementById('launch-app-name');
        if (!screen || !iconBox) return;

        setTimeout(() => {
            if (appName) {
                appName.classList.add('hiding');
            }
            iconBox.classList.add('zooming');
            setTimeout(() => {
                screen.classList.add('fade-out');
                setTimeout(() => {
                    screen.style.display = 'none';
                    if (screen.parentNode) {
                        screen.parentNode.removeChild(screen);
                    }
                }, 380);
            }, 320);
        }, 1850);
    }

    window.NodeApp = {
        navigateTo: navigateTo,
        showToast: showToast,
        getCurrentView: () => currentView
    };

    document.addEventListener('click', function (e) {
        if (e.target.closest('#btn-open-connected-residents')) {
            navigateTo('connected-residents');
        } else if (e.target.closest('#btn-back-to-connect-from-connected')) {
            navigateTo('connect');
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setupRouting();
            initLaunchScreen();
        });
    } else {
        setupRouting();
        initLaunchScreen();
    }
})();
