let allPathologies = [];
let currentView = 'home';
let currentLabId = null;
let leafletMaps = {};
let userLocation = null;

const VIEWS = ['home', 'labs', 'labDetail', 'compare', 'addLab', 'editLab', 'addTest'];

document.addEventListener('DOMContentLoaded', () => {
  loadHome();
});

function showLoading(show) {
  document.getElementById('loadingSpinner').classList.toggle('d-none', !show);
}

function showView(view, data) {
  VIEWS.forEach(v => {
    const el = document.getElementById(v + 'View');
    if (el) el.classList.toggle('d-none', v !== view);
  });
  currentView = view;

  if (view === 'home') loadHome();
  else if (view === 'labs') loadLabs();
  else if (view === 'labDetail' && data) loadLabDetail(data);
  else if (view === 'compare') loadCompare();
  else if (view === 'addLab') initLocationPicker('newLab');
  else if (view === 'editLab' && data) populateEditForm(data);

  setTimeout(() => {
    if (view === 'home') initHeroMap();
    else if (view === 'labs') {
      const section = document.getElementById('labsMapSection');
      if (!section.classList.contains('d-none')) initLabsMap();
    }
    else if (view === 'labDetail' && data) initDetailMap(data);
  }, 300);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ======================== HOME ======================== */
async function loadHome() {
  showLoading(true);
  try {
    const stats = await API.getStats();
    document.getElementById('statLabs').textContent = stats.totalLabs;
    document.getElementById('statTests').textContent = stats.totalTests;
    document.getElementById('statRating').textContent = stats.avgRating || '—';
    document.getElementById('statReviews').textContent = stats.totalReviews;
    document.getElementById('navStats').innerHTML = `<i class="bi bi-building"></i> ${stats.totalLabs} labs · ${stats.totalTests} tests`;

    const labs = await API.getPathologies();
    allPathologies = labs;
    const top = [...labs].sort((a, b) => b.rating - a.rating).slice(0, 4);
    document.getElementById('topLabsCarousel').innerHTML = top.map(l => createLabCard(l)).join('');
    initHeroMap();
  } catch (err) { console.error(err); }
  finally { showLoading(false); }
}

/* ======================== LEAFLET MAPS ======================== */
const osmTile = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const osmAttr = '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function createLeafletMap(containerId, labs, centerLat, centerLng, radiusKm) {
  const container = document.getElementById(containerId);
  if (!container) return null;

  if (leafletMaps[containerId]) {
    leafletMaps[containerId].remove();
    delete leafletMaps[containerId];
  }
  container.innerHTML = '';

  const center = centerLat ? [centerLat, centerLng]
    : (labs.length > 0 ? [labs[0].latitude, labs[0].longitude] : [12.9716, 77.6413]);

  const map = L.map(container, {
    center,
    zoom: 12,
    zoomControl: true,
    attributionControl: true
  });

  L.tileLayer(osmTile, { attribution: osmAttr, maxZoom: 19 }).addTo(map);

  setTimeout(() => map.invalidateSize(), 100);

  labs.forEach(lab => {
    const stars = renderStars(lab.rating);
    const popupHtml = `<div style="font-family:Inter,sans-serif;min-width:180px;line-height:1.5">
      <strong style="font-size:1rem">${lab.name}</strong><br>
      <span style="color:#f59e0b">${stars}</span> <strong>${lab.rating}</strong>
      <span style="color:#94a3b8;font-size:0.85rem">(${lab.total_reviews || 0})</span><br>
      <span style="color:#64748b;font-size:0.85rem">${(lab.address || '').substring(0, 50)}</span><br>
      <span style="color:#059669;font-weight:600">${lab.tests?.length || 0} tests</span>
      <br><button onclick="showView('labDetail',${lab.id})" style="margin-top:6px;padding:4px 12px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:0.8rem">View Details</button>
    </div>`;

    const marker = L.circleMarker([lab.latitude, lab.longitude], {
      radius: 10,
      fillColor: '#2563eb',
      fillOpacity: 0.9,
      color: '#fff',
      weight: 2
    }).addTo(map);

    marker.bindPopup(popupHtml);
    marker.bindTooltip(lab.name, { direction: 'top', offset: [0, -12] });
  });

  if (centerLat && radiusKm) {
    L.circle([centerLat, centerLng], {
      radius: radiusKm * 1000,
      color: '#2563eb',
      fillColor: '#2563eb',
      fillOpacity: 0.06,
      weight: 1.5,
      dashArray: '6, 8'
    }).addTo(map);

    L.circleMarker([centerLat, centerLng], {
      radius: 8,
      fillColor: '#dc2626',
      fillOpacity: 1,
      color: '#fff',
      weight: 2.5
    }).addTo(map).bindTooltip('Your Location', { direction: 'top' });
  }

  leafletMaps[containerId] = map;
  return map;
}

function initHeroMap() {
  createLeafletMap('heroMap', allPathologies.slice(0, 5));
}

function initLabsMap() {
  createLeafletMap('labsMap', allPathologies);
}

function initDetailMap(labId) {
  const lab = allPathologies.find(l => l.id === labId);
  if (!lab) return;
  const map = createLeafletMap('detailMap', [lab], lab.latitude, lab.longitude, 0);
  if (map) {
    const marker = L.circleMarker([lab.latitude, lab.longitude], {
      radius: 12,
      fillColor: '#2563eb',
      fillOpacity: 1,
      color: '#fff',
      weight: 3
    }).addTo(map);
    marker.bindTooltip(lab.name, { direction: 'top' });
  }
}

function getUserLocation() {
  if (!navigator.geolocation) {
    showToast('Geolocation not supported by your browser.', 'warning');
    return;
  }
  showLoading(true);
  navigator.geolocation.getCurrentPosition(
    pos => {
      userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      document.getElementById('searchLat').value = pos.coords.latitude.toFixed(4);
      document.getElementById('searchLng').value = pos.coords.longitude.toFixed(4);
      findNearbyLabs();
      showToast('Location detected!', 'success');
    },
    err => {
      showLoading(false);
      showToast('Could not get location. Please enter coordinates manually.', 'warning');
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

function useSampleLocation() {
  document.getElementById('searchLat').value = '12.9716';
  document.getElementById('searchLng').value = '77.6413';
  findNearbyLabs();
}

async function findNearbyLabs() {
  const lat = document.getElementById('searchLat').value;
  const lng = document.getElementById('searchLng').value;
  const container = document.getElementById('searchResults');
  if (!lat || !lng) { container.innerHTML = '<div class="alert alert-warning">Please enter latitude and longitude.</div>'; return; }
  showLoading(true);
  try {
    const labs = await API.getPathologies(`?lat=${lat}&lng=${lng}&radius=5`);
    container.innerHTML = labs.length > 0
      ? `<div class="mb-3"><div id="searchResultMap" style="height:260px;border-radius:12px;background:#e8f0fe"></div></div><h6 class="fw-bold mb-2">${labs.length} lab(s) found near you</h6><div class="row g-3">${labs.map(l => createLabCard(l, true)).join('')}</div>`
      : '<div class="alert alert-info">No labs found within 5 km. Try a different location.</div>';
    if (labs.length > 0) {
      setTimeout(() => createLeafletMap('searchResultMap', labs, parseFloat(lat), parseFloat(lng), 5), 200);
    }
  } finally { showLoading(false); }
}

/* ======================== LOCATION PICKER ======================== */
const locationPickers = {};

function initLocationPicker(prefix) {
  const mapId = prefix + 'Map';
  const searchId = prefix + 'Search';
  const latId = prefix + 'Lat';
  const lngId = prefix + 'Lng';
  const coordsId = prefix + 'Coords';

  const container = document.getElementById(mapId);
  if (!container) return;

  if (locationPickers[prefix]) {
    locationPickers[prefix].map.invalidateSize();
    return;
  }

  if (typeof L === 'undefined') return;

  const map = L.map(container, {
    center: [12.9716, 77.6413],
    zoom: 13,
    zoomControl: true
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(map);

  setTimeout(() => map.invalidateSize(), 150);

  const marker = L.marker([12.9716, 77.6413], { draggable: true }).addTo(map);

  function updatePosition(lat, lng) {
    marker.setLatLng([lat, lng]);
    map.setView([lat, lng], map.getZoom());
    document.getElementById(latId).value = lat.toFixed(6);
    document.getElementById(lngId).value = lng.toFixed(6);
    const el = document.getElementById(coordsId);
    if (el) el.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    reverseGeocode(lat, lng, prefix);
  }

  marker.on('dragend', () => {
    const pos = marker.getLatLng();
    updatePosition(pos.lat, pos.lng);
  });

  map.on('click', e => {
    updatePosition(e.latlng.lat, e.latlng.lng);
  });

  locationPickers[prefix] = { map, marker, updatePosition };
}

function searchLocation(prefix) {
  const searchId = prefix + 'Search';
  const query = document.getElementById(searchId).value.trim();
  if (!query) return;

  showToast('Searching…', 'info');

  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
    .then(r => r.json())
    .then(results => {
      if (!results || results.length === 0) {
        showToast('No results found', 'warning');
        return;
      }
      const loc = results[0];
      const lat = parseFloat(loc.lat);
      const lng = parseFloat(loc.lon);
      const picker = locationPickers[prefix];
      if (picker) {
        picker.updatePosition(lat, lng);
      }
      if (!document.getElementById(prefix + 'Address').value) {
        document.getElementById(prefix + 'Address').value = loc.display_name;
      }
      showToast(`Found: ${loc.display_name.substring(0, 60)}…`, 'success');
    })
    .catch(() => showToast('Search failed', 'danger'));
}

function reverseGeocode(lat, lng, prefix) {
  const addrId = prefix + 'Address';
  const current = document.getElementById(addrId).value;
  if (current && !current.endsWith('(auto)')) return;

  fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`)
    .then(r => r.json())
    .then(data => {
      if (data && data.display_name) {
        document.getElementById(addrId).value = data.display_name;
      }
    })
    .catch(() => {});
}

function setLocationPicker(prefix, lat, lng, address) {
  const picker = locationPickers[prefix];
  if (picker) {
    picker.updatePosition(lat, lng);
  }
  if (address) {
    document.getElementById(prefix + 'Address').value = address;
  }
  document.getElementById(prefix + 'Lat').value = lat;
  document.getElementById(prefix + 'Lng').value = lng;
}

/* ======================== LAB CARD ======================== */
function createLabCard(lab, showDistance = false) {
  const stars = renderStars(lab.rating);
  const dist = showDistance && lab.distance
    ? `<span class="lab-badge"><i class="bi bi-geo-alt"></i> ${lab.distance} km</span>` : '';
  return `
    <div class="col-md-6 col-lg-3">
      <div class="lab-card h-100 position-relative" onclick="showView('labDetail', ${lab.id})">
        <div class="position-relative">
          <img src="${lab.image_url || 'https://placehold.co/400x200/2563eb/ffffff?text=Lab'}" class="card-img-top" alt="${lab.name}">
          ${dist}
        </div>
        <div class="card-body">
          <h6 class="fw-bold mb-1">${lab.name}</h6>
          <p class="text-muted small mb-1"><i class="bi bi-geo-alt"></i> ${(lab.address || '').substring(0, 38)}${lab.address?.length > 38 ? '…' : ''}</p>
          <div class="mb-1"><span class="stars">${stars}</span> <span class="text-muted small">(${lab.total_reviews || 0})</span></div>
          <div class="d-flex gap-1 flex-wrap">
            <span class="lab-tag">${lab.tests?.length || 0} tests</span>
            <span class="lab-tag">${lab.rating} ★</span>
          </div>
        </div>
      </div>
    </div>`;
}

function renderStars(rating) {
  const r = Math.round(rating * 2) / 2;
  return '★'.repeat(Math.floor(r)) + (r % 1 ? '½' : '') + '☆'.repeat(5 - Math.ceil(r));
}

/* ======================== LABS LIST ======================== */
async function loadLabs() {
  showLoading(true);
  try {
    allPathologies = await API.getPathologies();
    renderLabs();
  } finally { showLoading(false); }
}

function renderLabs() {
  const q = (document.getElementById('labSearchFilter')?.value || '').toLowerCase();
  const filtered = allPathologies.filter(l => l.name.toLowerCase().includes(q) || (l.address || '').toLowerCase().includes(q));
  document.getElementById('labsList').innerHTML = filtered.length > 0
    ? filtered.map(l => createLabCard(l)).join('')
    : '<div class="col-12"><div class="alert alert-info text-center">No labs found.</div></div>';
}

/* ======================== LAB DETAIL ======================== */
async function loadLabDetail(labId) {
  showLoading(true);
  try {
    const lab = await API.getPathology(labId);
    currentLabId = labId;
    const container = document.getElementById('labDetailContent');
    const stars = renderStars(lab.rating);

    container.innerHTML = `
      <div class="card border-0 shadow-sm rounded-4 mb-3 overflow-hidden">
        <div class="row g-0">
          <div class="col-md-4">
            <img src="${lab.image_url || 'https://placehold.co/400x300/2563eb/ffffff?text=Lab'}" class="img-fluid h-100" style="object-fit:cover;min-height:220px" alt="${lab.name}">
          </div>
          <div class="col-md-8">
            <div class="card-body p-4">
              <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                <div>
                  <h3 class="fw-bold mb-1">${lab.name}</h3>
                  <p class="text-muted mb-1"><i class="bi bi-geo-alt"></i> ${lab.address}</p>
                </div>
                <div class="text-end">
                  <div class="stars fs-5">${stars}</div>
                  <div class="fw-bold fs-4">${lab.rating} <small class="text-muted fs-6 fw-normal">/ 5</small></div>
                  <span class="text-muted small">${lab.total_reviews || 0} reviews</span>
                </div>
              </div>
              <div class="d-flex flex-wrap gap-3 small text-muted mb-3">
                ${lab.phone ? `<span><i class="bi bi-telephone"></i> ${lab.phone}</span>` : ''}
                ${lab.email ? `<span><i class="bi bi-envelope"></i> ${lab.email}</span>` : ''}
                ${lab.opening_hours ? `<span><i class="bi bi-clock"></i> ${lab.opening_hours}</span>` : ''}
                ${lab.website ? `<span><i class="bi bi-globe"></i> <a href="${lab.website}" target="_blank" class="text-decoration-none">Website</a></span>` : ''}
              </div>
              ${lab.about ? `<p>${lab.about}</p>` : ''}
              <div class="d-flex gap-2 flex-wrap">
                <button class="btn btn-sm btn-warning" onclick="showView('editLab', ${lab.id})"><i class="bi bi-pencil"></i> Edit</button>
                <button class="btn btn-sm btn-outline-success" onclick="showAddTest(${lab.id}, '${lab.name.replace(/'/g, "\\'")}')"><i class="bi bi-flask"></i> Add Test</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteLab(${lab.id})"><i class="bi bi-trash"></i> Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-3">
        <div class="col-md-7">
          <div class="card border-0 shadow-sm rounded-4 h-100">
            <div class="card-header bg-white rounded-top-4 d-flex justify-content-between align-items-center py-3">
              <h5 class="mb-0 fw-bold"><i class="bi bi-flask text-success"></i> Tests & Prices</h5>
              <button class="btn btn-sm btn-outline-success rounded-pill" onclick="showAddTest(${lab.id}, '${lab.name.replace(/'/g, "\\'")}')"><i class="bi bi-plus"></i> Add</button>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light"><tr><th>Test</th><th>Price</th><th>TAT</th><th></th></tr></thead>
                  <tbody>
                    ${lab.tests.length > 0 ? lab.tests.map(t => `
                      <tr>
                        <td><strong>${t.name}</strong>${t.description ? `<br><small class="text-muted">${t.description}</small>` : ''}</td>
                        <td class="price">₹ ${t.price}</td>
                        <td><small class="text-muted">${t.turnaround_time || '—'}</small></td>
                        <td><button class="btn btn-sm btn-outline-danger" onclick="deleteTest(${t.id})"><i class="bi bi-trash"></i></button></td>
                      </tr>`).join('')
                    : '<tr><td colspan="4" class="text-center text-muted py-4">No tests added yet</td></tr>'}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-5">
          <div class="card border-0 shadow-sm rounded-4 mb-3">
            <div class="card-body p-0">
              <div id="detailMap" style="height:220px;border-radius:12px;background:#e8f0fe"></div>
            </div>
          </div>
          <div class="card border-0 shadow-sm rounded-4">
            <div class="card-header bg-white rounded-top-4 d-flex justify-content-between align-items-center py-3">
              <h5 class="mb-0 fw-bold"><i class="bi bi-chat text-primary"></i> Reviews</h5>
            </div>
            <div class="card-body" style="max-height:350px;overflow-y:auto">
              ${lab.reviews.length > 0 ? lab.reviews.map(r => `
                <div class="review-item">
                  <div class="d-flex justify-content-between">
                    <strong>${r.user_name}</strong>
                    <span class="stars stars-sm">${renderStars(r.rating)}</span>
                  </div>
                  ${r.comment ? `<p class="mb-0 small mt-1">${r.comment}</p>` : ''}
                  <small class="text-muted">${new Date(r.created_at).toLocaleDateString()}</small>
                </div>`).join('')
              : '<p class="text-muted text-center mb-0 py-2">No reviews yet</p>'}
              <hr>
              <h6 class="fw-bold">Write a Review</h6>
              <form onsubmit="addReview(event, ${lab.id})">
                <div class="mb-2"><input type="text" class="form-control" id="reviewName" placeholder="Your name" required></div>
                <div class="mb-2">
                  <select class="form-select" id="reviewRating" required>
                    <option value="">Rating…</option>
                    ${[5,4,3,2,1].map(i => `<option value="${i}">${'★'.repeat(i)}${'☆'.repeat(5-i)}</option>`).join('')}
                  </select>
                </div>
                <div class="mb-2"><textarea class="form-control" id="reviewComment" rows="2" placeholder="Share your experience…"></textarea></div>
                <button type="submit" class="btn btn-primary btn-sm w-100"><i class="bi bi-send"></i> Submit</button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <button class="btn btn-outline-primary rounded-pill px-4" onclick="showView('compare')"><i class="bi bi-bar-chart"></i> Compare with Others</button>
    `;

    setTimeout(() => initDetailMap(labId), 300);
  } catch (err) { console.error(err); }
  finally { showLoading(false); }
}

/* ======================== REVIEWS CRUD ======================== */
async function addReview(event, pathologyId) {
  event.preventDefault();
  try {
    await API.createReview({
      pathology_id: pathologyId,
      user_name: document.getElementById('reviewName').value,
      rating: parseInt(document.getElementById('reviewRating').value),
      comment: document.getElementById('reviewComment').value
    });
    showToast('Review added!', 'success');
    document.getElementById('reviewName').value = '';
    document.getElementById('reviewRating').value = '';
    document.getElementById('reviewComment').value = '';
    loadLabDetail(pathologyId);
  } catch (err) { console.error(err); }
}

async function deleteLab(id) {
  if (!confirm('Delete this lab and all its data?')) return;
  try { await API.deletePathology(id); showToast('Lab deleted', 'success'); showView('labs'); }
  catch (err) { console.error(err); }
}

async function deleteTest(id) {
  if (!confirm('Delete this test?')) return;
  try { await API.deleteTest(id); showToast('Test deleted', 'success'); if (currentLabId) loadLabDetail(currentLabId); }
  catch (err) { console.error(err); }
}

/* ======================== ADD TEST ======================== */
function showAddTest(labId, labName) {
  document.getElementById('addTestLabId').value = labId;
  document.getElementById('addTestLabName').textContent = labName;
  ['newTestName','newTestPrice','newTestDesc','newTestTAT'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('addTestView').classList.remove('d-none');
}
function hideAddTest() { document.getElementById('addTestView').classList.add('d-none'); }

async function addNewTest(event) {
  event.preventDefault();
  try {
    await API.createTest({
      pathology_id: parseInt(document.getElementById('addTestLabId').value),
      name: document.getElementById('newTestName').value,
      price: parseFloat(document.getElementById('newTestPrice').value),
      description: document.getElementById('newTestDesc').value,
      turnaround_time: document.getElementById('newTestTAT').value
    });
    showToast('Test added!', 'success');
    hideAddTest();
    if (currentLabId) loadLabDetail(currentLabId);
  } catch (err) { console.error(err); }
}

/* ======================== ADD LAB ======================== */
async function addNewLab(event) {
  event.preventDefault();
  const lat = parseFloat(document.getElementById('newLabLat').value);
  const lng = parseFloat(document.getElementById('newLabLng').value);
  if (!lat || !lng) {
    showToast('Please set the location by clicking on the map.', 'warning');
    return;
  }
  try {
    await API.createPathology({
      name: document.getElementById('newLabName').value,
      address: document.getElementById('newLabAddress').value,
      latitude: lat,
      longitude: lng,
      phone: document.getElementById('newLabPhone').value,
      email: document.getElementById('newLabEmail').value,
      website: document.getElementById('newLabWebsite').value,
      opening_hours: document.getElementById('newLabHours').value,
      about: document.getElementById('newLabAbout').value
    });
    showToast('Lab added!', 'success');
    document.getElementById('addLabForm').reset();
    if (locationPickers['newLab']) {
      locationPickers['newLab'].map.remove();
      delete locationPickers['newLab'];
    }
    showView('labs');
  } catch (err) { console.error(err); }
}

/* ======================== EDIT LAB ======================== */
async function populateEditForm(labId) {
  try {
    const lab = await API.getPathology(labId);
    document.getElementById('editLabId').value = lab.id;
    document.getElementById('editLabName').value = lab.name;
    document.getElementById('editLabRating').value = lab.rating;
    document.getElementById('editLabPhone').value = lab.phone || '';
    document.getElementById('editLabEmail').value = lab.email || '';
    document.getElementById('editLabImage').value = lab.image_url || '';
    document.getElementById('editLabWebsite').value = lab.website || '';
    document.getElementById('editLabHours').value = lab.opening_hours || '';
    document.getElementById('editLabAbout').value = lab.about || '';
    document.getElementById('editLabAddress').value = lab.address || '';

    initLocationPicker('editLab');
    setTimeout(() => {
      setLocationPicker('editLab', lab.latitude, lab.longitude, lab.address);
    }, 300);
  } catch (err) { console.error(err); }
}

async function updateLab(event) {
  event.preventDefault();
  const id = parseInt(document.getElementById('editLabId').value);
  const lat = parseFloat(document.getElementById('editLabLat').value);
  const lng = parseFloat(document.getElementById('editLabLng').value);
  if (!lat || !lng) {
    showToast('Please set the location by clicking on the map.', 'warning');
    return;
  }
  try {
    await API.updatePathology(id, {
      name: document.getElementById('editLabName').value,
      address: document.getElementById('editLabAddress').value,
      latitude: lat,
      longitude: lng,
      rating: parseFloat(document.getElementById('editLabRating').value) || 0,
      phone: document.getElementById('editLabPhone').value,
      email: document.getElementById('editLabEmail').value,
      website: document.getElementById('editLabWebsite').value,
      image_url: document.getElementById('editLabImage').value,
      opening_hours: document.getElementById('editLabHours').value,
      about: document.getElementById('editLabAbout').value
    });
    if (locationPickers['editLab']) {
      locationPickers['editLab'].map.remove();
      delete locationPickers['editLab'];
    }
    showToast('Lab updated!', 'success');
    showView('labDetail', id);
  } catch (err) { console.error(err); }
}

/* ======================== COMPARE ======================== */
async function loadCompare() {
  try {
    const labs = await API.getPathologies();
    document.getElementById('compareSelect').innerHTML = labs.map(l =>
      `<option value="${l.id}">${l.name} — ${l.tests?.length || 0} tests, ${l.rating}★</option>`
    ).join('');
    document.getElementById('compareResults').innerHTML = '';
  } catch (err) { console.error(err); }
}

async function runComparison() {
  const sel = document.getElementById('compareSelect');
  const ids = Array.from(sel.selectedOptions).map(o => parseInt(o.value));
  if (ids.length < 2) { showToast('Select at least 2 labs.', 'warning'); return; }
  showLoading(true);
  try {
    const labs = await API.comparePathologies(ids);
    renderComparison(labs);
  } finally { showLoading(false); }
}

function renderComparison(labs) {
  const container = document.getElementById('compareResults');
  if (labs.length < 2) { container.innerHTML = '<div class="alert alert-info">Select at least 2 labs.</div>'; return; }

  const lowestPrices = {};
  labs.forEach(lab => (lab.tests || []).forEach(t => {
    if (!lowestPrices[t.name] || t.price < lowestPrices[t.name].price)
      lowestPrices[t.name] = { labId: lab.id, price: t.price };
  }));

  const allTests = [...new Set(labs.flatMap(l => (l.tests || []).map(t => t.name)))];

  let html = `<div class="card border-0 shadow-sm rounded-4 overflow-hidden">
    <div class="card-header bg-primary text-white py-3"><h5 class="mb-0 fw-bold"><i class="bi bi-bar-chart"></i> Comparison</h5></div>
    <div class="table-responsive">
      <table class="table table-bordered table-compare mb-0">
        <thead class="table-light"><tr><th>Feature</th>${labs.map(l => `<th class="text-center"><strong>${l.name}</strong><br><span class="stars stars-sm">${renderStars(l.rating)}</span> <small class="text-muted">${l.rating} (${l.total_reviews||0})</small></th>`).join('')}</tr></thead>
        <tbody>
          <tr><td><strong>Address</strong></td>${labs.map(l => `<td class="small">${l.address}</td>`).join('')}</tr>
          <tr><td><strong>Phone</strong></td>${labs.map(l => `<td>${l.phone || '—'}</td>`).join('')}</tr>
          <tr><td><strong>Hours</strong></td>${labs.map(l => `<td class="small">${l.opening_hours || '—'}</td>`).join('')}</tr>
          ${allTests.length ? `<tr><td colspan="${labs.length+1}" class="table-info fw-bold"><i class="bi bi-flask"></i> Test Prices</td></tr>` : ''}
          ${allTests.map(name => `<tr><td>${name}</td>${labs.map(lab => {
            const t = (lab.tests || []).find(t => t.name === name);
            const best = lowestPrices[name]?.labId === lab.id;
            return `<td class="text-center${best?' table-success':''}">${t ? `<span class="price">₹ ${t.price}</span>${best ? '<br><span class="badge bg-success" style="font-size:.7rem">Best</span>' : ''}<br><small class="text-muted">${t.turnaround_time||''}</small>` : '<span class="text-muted">—</span>'}</td>`;
          }).join('')}</tr>`).join('')}
          <tr><td colspan="${labs.length+1}" class="table-info fw-bold"><i class="bi bi-chat"></i> Recent Reviews</td></tr>`
          + labs.map(lab => `<tr><td><strong>${lab.name}</strong></td><td colspan="${labs.length>1?labs.length-1:1}">${lab.reviews?.length ? lab.reviews.slice(0,2).map(r => `<div class="review-item py-2 px-3 mb-1"><div class="d-flex justify-content-between"><strong>${r.user_name}</strong><span class="stars stars-sm">${renderStars(r.rating)}</span></div><small>${r.comment||''}</small></div>`).join('') : '<span class="text-muted">No reviews</span>'}</td></tr>`).join('')
      + `</tbody></table></div></div>`;

  container.innerHTML = html;
}
