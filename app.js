/**
 * BUSCA CEP — Application Logic
 * State management · ViaCEP API · Nominatim geocoding · Leaflet map
 */

/* ── State ────────────────────────────────────────────── */
const state = {
  cep: '',
  address: null,
  loading: false,
  error: null,
  coords: null,
};

/* ── DOM References ───────────────────────────────────── */
const cepInput       = document.getElementById('cep-input');
const btnSearch      = document.getElementById('btn-search');
const btnClear       = document.getElementById('btn-clear');
const loadingEl      = document.getElementById('loading-spinner');
const errorEl        = document.getElementById('error-message');
const errorTextEl    = document.getElementById('error-text');
const resultsSection = document.getElementById('results-section');
const addressCard    = document.getElementById('address-card');
const addressBadge   = document.getElementById('address-badge');
const mapCoordsEl    = document.getElementById('map-coords');
const coordsTextEl   = document.getElementById('coords-text');
const mapPlaceholder = document.getElementById('map-placeholder');

/* ── Leaflet Map ──────────────────────────────────────── */
let map = null;
let marker = null;

const MAP_CENTER_BR = [-15.7801, -47.9292]; // Brasília, Brasil
const MAP_ZOOM_DEFAULT = 4;
const MAP_ZOOM_STREET   = 16;

/**
 * Initialise the Leaflet map on page load.
 */
function initMap() {
  map = L.map('map', {
    center: MAP_CENTER_BR,
    zoom: MAP_ZOOM_DEFAULT,
    zoomControl: true,
    attributionControl: true,
  });

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
  }).addTo(map);
}

/**
 * Move the map to given coordinates and add/update marker.
 * @param {number} lat
 * @param {number} lon
 */
function updateMap(lat, lon) {
  if (!map) return;

  // Hide placeholder overlay
  mapPlaceholder.classList.add('hidden');

  // Fly to address with smooth animation
  map.flyTo([lat, lon], MAP_ZOOM_STREET, { duration: 1.4, easeLinearity: 0.25 });

  // Build popup content
  const addr = state.address;
  const popupHtml = `
    <div class="popup-title">📍 ${addr.cep}</div>
    <div class="popup-address">
      ${addr.logradouro ? addr.logradouro + '<br>' : ''}
      ${addr.bairro ? addr.bairro + ' · ' : ''}${addr.localidade} / ${addr.uf}
    </div>
  `;

  // Create or update marker
  if (marker) {
    marker.setLatLng([lat, lon]).setPopupContent(popupHtml);
  } else {
    marker = L.marker([lat, lon]).addTo(map).bindPopup(popupHtml);
  }

  marker.openPopup();

  // Show coordinates
  mapCoordsEl.style.display = 'flex';
  coordsTextEl.textContent =
    `Lat: ${parseFloat(lat).toFixed(5)}, Lon: ${parseFloat(lon).toFixed(5)}`;

  state.coords = { lat, lon };
}

/**
 * Reset map to default Brazil view and remove marker.
 */
function resetMap() {
  if (!map) return;

  if (marker) {
    map.removeLayer(marker);
    marker = null;
  }

  map.flyTo(MAP_CENTER_BR, MAP_ZOOM_DEFAULT, { duration: 1, easeLinearity: 0.3 });

  mapPlaceholder.classList.remove('hidden');
  mapCoordsEl.style.display = 'none';
  coordsTextEl.textContent = '';
}

/* ── CEP Mask ─────────────────────────────────────────── */
/**
 * Apply XXXXX-XXX mask to the input value.
 * Returns digits-only string.
 * @param {string} value
 * @returns {string} masked value
 */
function applyMask(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

/* ── Validation ───────────────────────────────────────── */
/**
 * Validate the raw CEP (digits only).
 * Returns null if valid, or an error message string.
 * @param {string} digits
 * @returns {string|null}
 */
function validateCep(digits) {
  if (!digits || digits.trim() === '') return 'Digite um CEP para buscar.';
  if (digits.length < 8) return 'O CEP deve conter 8 dígitos.';
  return null;
}

/* ── UI Helpers ───────────────────────────────────────── */
let errorTimeout = null;

/**
 * Show or hide the loading spinner and disable/enable search button.
 * @param {boolean} isLoading
 */
function setLoading(isLoading) {
  state.loading = isLoading;
  loadingEl.style.display = isLoading ? 'flex' : 'none';
  btnSearch.disabled = isLoading;
  if (isLoading) hideError();
}

/**
 * Display an error message with auto-hide after 6 seconds.
 * @param {string} message
 */
function showError(message) {
  state.error = message;
  errorTextEl.textContent = message;
  errorEl.style.display = 'flex';

  // Force reflow to restart animation
  errorEl.classList.remove('animate');
  void errorEl.offsetWidth;
  errorEl.classList.add('animate');

  clearTimeout(errorTimeout);
  errorTimeout = setTimeout(hideError, 6000);
}

function hideError() {
  errorEl.style.display = 'none';
  state.error = null;
}

/**
 * Update the visibility of the clear button.
 */
function updateClearBtn() {
  const hasValue = cepInput.value.length > 0;
  btnClear.style.display = hasValue ? 'flex' : 'none';
}

/* ── Address Rendering ────────────────────────────────── */
/**
 * Populate the address card with data from ViaCEP.
 * @param {object} data
 */
function renderAddress(data) {
  document.getElementById('val-cep').textContent       = data.cep        || '—';
  document.getElementById('val-logradouro').textContent = data.logradouro || 'Não informado';
  document.getElementById('val-bairro').textContent    = data.bairro     || 'Não informado';
  document.getElementById('val-complemento').textContent = data.complemento || 'Não informado';
  document.getElementById('val-cidade').textContent    = data.localidade  || '—';
  document.getElementById('val-estado').textContent    = data.estado      || data.uf || '—';
  document.getElementById('val-ddd').textContent       = data.ddd         || '—';
  document.getElementById('val-ibge').textContent      = data.ibge        || '—';
  document.getElementById('val-regiao').textContent    = data.regiao      || '—';
  document.getElementById('val-uf').textContent        = data.uf          || '—';

  // Badge with UF
  addressBadge.textContent = data.uf ? `${data.localidade} · ${data.uf}` : '';

  // Show results section and address card
  resultsSection.style.display = 'grid';

  // Corrige o problema de proporção do Leaflet quando o container se torna visível
  if (map) {
    map.invalidateSize();
  }

  // Re-trigger stagger animations on address items
  const items = addressCard.querySelectorAll('.address-item');
  items.forEach(item => {
    item.style.animation = 'none';
    void item.offsetWidth; // reflow
    item.style.animation = '';
  });
}

/* ── ViaCEP API ───────────────────────────────────────── */
/**
 * Fetch address data from ViaCEP.
 * @param {string} cep - 8 digits, no mask
 * @returns {Promise<object>}
 */
async function fetchViaCEP(cep) {
  const url = `https://viacep.com.br/ws/${cep}/json/`;
  const response = await fetch(url);

  if (response.status === 400) {
    throw new Error('CEP inválido. Verifique o número digitado.');
  }

  if (!response.ok) {
    throw new Error(`Erro ao acessar o serviço (${response.status}). Tente novamente.`);
  }

  const data = await response.json();

  if (data.erro === true || data.erro === 'true') {
    throw new Error('CEP não encontrado. Verifique se o número está correto.');
  }

  return data;
}

/* ── Nominatim Geocoding ──────────────────────────────── */
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT     = 'BuscaCEP-App/1.0 (educational-project)';

/**
 * Try to geocode using Nominatim with a given query string.
 * @param {string} query
 * @returns {Promise<{lat: number, lon: number}|null>}
 */
async function nominatimSearch(query) {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
    countrycodes: 'br',
    addressdetails: '0',
  });

  const response = await fetch(`${NOMINATIM_BASE}?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!response.ok) return null;

  const results = await response.json();
  if (results && results.length > 0) {
    return { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon) };
  }

  return null;
}

/**
 * Geocode an address from ViaCEP data using Nominatim.
 * Falls back from full address → city/state → state only.
 * @param {object} data - ViaCEP response
 */
async function geocodeAddress(data) {
  const { logradouro, bairro, localidade, uf, cep } = data;

  // Strategy 1: Full address with CEP
  if (logradouro && localidade) {
    const q1 = `${logradouro}, ${bairro ? bairro + ', ' : ''}${localidade}, ${uf}, Brasil`;
    const result = await nominatimSearch(q1);
    if (result) { updateMap(result.lat, result.lon); return; }
  }

  // Strategy 2: City + state
  if (localidade) {
    const q2 = `${localidade}, ${uf}, Brasil`;
    const result = await nominatimSearch(q2);
    if (result) { updateMap(result.lat, result.lon); return; }
  }

  // Strategy 3: State only
  if (uf) {
    const result = await nominatimSearch(`${uf}, Brasil`);
    if (result) { updateMap(result.lat, result.lon); return; }
  }

  // Geocoding failed silently — map stays at default view
  console.warn('Geocodificação não encontrou coordenadas para este endereço.');
}

/* ── Search Handler ───────────────────────────────────── */
/**
 * Main handler: validate → fetch ViaCEP → render → geocode.
 */
async function handleSearch() {
  hideError();

  const rawCep = cepInput.value.replace(/\D/g, '');
  const validationError = validateCep(rawCep);

  if (validationError) {
    showError(validationError);
    cepInput.focus();
    return;
  }

  setLoading(true);

  try {
    const data = await fetchViaCEP(rawCep);
    state.address = data;
    renderAddress(data);

    // Invalidate previous coords
    state.coords = null;

    // Geocode (non-blocking for UX)
    geocodeAddress(data).catch(() => {
      console.warn('Erro ao geocodificar endereço.');
    });

  } catch (err) {
    showError(err.message || 'Ocorreu um erro inesperado. Tente novamente.');
    // Hide results if a previous search was shown
    if (!state.address) {
      resultsSection.style.display = 'none';
    }
  } finally {
    setLoading(false);
  }
}

/* ── Clear Handler ────────────────────────────────────── */
/**
 * Reset entire app state, UI and map.
 */
function clearAll() {
  // State
  state.cep     = '';
  state.address = null;
  state.error   = null;
  state.coords  = null;
  state.loading = false;

  // Input
  cepInput.value = '';
  updateClearBtn();
  hideError();

  // Hide results
  resultsSection.style.display = 'none';

  // Reset map
  resetMap();

  // Focus input
  cepInput.focus();
}

/* ── Event Listeners ──────────────────────────────────── */

// Search button click
btnSearch.addEventListener('click', handleSearch);

// Clear button click
btnClear.addEventListener('click', clearAll);

// Enter key in input
cepInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSearch();
  if (e.key === 'Escape') clearAll();
});

// Input mask + clear button visibility
cepInput.addEventListener('input', () => {
  const masked = applyMask(cepInput.value);
  cepInput.value = masked;
  state.cep = masked.replace(/\D/g, '');
  updateClearBtn();

  // Hide error when user starts typing
  if (state.error) hideError();
});

/* ── Init ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  cepInput.focus();
});
