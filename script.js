// ===== CONFIGURATION =====
const BACKEND_URL = 'https://gps-tracker-backend-g1w7.onrender.com/';

// ===== GLOBAL VARIABLES =====
let map;
let routeLayer;
let markersLayer;
let autoRefreshInterval;

// ===== INITIALIZE MAP =====
function initMap() {
    map = L.map('map').setView([45.4642, 9.1900], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    routeLayer = L.layerGroup().addTo(map);
    markersLayer = L.layerGroup().addTo(map);
}

// ===== SHOW STATUS MESSAGE =====
function showStatus(message, type = 'loading') {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    statusEl.style.display = 'block';
}

// ===== HIDE STATUS MESSAGE =====
function hideStatus() {
    document.getElementById('status').style.display = 'none';
}

// ===== LOAD ROUTE FROM BACKEND =====
async function loadRoute() {
    const deviceId = document.getElementById('deviceId').value.trim();

    if (!deviceId) {
        alert('Please enter a device ID');
        return;
    }

    showStatus('Loading GPS data...', 'loading');
    document.getElementById('loadBtn').disabled = true;

    try {
        const response = await fetch(`${BACKEND_URL}/api/locations?device_id=${deviceId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.status === 'success' && data.locations.length > 0) {
            displayRoute(data.locations);
            updateInfoPanel(data.locations);
            showStatus(`Loaded ${data.locations.length} GPS points`, 'success');
            setTimeout(hideStatus, 3000);
        } else {
            showStatus('No GPS data found for this device', 'error');
            setTimeout(hideStatus, 3000);
        }
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        document.getElementById('loadBtn').disabled = false;
    }
}

// ===== DISPLAY ROUTE ON MAP =====
function displayRoute(locations) {
    routeLayer.clearLayers();
    markersLayer.clearLayers();

    const coordinates = locations.map(loc => [loc.latitude, loc.longitude]);

    const routeLine = L.polyline(coordinates, {
        color: '#3498db',
        weight: 4,
        opacity: 0.7
    }).addTo(routeLayer);

    const startLoc = locations[0];
    L.marker([startLoc.latitude, startLoc.longitude]).addTo(markersLayer);

    const endLoc = locations[locations.length - 1];
    L.marker([endLoc.latitude, endLoc.longitude]).addTo(markersLayer);

    map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
}

// ===== UPDATE INFO PANEL =====
function updateInfoPanel(locations) {
    document.getElementById('totalPoints').textContent = locations.length;

    const latestLoc = locations[locations.length - 1];
    document.getElementById('latestTime').textContent = new Date(latestLoc.timestamp).toLocaleString();
    document.getElementById('currentPos').textContent =
        `${latestLoc.latitude.toFixed(4)}, ${latestLoc.longitude.toFixed(4)}`;
    document.getElementById('backendStatus').textContent = '✅ Connected';
}

// ===== CLEAR MAP =====
function clearMap() {
    routeLayer.clearLayers();
    markersLayer.clearLayers();
    document.getElementById('totalPoints').textContent = '0';
    document.getElementById('latestTime').textContent = '-';
    document.getElementById('currentPos').textContent = '-';
    hideStatus();
}

// ===== AUTO REFRESH =====
function toggleAutoRefresh() {
    const checkbox = document.getElementById('autoRefresh');

    if (checkbox.checked) {
        autoRefreshInterval = setInterval(loadRoute, 10000);
        showStatus('Auto-refresh enabled', 'success');
        setTimeout(hideStatus, 2000);
    } else {
        clearInterval(autoRefreshInterval);
        showStatus('Auto-refresh disabled', 'loading');
        setTimeout(hideStatus, 2000);
    }
}

// ===== CHECK BACKEND HEALTH =====
async function checkBackend() {
    try {
        const response = await fetch(`${BACKEND_URL}/health`);
        const data = await response.json();

        if (data.status === 'ok') {
            document.getElementById('backendStatus').textContent = '✅ Connected';
        }
    } catch {
        document.getElementById('backendStatus').textContent = '❌ Offline';
    }
}

// ===== INITIALIZE ON PAGE LOAD =====
window.onload = function () {
    initMap();
    checkBackend();
};
