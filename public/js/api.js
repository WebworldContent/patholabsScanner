const API = {
  async request(url, options = {}) {
    try {
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (err) {
      showToast(err.message, 'danger');
      throw err;
    }
  },

  getPathologies(params = '') {
    return this.request(`/api/pathologies${params}`);
  },

  getPathology(id) {
    return this.request(`/api/pathologies/${id}`);
  },

  createPathology(data) {
    return this.request('/api/pathologies', { method: 'POST', body: JSON.stringify(data) });
  },

  updatePathology(id, data) {
    return this.request(`/api/pathologies/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  deletePathology(id) {
    return this.request(`/api/pathologies/${id}`, { method: 'DELETE' });
  },

  comparePathologies(ids) {
    return this.request(`/api/pathologies/compare?ids=${ids.join(',')}`);
  },

  getTests(pathologyId) {
    const query = pathologyId ? `?pathology_id=${pathologyId}` : '';
    return this.request(`/api/tests${query}`);
  },

  createTest(data) {
    return this.request('/api/tests', { method: 'POST', body: JSON.stringify(data) });
  },

  updateTest(id, data) {
    return this.request(`/api/tests/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  deleteTest(id) {
    return this.request(`/api/tests/${id}`, { method: 'DELETE' });
  },

  getReviews(pathologyId) {
    return this.request(`/api/reviews/${pathologyId}`);
  },

  createReview(data) {
    return this.request('/api/reviews', { method: 'POST', body: JSON.stringify(data) });
  },

  deleteReview(id) {
    return this.request(`/api/reviews/${id}`, { method: 'DELETE' });
  },

  getStats() {
    return this.request('/api/stats');
  }
};

function showToast(message, type = 'info') {
  const iconMap = { success: 'check-circle', danger: 'exclamation-circle', info: 'info-circle', warning: 'exclamation-triangle' };
  const container = document.getElementById('toastContainer') || (() => {
    const c = document.createElement('div');
    c.id = 'toastContainer';
    c.className = 'toast-container';
    document.body.appendChild(c);
    return c;
  })();
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-bg-${type} border-0 show`;
  toast.role = 'alert';
  toast.innerHTML = `<div class="d-flex"><div class="toast-body"><i class="bi bi-${iconMap[type] || 'info-circle'}"></i> ${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
  container.appendChild(toast);
  setTimeout(() => { toast.remove(); }, 4000);
}
