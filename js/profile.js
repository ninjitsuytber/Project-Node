

(function () {
    const STORAGE_KEY = 'project_node_user_profile';

    
    const defaultProfile = {
        appearanceName: 'Alex Rivera',
        nameCard: {
            fullName: 'Alex Rivera',
            phone: '+1 (555) 392-8192',
            unit: 'Block 4, #07-12',
            occupation: 'Landscape Designer',
            bio: 'Living in Block 4 since 2022. Weekend cyclist and urban gardener. Always glad to lend tools or help neighbors.',
            email: 'alex.rivera@residence.node',
            handle: '@alex_rivera',
            helperTags: ['Tool Sharing', 'Plant Care', 'Pet Sitting']
        }
    };

    let currentProfile = {};
    let connectHoloCardInstance = null;
    let previewHoloCardInstance = null;
    let currentPreset = 'bursts';

    function loadProfile() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                currentProfile = JSON.parse(raw);
            } else {
                currentProfile = JSON.parse(JSON.stringify(defaultProfile));
                saveToStorage();
            }
        } catch (e) {
            console.error('Error loading profile:', e);
            currentProfile = JSON.parse(JSON.stringify(defaultProfile));
        }

        const savedPreset = (currentProfile && currentProfile.nameCard && currentProfile.nameCard.holoPreset) || localStorage.getItem('node_holo_preset');
        if (savedPreset) {
            currentPreset = savedPreset;
        }

        renderGreeting();
        populateFormFields();
        renderCardPreview();
    }

    function saveToStorage() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentProfile));
    }

    function renderGreeting() {
        const usernameEl = document.getElementById('welcome-username');
        if (usernameEl) {
            usernameEl.textContent = currentProfile.appearanceName || 'Resident';
        }
    }

    function populateFormFields() {
        const appearanceInput = document.getElementById('input-appearance-name');
        const nameInput = document.getElementById('input-card-fullname');
        const phoneInput = document.getElementById('input-card-phone');
        const unitInput = document.getElementById('input-card-unit');
        const occInput = document.getElementById('input-card-occupation');
        const bioInput = document.getElementById('input-card-bio');
        const emailInput = document.getElementById('input-card-email');
        const handleInput = document.getElementById('input-card-handle');

        if (appearanceInput) appearanceInput.value = currentProfile.appearanceName || '';
        if (nameInput) nameInput.value = currentProfile.nameCard.fullName || '';
        if (phoneInput) phoneInput.value = currentProfile.nameCard.phone || '';
        if (unitInput) unitInput.value = currentProfile.nameCard.unit || '';
        if (occInput) occInput.value = currentProfile.nameCard.occupation || '';
        if (bioInput) bioInput.value = currentProfile.nameCard.bio || '';
        if (emailInput) emailInput.value = currentProfile.nameCard.email || '';
        if (handleInput) handleInput.value = currentProfile.nameCard.handle || '';

        document.querySelectorAll('.skill-tag-btn').forEach(btn => {
            const tag = btn.dataset.tag;
            const isSelected = (currentProfile.nameCard.helperTags || []).includes(tag);
            btn.classList.toggle('selected', isSelected);
        });
    }

    function renderCardPreview() {
        const nc = currentProfile.nameCard;

        const initials = (nc.fullName || 'Resident')
            .trim()
            .split(' ')
            .map(w => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'R';

        const previewAvatar = document.getElementById('preview-card-avatar');
        const previewName = document.getElementById('preview-card-name');
        const previewUnit = document.getElementById('preview-card-unit');
        const previewOcc = document.getElementById('preview-card-occupation');
        const previewPhone = document.getElementById('preview-card-phone');
        const previewEmail = document.getElementById('preview-card-email');
        const previewBio = document.getElementById('preview-card-bio');
        const previewTags = document.getElementById('preview-card-tags');

        if (previewAvatar) previewAvatar.textContent = initials;
        if (previewName) previewName.textContent = nc.fullName || 'Resident Name';
        if (previewUnit) {
            previewUnit.textContent = nc.unit || 'Residential Member';
            previewUnit.style.display = nc.unit ? 'block' : 'none';
        }
        if (previewOcc) {
            previewOcc.textContent = nc.occupation || '';
            previewOcc.style.display = nc.occupation ? 'block' : 'none';
        }
        if (previewPhone) previewPhone.textContent = nc.phone || 'Phone required';

        if (previewEmail) {
            if (nc.email) {
                previewEmail.textContent = nc.email;
                if (previewEmail.parentElement) previewEmail.parentElement.style.display = 'flex';
            } else {
                if (previewEmail.parentElement) previewEmail.parentElement.style.display = 'none';
            }
        }

        if (previewBio) {
            if (nc.bio) {
                previewBio.textContent = `"${nc.bio}"`;
                previewBio.style.display = 'block';
            } else {
                previewBio.style.display = 'none';
            }
        }

        if (previewTags) {
            const tags = nc.helperTags || [];
            if (tags.length > 0) {
                previewTags.innerHTML = tags.map(t => `<span class="card-skill-tag">${t}</span>`).join('');
                previewTags.style.display = 'flex';
            } else {
                previewTags.innerHTML = '';
                previewTags.style.display = 'none';
            }
        }

        const front = generateResidentCardFront(currentProfile);
        const back = generateResidentCardBack(currentProfile);
        if (connectHoloCardInstance) {
            connectHoloCardInstance.setImage(front, back);
        }
        if (previewHoloCardInstance) {
            previewHoloCardInstance.setImage(front, back);
        }
    }

    function validateProfileForm() {
        let isValid = true;

        const nameInput = document.getElementById('input-card-fullname');
        const phoneInput = document.getElementById('input-card-phone');
        const nameErr = document.getElementById('error-card-fullname');
        const phoneErr = document.getElementById('error-card-phone');

        if (!nameInput.value.trim()) {
            nameInput.classList.add('error');
            if (nameErr) nameErr.classList.add('visible');
            isValid = false;
        } else {
            nameInput.classList.remove('error');
            if (nameErr) nameErr.classList.remove('visible');
        }

        if (!phoneInput.value.trim()) {
            phoneInput.classList.add('error');
            if (phoneErr) phoneErr.classList.add('visible');
            isValid = false;
        } else {
            phoneInput.classList.remove('error');
            if (phoneErr) phoneErr.classList.remove('visible');
        }

        return isValid;
    }

    function handleSaveProfile() {
        if (!validateProfileForm()) {
            if (window.NodeApp && window.NodeApp.showToast) {
                window.NodeApp.showToast('Please enter both Full Name and Phone Number');
            }
            return false;
        }

        const appearanceInput = document.getElementById('input-appearance-name');
        const nameInput = document.getElementById('input-card-fullname');
        const phoneInput = document.getElementById('input-card-phone');
        const unitInput = document.getElementById('input-card-unit');
        const occInput = document.getElementById('input-card-occupation');
        const bioInput = document.getElementById('input-card-bio');
        const emailInput = document.getElementById('input-card-email');
        const handleInput = document.getElementById('input-card-handle');

        const selectedTags = [];
        document.querySelectorAll('.skill-tag-btn.selected').forEach(btn => {
            selectedTags.push(btn.dataset.tag);
        });

        currentProfile.appearanceName = appearanceInput.value.trim() || nameInput.value.trim() || 'Resident';
        currentProfile.nameCard = {
            fullName: nameInput.value.trim(),
            phone: phoneInput.value.trim(),
            unit: unitInput.value.trim(),
            occupation: occInput.value.trim(),
            bio: bioInput.value.trim(),
            email: emailInput.value.trim(),
            handle: handleInput.value.trim(),
            helperTags: selectedTags
        };

        saveToStorage();
        renderGreeting();
        renderCardPreview();

        if (window.NodeApp && window.NodeApp.showToast) {
            window.NodeApp.showToast('Profile and resident card saved');
        }

        syncWithBackend(currentProfile);
        return true;
    }

    function syncWithBackend(profile) {
        fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile)
        }).catch(() => {});
    }

    function generateVCardData() {
        const nc = currentProfile.nameCard;
        return [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${nc.fullName}`,
            `TEL;TYPE=CELL:${nc.phone}`,
            nc.email ? `EMAIL:${nc.email}` : '',
            nc.occupation ? `TITLE:${nc.occupation}` : '',
            nc.unit ? `NOTE:Unit: ${nc.unit}\\nBio: ${nc.bio || ''}` : '',
            'END:VCARD'
        ].filter(Boolean).join('\r\n');
    }

    function downloadVCard() {
        const vcardData = generateVCardData();
        const blob = new Blob([vcardData], { type: 'text/vcard;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(currentProfile.nameCard.fullName || 'Resident').replace(/\s+/g, '_')}_Card.vcf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function drawRoundedRect(ctx, x, y, width, height, radius) {
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, radius);
            return;
        }
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.lineTo(x + radius, y + height);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + width, y, radius);
        ctx.closePath();
    }

        function drawNodeFaviconIcon(ctx, cx, cy, size, color) {
        ctx.save();
        ctx.translate(cx, cy);
        const s = size / 960;
        ctx.scale(s, s);
        ctx.translate(-480, 480);
        ctx.strokeStyle = color;
        ctx.lineWidth = 80;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.arc(280, -680, 120, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(680, -280, 120, 0, Math.PI * 2);
        ctx.stroke();

        const connectorPath = new Path2D('M 210,-542 L 134,-415 C 105,-365 130,-285 190,-280 C 225,-277 252,-288 270,-300 L 690,-660 C 708,-672 735,-683 770,-680 C 830,-675 855,-595 826,-545 L 750,-418');
        ctx.stroke(connectorPath);
        ctx.restore();
    }

    function generateResidentCardFront(profile) {
        const nc = (profile && profile.nameCard) ? profile.nameCard : {};
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 500;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 800, 500);

        const bgGrad = ctx.createLinearGradient(0, 0, 800, 500);
        bgGrad.addColorStop(0, '#ffffff');
        bgGrad.addColorStop(0.5, '#fafafa');
        bgGrad.addColorStop(1, '#f2f2f4');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 800, 500);

        ctx.save();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.03)';
        ctx.lineWidth = 1;
        for (let i = 40; i < 800; i += 32) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 500);
            ctx.stroke();
        }
        for (let j = 40; j < 500; j += 32) {
            ctx.beginPath();
            ctx.moveTo(0, j);
            ctx.lineTo(800, j);
            ctx.stroke();
        }
        ctx.restore();

        drawRoundedRect(ctx, 24, 24, 752, 452, 22);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();

        drawRoundedRect(ctx, 32, 32, 736, 436, 16);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();

        drawNodeFaviconIcon(ctx, 62, 62, 22, '#000000');

        ctx.fillStyle = '#000000';
        ctx.font = '700 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('PROJECT NODE', 82, 68);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('RESIDENTIAL IDENTITY PASS', 212, 68);

        const badgeText = 'Resident';
        ctx.font = '700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const badgeTextWidth = ctx.measureText(badgeText).width;
        const badgeW = Math.round(badgeTextWidth + 24);
        const badgeX = 750 - badgeW;

        drawRoundedRect(ctx, badgeX, 48, badgeW, 28, 14);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.fillText(badgeText, badgeX + (badgeW / 2), 66);
        ctx.textAlign = 'left';

        ctx.beginPath();
        ctx.arc(114, 185, 52, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();

        const initials = (nc.fullName || 'Resident')
            .trim()
            .split(' ')
            .map(w => w[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'R';

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, 114, 185);

        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';

        ctx.fillStyle = '#000000';
        ctx.font = '700 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(nc.fullName || 'Resident Member', 190, 168);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.font = '600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(nc.unit || 'Residential Community Member', 190, 198);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.font = '500 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(nc.occupation || 'Project Node Resident', 190, 224);

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(60, 270);
        ctx.lineTo(740, 270);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.font = '700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('PHONE CONTACT', 62, 302);
        ctx.fillStyle = '#000000';
        ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(nc.phone || 'Required Phone', 62, 328);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.font = '700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('EMAIL ADDRESS', 310, 302);
        ctx.fillStyle = '#000000';
        ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(nc.email || 'None registered', 310, 328);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.font = '700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('HANDLE', 570, 302);
        ctx.fillStyle = '#000000';
        ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(nc.handle || '@resident', 570, 328);

        const tags = nc.helperTags && nc.helperTags.length ? nc.helperTags : ['Resident Member'];
        let tagX = 62;
        ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        tags.slice(0, 4).forEach(tag => {
            const textWidth = ctx.measureText(tag).width;
            const pillW = textWidth + 24;
            drawRoundedRect(ctx, tagX, 362, pillW, 26, 13);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.fillStyle = '#000000';
            ctx.fillText(tag, tagX + 12, 379);
            tagX += pillW + 10;
        });

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(60, 420);
        ctx.lineTo(740, 420);
        ctx.stroke();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Node Pass - Tap Card To Flip', 62, 446);

        ctx.textAlign = 'right';
        ctx.fillText('AUTHENTIC RESIDENT PROFILE', 738, 446);

        return canvas.toDataURL('image/png');
    }

    function generateResidentCardBack(profile) {
        const nc = (profile && profile.nameCard) ? profile.nameCard : {};
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 500;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0f1115';
        ctx.fillRect(0, 0, 800, 500);

        const grad = ctx.createLinearGradient(0, 0, 800, 500);
        grad.addColorStop(0, '#15171c');
        grad.addColorStop(1, '#090a0d');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 800, 500);

        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        for (let r = 80; r < 600; r += 50) {
            ctx.beginPath();
            ctx.arc(600, 250, r, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();

        drawRoundedRect(ctx, 24, 24, 752, 452, 22);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.lineWidth = 2;
        ctx.stroke();

        drawRoundedRect(ctx, 32, 32, 736, 436, 16);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();

        drawNodeFaviconIcon(ctx, 62, 62, 22, '#ffffff');

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('PROJECT NODE', 82, 68);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('Resident Directory Pass', 212, 68);

        drawRoundedRect(ctx, 610, 48, 140, 28, 14);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('ACTIVE MEMBER', 636, 66);

        drawRoundedRect(ctx, 62, 115, 210, 210, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.fillStyle = '#000000';
        const qx = 82;
        const qy = 135;

        function drawFinder(fx, fy) {
            ctx.fillRect(fx, fy, 40, 40);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(fx + 6, fy + 6, 28, 28);
            ctx.fillStyle = '#000000';
            ctx.fillRect(fx + 12, fy + 12, 16, 16);
        }

        drawFinder(qx, qy);
        drawFinder(qx + 130, qy);
        drawFinder(qx, qy + 130);

        for (let ix = 0; ix < 24; ix++) {
            for (let iy = 0; iy < 24; iy++) {
                if ((ix < 7 && iy < 7) || (ix > 16 && iy < 7) || (ix < 7 && iy > 16)) continue;
                if (((ix * 7 + iy * 11 + (nc.fullName ? nc.fullName.length : 3)) % 3) === 0) {
                    ctx.fillRect(qx + ix * 7, qy + iy * 7, 5, 5);
                }
            }
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('SCAN TO IMPORT VCF CARD', 80, 350);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('RESIDENT STATEMENT / BIO', 310, 130);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'italic 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const bioText = nc.bio ? `"${nc.bio}"` : '"Living at Project Node. Welcoming community collaboration and neighborly connection."';

        const words = bioText.split(' ');
        let line = '';
        let lineY = 160;
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > 420 && n > 0) {
                ctx.fillText(line, 310, lineY);
                line = words[n] + ' ';
                lineY += 24;
                if (lineY > 230) break;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, 310, lineY);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(310, 260);
        ctx.lineTo(740, 260);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('VERIFIED RESIDENCE', 310, 290);
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(nc.unit || 'Block 4 Community', 310, 314);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('CONCIERGE HOTLINE', 530, 290);
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('+1 (555) 900-NODE', 530, 314);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(60, 420);
        ctx.lineTo(740, 420);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('TAP CARD TO RETURN TO FRONT FACE', 62, 446);

        return canvas.toDataURL('image/png');
    }

    function syncPresetChips(presetToActivate) {
        const p = presetToActivate || currentPreset || 'bursts';
        document.querySelectorAll('.holocard-preset-chip').forEach(c => {
            c.classList.toggle('active', c.dataset.preset === p);
        });
    }

    function renderConnectHoloCard() {
        const container = document.getElementById('connect-holocard-container');
        if (!container) return;

        const frontDataUrl = generateResidentCardFront(currentProfile);
        const backDataUrl = generateResidentCardBack(currentProfile);
        const preset = (currentProfile && currentProfile.nameCard && currentProfile.nameCard.holoPreset) || localStorage.getItem('node_holo_preset') || currentPreset || 'bursts';

        if (!connectHoloCardInstance) {
            container.innerHTML = '';
            if (window.HoloCard && window.HoloCard.init) {
                connectHoloCardInstance = window.HoloCard.init(container, {
                    image: frontDataUrl,
                    backImage: backDataUrl,
                    alt: `${currentProfile.nameCard.fullName || 'Resident'} Name Card`,
                    preset: preset,
                    width: 480,
                    ratio: 1.6,
                    radius: 16,
                    intensity: 0.85,
                    frame: 4,
                    glare: 0.5,
                    scale: 1,
                    edgeSparkle: 0.8,
                    tiltMax: 14,
                    hoverScale: 1.04,
                    idle: true,
                    shadow: true
                });
            }
        } else {
            connectHoloCardInstance.setImage(frontDataUrl, backDataUrl);
            connectHoloCardInstance.setPreset(preset);
        }
    }

    function renderPreviewHoloCard() {
        const container = document.getElementById('preview-holocard-container');
        if (!container) return;

        const frontDataUrl = generateResidentCardFront(currentProfile);
        const backDataUrl = generateResidentCardBack(currentProfile);
        const preset = (currentProfile && currentProfile.nameCard && currentProfile.nameCard.holoPreset) || localStorage.getItem('node_holo_preset') || currentPreset || 'bursts';

        syncPresetChips(preset);

        if (!previewHoloCardInstance) {
            container.innerHTML = '';
            if (window.HoloCard && window.HoloCard.init) {
                previewHoloCardInstance = window.HoloCard.init(container, {
                    image: frontDataUrl,
                    backImage: backDataUrl,
                    alt: `${currentProfile.nameCard.fullName || 'Resident'} Name Card`,
                    preset: preset,
                    width: 480,
                    ratio: 1.6,
                    radius: 16,
                    intensity: 0.85,
                    frame: 4,
                    glare: 0.5,
                    scale: 1,
                    edgeSparkle: 0.8,
                    tiltMax: 14,
                    hoverScale: 1.04,
                    idle: true,
                    shadow: true
                });
            }
        } else {
            previewHoloCardInstance.setImage(frontDataUrl, backDataUrl);
            previewHoloCardInstance.setPreset(preset);
        }
    }

    function openShareModal() {
        if (!validateProfileForm()) {
            if (window.NodeApp && window.NodeApp.showToast) {
                window.NodeApp.showToast('Please fill in Name and Phone before sharing');
            }
            return;
        }

        const nc = currentProfile.nameCard;
        const modal = document.getElementById('share-modal');
        if (!modal) return;

        const modalName = document.getElementById('share-modal-name');
        const modalPhone = document.getElementById('share-modal-phone');
        const modalUnit = document.getElementById('share-modal-unit');

        if (modalName) modalName.textContent = nc.fullName;
        if (modalPhone) modalPhone.textContent = nc.phone;
        if (modalUnit) modalUnit.textContent = nc.unit || 'Residential Community Member';

        modal.classList.add('active');
    }

    function copyCardToClipboard() {
        const nc = currentProfile.nameCard;
        const text = [
            `Project Node - Resident Name Card`,
            `Name: ${nc.fullName}`,
            `Phone: ${nc.phone}`,
            nc.unit ? `Unit: ${nc.unit}` : '',
            nc.occupation ? `Occupation: ${nc.occupation}` : '',
            nc.bio ? `Bio: ${nc.bio}` : '',
            nc.helperTags && nc.helperTags.length ? `Skills: ${nc.helperTags.join(', ')}` : ''
        ].filter(Boolean).join('\n');

        navigator.clipboard.writeText(text).then(() => {
            if (window.NodeApp && window.NodeApp.showToast) {
                window.NodeApp.showToast('Resident card copied to clipboard');
            }
        }).catch(err => {
            console.error('Copy failed:', err);
        });
    }

    function setupEventListeners() {
        const inputs = [
            'input-appearance-name',
            'input-card-fullname',
            'input-card-phone',
            'input-card-unit',
            'input-card-occupation',
            'input-card-bio',
            'input-card-email',
            'input-card-handle'
        ];

        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', function () {
                    if (id === 'input-appearance-name') {
                        currentProfile.appearanceName = this.value;
                        renderGreeting();
                    } else if (id === 'input-card-fullname') {
                        currentProfile.nameCard.fullName = this.value;
                        if (!currentProfile.appearanceName) {
                            renderGreeting();
                        }
                    } else if (id === 'input-card-phone') {
                        currentProfile.nameCard.phone = this.value;
                    } else if (id === 'input-card-unit') {
                        currentProfile.nameCard.unit = this.value;
                    } else if (id === 'input-card-occupation') {
                        currentProfile.nameCard.occupation = this.value;
                    } else if (id === 'input-card-bio') {
                        currentProfile.nameCard.bio = this.value;
                    } else if (id === 'input-card-email') {
                        currentProfile.nameCard.email = this.value;
                    } else if (id === 'input-card-handle') {
                        currentProfile.nameCard.handle = this.value;
                    }
                    renderCardPreview();
                });
            }
        });

        document.querySelectorAll('.skill-tag-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                this.classList.toggle('selected');
                const selectedTags = [];
                document.querySelectorAll('.skill-tag-btn.selected').forEach(b => selectedTags.push(b.dataset.tag));
                currentProfile.nameCard.helperTags = selectedTags;
                renderCardPreview();
            });
        });

        const saveBtn = document.getElementById('btn-save-settings');
        if (saveBtn) {
            saveBtn.addEventListener('click', handleSaveProfile);
        }

        const shareBtn = document.getElementById('btn-share-card');
        if (shareBtn) {
            shareBtn.addEventListener('click', openShareModal);
        }

        const copyBtn = document.getElementById('btn-modal-copy-card');
        if (copyBtn) {
            copyBtn.addEventListener('click', copyCardToClipboard);
        }

        const vcardBtn = document.getElementById('btn-modal-download-vcf');
        if (vcardBtn) {
            vcardBtn.addEventListener('click', downloadVCard);
        }

        const closeShareModalBtn = document.getElementById('btn-close-share-modal');
        if (closeShareModalBtn) {
            closeShareModalBtn.addEventListener('click', () => {
                const modal = document.getElementById('share-modal');
                if (modal) modal.classList.remove('active');
            });
        }

        const previewBtn = document.getElementById('btn-preview-namecard');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                if (window.NodeApp && window.NodeApp.navigateTo) {
                    window.NodeApp.navigateTo('card-preview');
                }
            });
        }

        const backFromPreviewBtn = document.getElementById('btn-back-from-preview');
        if (backFromPreviewBtn) {
            backFromPreviewBtn.addEventListener('click', () => {
                if (window.NodeApp && window.NodeApp.navigateTo) {
                    window.NodeApp.navigateTo('settings');
                }
            });
        }

        const shareFromPreviewBtn = document.getElementById('btn-share-from-preview');
        if (shareFromPreviewBtn) {
            shareFromPreviewBtn.addEventListener('click', openShareModal);
        }

        const sharePreviewMainBtn = document.getElementById('btn-share-preview-main');
        if (sharePreviewMainBtn) {
            sharePreviewMainBtn.addEventListener('click', openShareModal);
        }

        const downloadVcfPreviewBtn = document.getElementById('btn-download-vcf-preview');
        if (downloadVcfPreviewBtn) {
            downloadVcfPreviewBtn.addEventListener('click', downloadVCard);
        }

        document.querySelectorAll('.holocard-preset-chip').forEach(chip => {
            chip.addEventListener('click', function () {
                const preset = this.dataset.preset;
                currentPreset = preset;
                if (currentProfile && currentProfile.nameCard) {
                    currentProfile.nameCard.holoPreset = preset;
                }
                saveToStorage();
                localStorage.setItem('node_holo_preset', preset);
                syncPresetChips(preset);
                if (previewHoloCardInstance) {
                    previewHoloCardInstance.setPreset(preset);
                }
                if (connectHoloCardInstance) {
                    connectHoloCardInstance.setPreset(preset);
                }
            });
        });
    }

    window.NodeProfile = {
        loadProfile: loadProfile,
        saveProfile: handleSaveProfile,
        getProfile: () => currentProfile,
        openShareModal: openShareModal,
        downloadVCard: downloadVCard,
        copyCardToClipboard: copyCardToClipboard,
        renderConnectHoloCard: renderConnectHoloCard,
        renderPreviewHoloCard: renderPreviewHoloCard,
        generateResidentCardFront: generateResidentCardFront,
        generateResidentCardBack: generateResidentCardBack,
        getHoloPreset: () => (currentProfile && currentProfile.nameCard && currentProfile.nameCard.holoPreset) || localStorage.getItem('node_holo_preset') || currentPreset || 'bursts',
        renderHoloCardPreview: () => {
            renderConnectHoloCard();
            renderPreviewHoloCard();
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        loadProfile();
        setupEventListeners();
    });
})();
