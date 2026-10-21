(function () {
    let refreshing = false;
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            reg.update().catch(() => {});
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    reg.update().catch(() => {});
                }
            });
        }).catch(() => {});

        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                refreshing = true;
                window.location.reload();
            }
        });

        navigator.serviceWorker.addEventListener('message', e => {
            if (e.data && e.data.type === 'SW_UPDATED') {
                if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                }
            }
        });
    }

    let deferredPrompt = null;

    window.addEventListener('beforeinstallprompt', e => {
        deferredPrompt = e;
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        if (window.NodeApp && window.NodeApp.showToast) {
            window.NodeApp.showToast('Project Node installed to your home screen!');
        }
    });

    window.ProjectNodePWA = {
        getPrompt: () => deferredPrompt,
        promptInstall: () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
            }
        }
    };
})();
