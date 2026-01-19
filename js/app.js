document.addEventListener('DOMContentLoaded', () => {
    // Global State
    const state = {
        data: [],
        startTime: 0,
        endTime: 0,
        currentTime: 0,
        isPlaying: false,
        maxMag: 0,
        eventIndex: 0,
        currentYear: 'latest',
        playbackSpeed: 1.0 // 1.0 = normal, 0.1 = 1/10 speed (slower)
    };

    // DOM Elements
    const els = {
        map: document.getElementById('map'),
        playPauseBtn: document.getElementById('play-pause-btn'),
        playIcon: document.getElementById('play-icon'),
        pauseIcon: document.getElementById('pause-icon'),
        slider: document.getElementById('timeline-slider'),
        currentDate: document.getElementById('current-date'),
        currentTime: document.getElementById('current-time'),
        eventCount: document.getElementById('event-count'),
        maxMag: document.getElementById('max-mag'),
        infoToggle: document.getElementById('info-toggle'),
        infoPanel: document.getElementById('info-panel'),
        infoClose: document.getElementById('info-close'),
        yearTabs: document.querySelectorAll('.year-tab'),
        loadingOverlay: document.getElementById('loading-overlay'),
        faultToggle: document.getElementById('fault-toggle'),
        plateToggle: document.getElementById('plate-toggle')
    };

    // Info Panel Toggle
    els.infoToggle.addEventListener('click', () => {
        els.infoPanel.classList.toggle('collapsed');
    });

    // Info Panel Close Button
    els.infoClose.addEventListener('click', () => {
        els.infoPanel.classList.add('collapsed');
    });

    // Initialize Map (Center on Japan)
    const map = L.map('map', {
        zoomControl: false,
        attributionControl: false
    }).setView([36.2048, 138.2529], 5);

    // Positron Light Tiles (CartoDB)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // --- Active Fault Layer (GSI Tiles) ---
    // 国土地理院 活断層図（都市圏）
    const faultLayer = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/afm/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">国土地理院</a>',
        opacity: 0.7,
        minZoom: 5,
        maxZoom: 16
    });

    // Fault Layer Toggle
    let faultLayerVisible = false;
    els.faultToggle.addEventListener('click', () => {
        faultLayerVisible = !faultLayerVisible;
        if (faultLayerVisible) {
            faultLayer.addTo(map);
            els.faultToggle.classList.add('active');
        } else {
            map.removeLayer(faultLayer);
            els.faultToggle.classList.remove('active');
        }
    });

    // --- Plate Boundary Layer (GeoJSON) ---
    let plateLayer = null;
    fetch('data/plates.geojson')
        .then(res => res.json())
        .then(data => {
            plateLayer = L.geoJSON(data, {
                style: {
                    color: "#0066cc", // Blue for plates
                    weight: 4,
                    opacity: 0.6,
                    lineCap: 'round'
                },
                onEachFeature: (feature, layer) => {
                    if (feature.properties && feature.properties.name) {
                        layer.bindPopup(`<strong>${feature.properties.name}</strong><br>種類: ${feature.properties.type || 'プレート境界'}`);
                    }
                }
            });
        })
        .catch(err => console.error("Failed to load plate data:", err));

    // Plate Layer Toggle
    let plateLayerVisible = false;
    els.plateToggle.addEventListener('click', () => {
        if (!plateLayer) return;
        plateLayerVisible = !plateLayerVisible;
        if (plateLayerVisible) {
            plateLayer.addTo(map);
            els.plateToggle.classList.add('active');
        } else {
            map.removeLayer(plateLayer);
            els.plateToggle.classList.remove('active');
        }
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Active marker layers
    const activeLayers = new Set();

    // Helpers
    function getMagColor(mag) {
        if (mag >= 6) return '#e51c23';
        if (mag >= 5) return '#ff9900';
        return '#00a8cc';
    }

    function formatDateTime(timestamp) {
        const d = new Date(timestamp);
        return {
            date: d.toISOString().split('T')[0],
            time: d.toTimeString().split(' ')[0].substring(0, 5)
        };
    }

    function showLoading() {
        els.loadingOverlay.classList.remove('hidden');
    }

    function hideLoading() {
        els.loadingOverlay.classList.add('hidden');
    }

    function clearAllMarkers() {
        activeLayers.forEach(layer => {
            if (map.hasLayer(layer)) {
                map.removeLayer(layer);
            }
        });
        activeLayers.clear();
    }

    // ====== AUDIO ======
    let audioCtx = null;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playSound(mag) {
        if (!audioCtx) return;

        // Volume: Mag 2.5 -> 0.02, Mag 7 -> 1.0
        const vol = Math.min(1.0, Math.max(0.02, (mag - 2.0) / 5.0));
        // Pitch: 800Hz (small) -> 60Hz (large)
        const freq = Math.max(60, 800 - (mag * 100));
        // Duration
        const duration = Math.max(0.1, mag * 0.12);

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = mag > 5.5 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(vol, audioCtx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    }

    // ====== YEAR TAB HANDLING ======
    function getDataUrl(year) {
        if (year === 'latest') {
            return 'data/earthquakes.json';
        }
        if (year === '1month') {
            return 'data/earthquakes_1month.json';
        }
        return `data/earthquakes_${year}.json`;
    }

    function handleYearTabClick(e) {
        const tab = e.target;
        const year = tab.dataset.year;

        if (state.currentYear === year) return;

        // Update tab appearance
        els.yearTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Load new data
        loadYear(year);
    }

    function loadYear(year) {
        state.currentYear = year;
        state.isPlaying = false;
        // Set playback speed: 1/10 for 1month (10x slower), normal for others
        state.playbackSpeed = (year === '1month') ? 0.1 : 1.0;
        updateControls();

        // Clear existing markers
        clearAllMarkers();

        // Show loading
        showLoading();

        const url = getDataUrl(year);

        fetch(url)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }
                return res.json();
            })
            .then(geoJson => {
                initWithData(geoJson);
                hideLoading();
            })
            .catch(err => {
                console.error(`Failed to load ${year} data:`, err);
                hideLoading();

                // Show user-friendly error
                const yearLabel = year === 'latest' ? '最新' : year;
                alert(`${yearLabel}年のデータを読み込めませんでした。\nデータファイルが存在しない可能性があります。`);

                // Reset to previous state if needed
                els.eventCount.innerText = '0';
                els.maxMag.innerText = '0.0';
                state.data = [];
            });
    }

    // ====== DATA INITIALIZATION ======
    function initWithData(geoJson) {
        state.data = geoJson.features.map(f => ({
            time: f.properties.time,
            mag: f.properties.mag,
            lat: f.geometry.coordinates[1],
            lon: f.geometry.coordinates[0]
        })).sort((a, b) => a.time - b.time);

        if (state.data.length === 0) {
            els.eventCount.innerText = '0';
            els.maxMag.innerText = '0.0';
            els.currentDate.innerText = 'No Data';
            els.currentTime.innerText = '';
            return;
        }

        state.startTime = state.data[0].time;
        state.endTime = state.data[state.data.length - 1].time;
        state.currentTime = state.startTime;
        state.maxMag = Math.max(...state.data.map(d => d.mag));
        state.eventIndex = 0;

        els.eventCount.innerText = state.data.length;
        els.maxMag.innerText = state.maxMag.toFixed(1);

        els.slider.min = state.startTime;
        els.slider.max = state.endTime;
        els.slider.value = state.startTime;

        renderMapState();
    }

    // Initial data load
    fetch('data/earthquakes.json')
        .then(res => res.json())
        .then(geoJson => {
            initWithData(geoJson);

            // Setup event listeners after initial load
            els.playPauseBtn.addEventListener('click', togglePlay);
            els.slider.addEventListener('input', handleSliderChange);

            // Year tab listeners
            els.yearTabs.forEach(tab => {
                tab.addEventListener('click', handleYearTabClick);
            });

            // Start animation loop
            requestAnimationFrame(animate);
        })
        .catch(err => {
            console.error("Failed to load data:", err);
            alert("Failed to load earthquake data. Please run fetch_data.py first.");
        });

    function togglePlay() {
        initAudio(); // User interaction -> start audio context
        state.isPlaying = !state.isPlaying;
        updateControls();
    }

    function updateControls() {
        els.playIcon.style.display = state.isPlaying ? 'none' : 'block';
        els.pauseIcon.style.display = state.isPlaying ? 'block' : 'none';
    }

    function handleSliderChange(e) {
        state.currentTime = parseInt(e.target.value);
        state.isPlaying = false;
        state.eventIndex = state.data.findIndex(d => d.time > state.currentTime);
        if (state.eventIndex < 0) state.eventIndex = state.data.length;
        updateControls();
        renderMapState();
    }

    // ====== ANIMATION ======
    let lastFrameTime = 0;

    function animate(timestamp) {
        if (lastFrameTime === 0) lastFrameTime = timestamp;
        const dt = timestamp - lastFrameTime;
        lastFrameTime = timestamp;

        if (state.isPlaying && state.data.length > 0) {
            // Base duration: 90 sec for 1 year, adjusted by playbackSpeed
            const baseDuration = 90 * 1000;
            const duration = baseDuration / state.playbackSpeed; // slower = longer duration
            const totalTime = state.endTime - state.startTime;
            const msPerFrame = (totalTime / duration) * dt;

            const prevTime = state.currentTime;
            state.currentTime += msPerFrame;

            if (state.currentTime >= state.endTime) {
                state.currentTime = state.startTime;
                clearAllMarkers();
                state.eventIndex = 0;
            }

            els.slider.value = state.currentTime;
            triggerEvents(prevTime, state.currentTime);
        }

        renderMapState();
        requestAnimationFrame(animate);
    }

    function triggerEvents(prevTime, currTime) {
        while (state.eventIndex < state.data.length) {
            const event = state.data[state.eventIndex];
            if (event.time > currTime) break;
            if (event.time >= prevTime) {
                spawnEvent(event);
            }
            state.eventIndex++;
        }
    }

    function spawnEvent(event) {
        const color = getMagColor(event.mag);
        const size = Math.pow(1.8, event.mag) * 3;

        const icon = L.divIcon({
            className: 'quake-icon-wrapper',
            html: `<div class="quake-marker" style="
                width: ${size}px; 
                height: ${size}px; 
                color: ${color};
                animation: pulse 2s ease-out forwards;
            "></div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2]
        });

        const marker = L.marker([event.lat, event.lon], { icon: icon }).addTo(map);
        activeLayers.add(marker);

        setTimeout(() => {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
                activeLayers.delete(marker);
            }
        }, 2000);

        playSound(event.mag);
    }

    function renderMapState() {
        if (state.data.length === 0) return;

        const { date, time } = formatDateTime(state.currentTime);
        els.currentDate.innerText = date;
        els.currentTime.innerText = time;
    }
});
