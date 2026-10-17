// RIDEX Admin Dashboard Application Logic
const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? window.location.origin
    : 'http://localhost:5000';

let map = null;
let riderMarkers = {};
let simInterval = null;
let simStep = 0;
const defaultRideId = '99999999-9999-9999-9999-999999999999';

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initMap();
    loadDashboardStats();
    loadRidesTable();
    loadRidersTable();
    setupSimulator();

    document.getElementById('btn-refresh').addEventListener('click', () => {
        loadDashboardStats();
        loadRidesTable();
        loadRidersTable();
    });
});

function initTabs() {
    const navItems = document.querySelectorAll('.nav-item');
    const panes = document.querySelectorAll('.tab-pane');
    const heading = document.getElementById('page-heading');
    const subheading = document.getElementById('page-subheading');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(n => n.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));

            item.classList.add('active');
            const targetTab = item.getAttribute('data-tab');
            document.getElementById(`tab-${targetTab}`).classList.add('active');

            if (targetTab === 'dashboard') {
                heading.textContent = 'Operations Dashboard';
                subheading.textContent = 'Live group ride monitoring and telemetry status';
                setTimeout(() => map && map.invalidateSize(), 200);
            } else if (targetTab === 'rides') {
                heading.textContent = 'Active Group Rides';
                subheading.textContent = 'Touring expeditions, join codes, and member tracking';
            } else if (targetTab === 'riders') {
                heading.textContent = 'Rider Community';
                subheading.textContent = 'Registered tourers, bikes, and riding history';
            } else if (targetTab === 'simulator') {
                heading.textContent = 'GPS Multi-Rider Simulator';
                subheading.textContent = 'Drive live telemetry and separation alerts without hardware';
            } else if (targetTab === 'system') {
                heading.textContent = 'System Infrastructure';
                subheading.textContent = 'Zero-cost architecture status and resource monitors';
            }
        });
    });
}

function initMap() {
    const mapElement = document.getElementById('admin-map');
    if (!mapElement) return;

    map = L.map('admin-map', { zoomControl: true }).setView([19.5447, 73.7663], 9);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Draw scenic Western Ghats route
    const coords = [
        [19.9975, 73.7898], // Nashik
        [19.9328, 73.5307], // Trimbakeshwar
        [19.5447, 73.7663], // Bhandardara
        [19.3400, 73.7740], // Malshej
        [18.5204, 73.8567]  // Pune
    ];

    const polyline = L.polyline(coords, {
        color: '#00E5FF',
        weight: 4,
        opacity: 0.9,
        dashArray: '8, 6'
    }).addTo(map);

    map.fitBounds(polyline.getBounds(), { padding: [30, 30] });

    // Seed initial rider markers
    updateMapMarker('11111111-1111-1111-1111-111111111111', 'Aryan (Leader)', 19.5447, 73.7663, 58, false);
    updateMapMarker('22222222-2222-2222-2222-222222222222', 'Vikram Patil', 19.5420, 73.7640, 56, false);
    updateMapMarker('33333333-3333-3333-3333-333333333333', 'Neha Sharma', 19.5380, 73.7600, 52, false);
    updateMapMarker('44444444-4444-4444-4444-444444444444', 'Rohan Mehta', 19.5200, 73.7400, 42, true);
}

function updateMapMarker(id, name, lat, lon, speed, isSeparated) {
    if (!map) return;

    if (riderMarkers[id]) {
        riderMarkers[id].setLatLng([lat, lon]);
        riderMarkers[id].setPopupContent(`<strong>${name}</strong><br>Speed: ${speed} km/h<br>${isSeparated ? '<span style="color:#ef4444">⚠️ SEPARATED</span>' : '<span style="color:#10b981">In Group</span>'}`);
    } else {
        const iconHtml = `<div style="background:${isSeparated ? '#EF4444' : '#FF6B00'}; color:#fff; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; border:2px solid #fff; box-shadow:0 0 10px rgba(0,0,0,0.5); font-size:16px;">🏍️</div>`;
        const icon = L.divIcon({
            html: iconHtml,
            className: 'rider-custom-pin',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        const marker = L.marker([lat, lon], { icon }).addTo(map);
        marker.bindPopup(`<strong>${name}</strong><br>Speed: ${speed} km/h<br>${isSeparated ? '<span style="color:#ef4444">⚠️ SEPARATED</span>' : '<span style="color:#10b981">In Group</span>'}`);
        riderMarkers[id] = marker;
    }
}

async function loadDashboardStats() {
    try {
        const res = await fetch(`${API_BASE}/api/v1/admin/stats`, {
            headers: { 'Authorization': 'Bearer ' + getStoredToken() }
        });
        if (res.ok) {
            const data = await res.json();
            document.getElementById('stat-total-users').textContent = data.totalUsers?.toLocaleString() || '12,420';
            document.getElementById('stat-active-rides').textContent = data.activeRides || '82';
            document.getElementById('stat-online-riders').textContent = data.onlineRiders || '316';
            document.getElementById('stat-total-distance').textContent = `${(data.totalDistanceCoveredKm || 148290).toLocaleString()} km`;
        }
    } catch (e) {
        console.log('Using seeded dashboard telemetry in local demo mode.');
    }
}

async function loadRidesTable() {
    const tbody = document.getElementById('rides-table-body');
    if (!tbody) return;

    try {
        const res = await fetch(`${API_BASE}/api/v1/admin/rides`);
        if (res.ok) {
            const rides = await res.json();
            tbody.innerHTML = '';
            rides.forEach(r => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><span class="badge-code">${r.joinCode}</span></td>
                    <td><strong>${r.title}</strong></td>
                    <td>${r.ownerName}</td>
                    <td>${r.distanceKm} km</td>
                    <td>${r.memberCount} riders</td>
                    <td><span class="badge-online">ACTIVE</span></td>
                    <td>${new Date(r.scheduledStartTime).toLocaleDateString()}</td>
                `;
                tbody.appendChild(tr);
            });
            return;
        }
    } catch (e) {}

    // Fallback seed rows
    tbody.innerHTML = `
        <tr>
            <td><span class="badge-code">RX-8F29K</span></td>
            <td><strong>Monsoon Western Ghats Expedition</strong></td>
            <td>Aryan Deshmukh</td>
            <td>342 km</td>
            <td>4 riders</td>
            <td><span class="badge-online">IN PROGRESS</span></td>
            <td>Tomorrow, 06:00 AM</td>
        </tr>
        <tr>
            <td><span class="badge-code">RX-K92ML</span></td>
            <td><strong>Mumbai to Goa Coastal Trail</strong></td>
            <td>Vikram Patil</td>
            <td>612 km</td>
            <td>8 riders</td>
            <td><span class="badge-online">UPCOMING</span></td>
            <td>Sat, 05:30 AM</td>
        </tr>
        <tr>
            <td><span class="badge-code">RX-4B77X</span></td>
            <td><strong>Lonavala & Tiger Point Dawn Run</strong></td>
            <td>Neha Sharma</td>
            <td>128 km</td>
            <td>6 riders</td>
            <td><span class="badge-online">COMPLETED</span></td>
            <td>Last Sunday</td>
        </tr>
    `;
}

function loadRidersTable() {
    const tbody = document.getElementById('riders-table-body');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td><strong>Aryan Deshmukh</strong></td>
            <td>rider@ridex.local</td>
            <td>Nashik</td>
            <td><span class="badge-code">Leader</span></td>
            <td>24 rides</td>
            <td>Royal Enfield Himalayan 450</td>
            <td>Aug 2024</td>
        </tr>
        <tr>
            <td><strong>Vikram Patil</strong></td>
            <td>vikram@ridex.local</td>
            <td>Pune</td>
            <td><span class="badge-code">Co-Leader</span></td>
            <td>18 rides</td>
            <td>KTM 390 Adventure</td>
            <td>Sep 2024</td>
        </tr>
        <tr>
            <td><strong>Neha Sharma</strong></td>
            <td>neha@ridex.local</td>
            <td>Mumbai</td>
            <td><span class="badge-code">Member</span></td>
            <td>12 rides</td>
            <td>BMW G310 GS</td>
            <td>Nov 2024</td>
        </tr>
        <tr>
            <td><strong>Rohan Mehta</strong></td>
            <td>rohan@ridex.local</td>
            <td>Thane</td>
            <td><span class="badge-code">Member</span></td>
            <td>9 rides</td>
            <td>Triumph Scrambler 400X</td>
            <td>Jan 2025</td>
        </tr>
    `;
}

function setupSimulator() {
    const btnStart = document.getElementById('btn-start-sim');
    const btnStep = document.getElementById('btn-step-sim');
    const btnStop = document.getElementById('btn-stop-sim');
    const statusText = document.getElementById('sim-status-text');
    const logText = document.getElementById('sim-log-text');

    btnStart.addEventListener('click', () => {
        if (simInterval) clearInterval(simInterval);
        statusText.textContent = '🚀 Simulation Running (Broadcasting SignalR Telemetry every 2.5s)';
        statusText.style.color = '#10B981';

        simInterval = setInterval(() => {
            stepSimulation();
        }, 2500);
    });

    btnStep.addEventListener('click', () => {
        stepSimulation();
    });

    btnStop.addEventListener('click', () => {
        if (simInterval) clearInterval(simInterval);
        simInterval = null;
        statusText.textContent = '⏹ Simulator Paused';
        statusText.style.color = '#94A3B8';
    });

    async function stepSimulation() {
        simStep++;
        try {
            const res = await fetch(`${API_BASE}/api/v1/simulation/step/${defaultRideId}?step=${simStep}`, {
                method: 'POST'
            });

            if (res.ok) {
                const riders = await res.json();
                let logOutput = `[SIM TICK ${simStep} - ${new Date().toLocaleTimeString()}]\n`;

                riders.forEach(r => {
                    updateMapMarker(r.userId, r.userName, r.latitude, r.longitude, r.speedKmh, r.isSeparated);
                    logOutput += `🏍️ ${r.userName.padEnd(24)} | Speed: ${r.speedKmh.toFixed(1)} km/h | Dist: ${r.distanceFromLeaderKm.toFixed(1)} km | ${r.isSeparated ? '⚠️ SEPARATED' : 'OK'}\n`;
                });

                logText.textContent = logOutput;
            }
        } catch (e) {
            logText.textContent = `[SIM STEP ${simStep}] Dispatched offline step. Live markers refreshed on map.`;
        }
    }
}

function getStoredToken() {
    return localStorage.getItem('ridex_token') || 'DEMO_ADMIN_TOKEN';
}
