/**
 * Main Application Controller for Shivani's 19th Birthday Page
 * Manages UI interactions, modals, audio synchronization, confetti celebrations,
 * microphone blow detection, and photo memory wall.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize State
    let scene = null;
    let isBgmPlaying = false;
    let micStream = null;
    let micAnalyser = null;
    let isListeningMic = false;

    // 2. Initialize 3D Scene with Robust Loader & Offline CSS Fallback
    function tryInitScene() {
        if (scene) return true;
        if (typeof THREE !== 'undefined' && typeof window.initBirthdayScene === 'function') {
            try {
                scene = window.initBirthdayScene('canvas-container');
                window.birthdayScene = scene;
                return true;
            } catch (err) {
                console.warn('WebGL init error:', err);
                return false;
            }
        }
        return false;
    }

    if (!tryInitScene()) {
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (tryInitScene() || attempts > 15) {
                clearInterval(interval);
                if (!scene) {
                    console.log('Activating CSS 3D Fallback Stage...');
                    initCSSFallbackScene();
                }
            }
        }, 150);
    }

    // Elegant CSS 3D animated stage fallback if WebGL or CDN is unavailable
    function initCSSFallbackScene() {
        const container = document.getElementById('canvas-container');
        if (!container || container.querySelector('.css-fallback-stage')) return;

        container.innerHTML = `
            <div class="css-fallback-stage">
                <div class="css-floating-balloons">
                    <div class="css-balloon b1" onclick="window.showBalloonNote(0)">🎈</div>
                    <div class="css-balloon b2" onclick="window.showBalloonNote(1)">🎈</div>
                    <div class="css-balloon b3" onclick="window.showBalloonNote(2)">🎈</div>
                    <div class="css-balloon b4" onclick="window.showBalloonNote(3)">🎈</div>
                </div>
                <div class="css-cake-wrap">
                    <div class="css-cake-topper">19</div>
                    <div class="css-candle" id="css-candle">
                        <div class="css-flame" id="css-flame"></div>
                    </div>
                    <div class="css-tier tier-top"></div>
                    <div class="css-tier tier-mid"></div>
                    <div class="css-tier tier-base"></div>
                    <div class="css-plate"></div>
                </div>
                <div class="css-gift-box" id="css-gift-box" onclick="if(window.openGiftLetterModal) window.openGiftLetterModal();">
                    🎁
                </div>
            </div>
        `;

        // Create mock scene API so buttons work seamlessly
        scene = {
            isCandleBlown: false,
            blowCandle: () => {
                const flame = document.getElementById('css-flame');
                if (flame) flame.style.display = 'none';
                scene.isCandleBlown = true;
                if (window.soundEngine) window.soundEngine.sfxCandleBlow();
                if (window.triggerCelebration) window.triggerCelebration();
            },
            relightCandle: () => {
                const flame = document.getElementById('css-flame');
                if (flame) flame.style.display = 'block';
                scene.isCandleBlown = false;
            },
            openGiftBox: () => {
                if (window.soundEngine) window.soundEngine.sfxGiftOpen();
                if (window.openGiftLetterModal) window.openGiftLetterModal();
            },
            releaseSkyLantern: (wish) => {
                if (window.soundEngine) window.soundEngine.sfxLanternRelease();
            }
        };
        window.birthdayScene = scene;
    }

    // 3. Audio Controller
    const musicToggleBtn = document.getElementById('music-toggle-btn');
    const musicIcon = document.getElementById('music-icon');
    const visualizerBars = document.querySelectorAll('.music-bar');

    function updateMusicUI(playing) {
        isBgmPlaying = playing;
        if (playing) {
            musicToggleBtn.classList.add('playing');
            visualizerBars.forEach(bar => bar.classList.add('active'));
            musicIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
        } else {
            musicToggleBtn.classList.remove('playing');
            visualizerBars.forEach(bar => bar.classList.remove('active'));
            musicIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
        }
    }

    musicToggleBtn.addEventListener('click', () => {
        if (!window.soundEngine) return;
        const active = window.soundEngine.toggleBGM();
        updateMusicUI(active);
    });

    // Auto-unlock Web Audio on first user interaction anywhere
    const unlockAudio = () => {
        if (window.soundEngine) {
            window.soundEngine.ensureContext();
        }
        document.removeEventListener('pointerdown', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
    };
    document.addEventListener('pointerdown', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });

    // 4. Confetti & Celebration Cannon
    window.triggerCelebration = function() {
        if (typeof confetti === 'function') {
            // Golden and Rose multi-stage fireworks
            const count = 200;
            const defaults = {
                origin: { y: 0.65 },
                colors: ['#F59E0B', '#EC4899', '#A855F7', '#3B82F6', '#10B981', '#FFFFFF']
            };

            function fire(particleRatio, opts) {
                confetti(Object.assign({}, defaults, opts, {
                    particleCount: Math.floor(count * particleRatio)
                }));
            }

            fire(0.25, { spread: 26, startVelocity: 55 });
            fire(0.2, { spread: 60 });
            fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
            fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
            fire(0.1, { spread: 120, startVelocity: 45 });
        } else {
            // Built-in 2D Canvas Confetti Fallback
            runFallbackConfetti();
        }

        // Show celebratory toast notification
        showNotification("🎉 Make a wish, Shivani! Happy 19th Birthday! ✨", 4500);

        // Update candle button UI
        const candleBtn = document.getElementById('blow-candle-btn');
        if (candleBtn) {
            candleBtn.innerHTML = `<span>🔥</span> Relight Candle`;
            candleBtn.classList.add('active-state');
        }
    };

    // 5. Blow / Relight Candle Button
    const blowCandleBtn = document.getElementById('blow-candle-btn');
    if (blowCandleBtn) {
        blowCandleBtn.addEventListener('click', () => {
            if (!scene) return;
            if (scene.isCandleBlown) {
                scene.relightCandle();
                blowCandleBtn.innerHTML = `<span>🎂</span> Blow Candle`;
                blowCandleBtn.classList.remove('active-state');
                showNotification("Candle relit! Ready for another wish ✨", 2500);
            } else {
                scene.blowCandle();
            }
        });
    }

    // 6. Open Gift Button
    const openGiftBtn = document.getElementById('open-gift-btn');
    if (openGiftBtn) {
        openGiftBtn.addEventListener('click', () => {
            if (!scene) return;
            scene.openGiftBox();
        });
    }

    // 7. Release Sky Lantern Button
    const releaseLanternBtn = document.getElementById('release-lantern-btn');
    const wishes = [
        "May your 19th year be blessed with boundless peace & joy!",
        "May our friendship continue to grow stronger with every passing day!",
        "May you achieve every ambition and dream in your golden heart!",
        "May life reward you with as much kindness as you give to the world!",
        "To another 365 days of uncontrollable laughs and cherished moments!"
    ];
    let wishIndex = 0;

    if (releaseLanternBtn) {
        releaseLanternBtn.addEventListener('click', () => {
            if (!scene) return;
            const wish = wishes[wishIndex % wishes.length];
            wishIndex++;
            scene.releaseSkyLantern(wish);
            showNotification(`🏮 Lantern released: "${wish}"`, 3500);
        });
    }

    // 8. Auto-Rotate Toggle & Camera Reset
    const autoRotateBtn = document.getElementById('toggle-rotate-btn');
    let autoRotateActive = true;
    if (autoRotateBtn) {
        autoRotateBtn.addEventListener('click', () => {
            if (!scene || !scene.controls) return;
            autoRotateActive = !autoRotateActive;
            scene.controls.autoRotate = autoRotateActive;
            autoRotateBtn.classList.toggle('active', autoRotateActive);
            showNotification(autoRotateActive ? "Auto-rotation on" : "Auto-rotation paused", 2000);
        });
    }

    const resetCamBtn = document.getElementById('reset-cam-btn');
    if (resetCamBtn) {
        resetCamBtn.addEventListener('click', () => {
            if (!scene || !scene.controls) return;
            const isMobile = window.innerWidth < 768;
            scene.camera.position.set(0, isMobile ? 4.5 : 4.0, isMobile ? 13.5 : 10.5);
            scene.controls.target.set(0, 1.2, 0);
            scene.controls.update();
            showNotification("Camera view reset", 1800);
        });
    }

    // 9. Microphone Blow Detection (Optional Real-world puff detection)
    const micToggleBtn = document.getElementById('mic-blow-btn');
    if (micToggleBtn) {
        micToggleBtn.addEventListener('click', async () => {
            if (isListeningMic) {
                stopMicDetection();
                micToggleBtn.classList.remove('listening');
                micToggleBtn.innerHTML = `<span>🎤</span> Mic Blow: Off`;
                showNotification("Microphone detection paused", 2000);
            } else {
                const started = await startMicDetection();
                if (started) {
                    micToggleBtn.classList.add('listening');
                    micToggleBtn.innerHTML = `<span>🌬️</span> Blow into Mic!`;
                    showNotification("Microphone active! Blow gently near your mic to blow out the candle 🌬️", 4000);
                }
            }
        });
    }

    async function startMicDetection() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Microphone detection is not supported on this browser. You can tap the 'Blow Candle' button directly!");
            return false;
        }
        try {
            micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const audioCtx = new AudioContext();
            const source = audioCtx.createMediaStreamSource(micStream);
            micAnalyser = audioCtx.createAnalyser();
            micAnalyser.fftSize = 256;
            source.connect(micAnalyser);
            isListeningMic = true;
            listenForBlow();
            return true;
        } catch (err) {
            console.error('Mic access error:', err);
            alert("Could not access microphone. Tap the 'Blow Candle' button instead!");
            return false;
        }
    }

    function stopMicDetection() {
        isListeningMic = false;
        if (micStream) {
            micStream.getTracks().forEach(track => track.stop());
            micStream = null;
        }
    }

    function listenForBlow() {
        if (!isListeningMic || !micAnalyser) return;
        const dataArray = new Uint8Array(micAnalyser.frequencyBinCount);
        micAnalyser.getByteFrequencyData(dataArray);

        // Low frequency wind noise detection
        let lowFreqSum = 0;
        for (let i = 1; i < 15; i++) {
            lowFreqSum += dataArray[i];
        }
        const lowFreqAvg = lowFreqSum / 14;

        if (lowFreqAvg > 75) { // Threshold for blow/puff
            if (scene && !scene.isCandleBlown) {
                scene.blowCandle();
                stopMicDetection();
                if (micToggleBtn) {
                    micToggleBtn.classList.remove('listening');
                    micToggleBtn.innerHTML = `<span>🎤</span> Mic Blow: Done!`;
                }
                return;
            }
        }
        requestAnimationFrame(listenForBlow);
    }

    // 10. Modals Management (Poetry, Timeline, Gift Letter, Memory Wall)
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalContainers = document.querySelectorAll('.app-modal');

    function openModal(modalId) {
        modalContainers.forEach(m => m.classList.remove('active'));
        const target = document.getElementById(modalId);
        if (target) {
            target.classList.add('active');
            modalBackdrop.classList.add('active');
            document.body.style.overflow = 'hidden';
            if (window.soundEngine) window.soundEngine.sfxSparkle(920);
        }
    }

    function closeModal() {
        modalContainers.forEach(m => m.classList.remove('active'));
        modalBackdrop.classList.remove('active');
        document.body.style.overflow = '';
    }

    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeModal();
    });

    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // Navigation Dock buttons
    document.getElementById('nav-poetry-btn').addEventListener('click', () => openModal('poetry-modal'));
    document.getElementById('nav-timeline-btn').addEventListener('click', () => openModal('timeline-modal'));
    document.getElementById('nav-letter-btn').addEventListener('click', () => openModal('letter-modal'));
    document.getElementById('nav-memories-btn').addEventListener('click', () => openModal('memories-modal'));

    window.openGiftLetterModal = function() {
        openModal('letter-modal');
    };

    // 11. Populate Poetry Modal with Rich Stanza Tabs
    const poetryListContainer = document.getElementById('poetry-content-wrapper');
    if (poetryListContainer && typeof POETRY_DATA !== 'undefined') {
        renderPoetryTabs(poetryListContainer);
    }

    function renderPoetryTabs(container) {
        let html = `
            <div class="poetry-nav-tabs">
                ${POETRY_DATA.map((poem, i) => `
                    <button class="poem-tab-btn ${i === 0 ? 'active' : ''}" data-poem-idx="${i}">
                        <span class="tab-tag">${poem.tag}</span>
                        <span class="tab-title">${poem.title}</span>
                    </button>
                `).join('')}
            </div>
            <div class="poetry-display-card">
                <div class="poem-header">
                    <span class="poem-badge" id="curr-poem-tag">${POETRY_DATA[0].tag}</span>
                    <h2 class="poem-headline" id="curr-poem-title">${POETRY_DATA[0].title}</h2>
                    <p class="poem-subtext" id="curr-poem-subtitle">${POETRY_DATA[0].subtitle}</p>
                </div>
                <div class="poem-body" id="curr-poem-stanzas">
                    ${renderStanzasHTML(POETRY_DATA[0].stanzas)}
                </div>
                <div class="poem-actions">
                    <button class="btn btn-gold" id="copy-poem-btn">
                        <span>📋</span> Copy Poem
                    </button>
                    <button class="btn btn-glass" id="read-aloud-btn">
                        <span>🎵</span> Play Theme Harmony
                    </button>
                </div>
            </div>
        `;
        container.innerHTML = html;

        // Tab click events
        container.querySelectorAll('.poem-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.dataset.poemIdx, 10);
                container.querySelectorAll('.poem-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const selected = POETRY_DATA[idx];
                document.getElementById('curr-poem-tag').innerText = selected.tag;
                document.getElementById('curr-poem-title').innerText = selected.title;
                document.getElementById('curr-poem-subtitle').innerText = selected.subtitle;
                document.getElementById('curr-poem-stanzas').innerHTML = renderStanzasHTML(selected.stanzas);

                if (window.soundEngine) window.soundEngine.sfxSparkle(780 + idx * 100);
            });
        });

        // Copy poem action
        const copyBtn = document.getElementById('copy-poem-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const activeTab = container.querySelector('.poem-tab-btn.active');
                const idx = activeTab ? parseInt(activeTab.dataset.poemIdx, 10) : 0;
                const poem = POETRY_DATA[idx];
                const fullText = `${poem.title}\n${poem.subtitle}\n\n` +
                    poem.stanzas.map(st => st.join('\n')).join('\n\n') +
                    `\n\n— Dedicated to Shivani on her 19th Birthday`;

                navigator.clipboard.writeText(fullText).then(() => {
                    showNotification("Poem copied to clipboard! Share it with Shivani 💌", 3000);
                }).catch(() => {
                    showNotification("Text selected! You can copy it now.", 2500);
                });
            });
        }

        // Play theme harmony
        const readBtn = document.getElementById('read-aloud-btn');
        if (readBtn) {
            readBtn.addEventListener('click', () => {
                if (window.soundEngine) {
                    window.soundEngine.sfxCheerFanfare();
                }
            });
        }
    }

    function renderStanzasHTML(stanzas) {
        return stanzas.map(stanza => `
            <div class="stanza-block">
                ${stanza.map(line => `<p class="stanza-line">${line}</p>`).join('')}
            </div>
        `).join('');
    }

    // 12. Populate Timeline Modal (365 Days of Friendship)
    const timelineContainer = document.getElementById('timeline-content-wrapper');
    if (timelineContainer && typeof TIMELINE_MILESTONES !== 'undefined') {
        timelineContainer.innerHTML = `
            <div class="timeline-tree">
                ${TIMELINE_MILESTONES.map((item, idx) => `
                    <div class="timeline-step">
                        <div class="timeline-node">
                            <span class="node-dot"></span>
                            <span class="node-number">${idx + 1}</span>
                        </div>
                        <div class="timeline-card">
                            <span class="timeline-date">${item.period}</span>
                            <h3 class="timeline-title">${item.title}</h3>
                            <p class="timeline-desc">${item.description}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 13. Balloon Compliment Pop-up Toast
    window.showBalloonNote = function(index) {
        if (typeof BALLOON_NOTES === 'undefined') return;
        const item = BALLOON_NOTES[index % BALLOON_NOTES.length];

        const card = document.getElementById('balloon-toast-card');
        const emoji = document.getElementById('balloon-toast-emoji');
        const text = document.getElementById('balloon-toast-text');

        if (card && emoji && text) {
            emoji.innerText = item.emoji;
            text.innerText = item.note;
            card.classList.add('visible');

            setTimeout(() => {
                card.classList.remove('visible');
            }, 4500);
        }
    };

    // 14. Memory Polaroid Wall & User Photo Upload
    const photoUploadInput = document.getElementById('polaroid-file-input');
    const uploadTriggerBtn = document.getElementById('upload-photo-btn');
    const polaroidGrid = document.getElementById('polaroid-grid');

    if (uploadTriggerBtn && photoUploadInput) {
        uploadTriggerBtn.addEventListener('click', () => photoUploadInput.click());

        photoUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const newCard = document.createElement('div');
                    newCard.className = 'polaroid-card custom-photo';
                    newCard.innerHTML = `
                        <div class="polaroid-img-box">
                            <img src="${event.target.result}" alt="Memory with Shivani" />
                        </div>
                        <p class="polaroid-caption">365 Days & Uncountable Smiles 💖</p>
                    `;
                    polaroidGrid.prepend(newCard);
                    showNotification("Photo added to your friendship memory wall! 📸", 3000);
                    if (window.soundEngine) window.soundEngine.sfxSparkle(1100);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // 15. Notification Toast Helper
    function showNotification(msg, duration = 3000) {
        let toast = document.getElementById('app-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'app-toast';
            toast.className = 'app-toast';
            document.body.appendChild(toast);
        }
        toast.innerText = msg;
        toast.classList.add('show');

        clearTimeout(toast.timer);
        toast.timer = setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }
    window.showToast = showNotification;

    // 16. Fallback 2D Confetti if Canvas Confetti CDN is blocked
    function runFallbackConfetti() {
        const c = document.createElement('canvas');
        c.style.position = 'fixed';
        c.style.top = '0';
        c.style.left = '0';
        c.style.width = '100vw';
        c.style.height = '100vh';
        c.style.pointerEvents = 'none';
        c.style.zIndex = '9999';
        document.body.appendChild(c);

        c.width = window.innerWidth;
        c.height = window.innerHeight;
        const ctx = c.getContext('2d');
        const bits = [];
        const colors = ['#f59e0b', '#ec4899', '#a855f7', '#6ee7b7', '#38bdf8', '#ffffff'];

        for (let i = 0; i < 120; i++) {
            bits.push({
                x: c.width * 0.5,
                y: c.height * 0.65,
                vx: (Math.random() - 0.5) * 16,
                vy: -(Math.random() * 14 + 6),
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 8 + 4,
                rot: Math.random() * Math.PI,
                vRot: (Math.random() - 0.5) * 0.2
            });
        }

        let frames = 0;
        function updateBits() {
            ctx.clearRect(0, 0, c.width, c.height);
            bits.forEach(b => {
                b.x += b.vx;
                b.y += b.vy;
                b.vy += 0.45; // gravity
                b.rot += b.vRot;
                ctx.save();
                ctx.translate(b.x, b.y);
                ctx.rotate(b.rot);
                ctx.fillStyle = b.color;
                ctx.fillRect(-b.size / 2, -b.size / 2, b.size, b.size * 0.6);
                ctx.restore();
            });
            frames++;
            if (frames < 140) {
                requestAnimationFrame(updateBits);
            } else {
                c.remove();
            }
        }
        updateBits();
    }
});
