import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const scan = {
  url: (url) => api.post('/scan/url', { url }),
  history: () => api.get('/scan/history'),
};

export const email = {
  analyze: (headers) => api.post('/email/analyze', { headers }),
};

export const threats = {
  recent: () => api.get('/threats/recent'),
  fetchFeeds: () => api.post('/threats/fetch'),
};

export const community = {
  getReports: () => api.get('/community/reports'),
  submitReport: (data) => api.post('/community/report', data),
  vote: (id, type) => api.post(`/community/report/${id}/vote`, { type }),
};

export const reports = {
  generate: async (scanData) => {
    const response = await api.post('/reports/generate', scanData, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cybershield_report_${Date.now()}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  },
};

export const recon = {
  portScan: (domain) => api.post('/recon/port-scan', { domain }),
  abuseCheck: (domain) => api.post('/recon/abuse-check', { domain }),
  full: (domain) => api.post('/recon/full', { domain }),
};

export const gophish = {
  getCampaigns: () => api.get('/gophish/campaigns'),
  getCampaign: (id) => api.get(`/gophish/campaigns/${id}`),
  getPages: () => api.get('/gophish/pages'),
  getTemplates: () => api.get('/gophish/templates'),
  analyzeUrl: (url) => api.post('/gophish/analyze-url', { url }),
};

export const yaraScan = {
  scan: (url) => api.post('/yara/scan', { url }),
  getRules: () => api.get('/yara/rules'),
};

export const breach = {
  checkPassword: (password) => api.post('/breach/check-password', { password }),
  checkEmail: (email) => api.post('/breach/check-email', { email }),
};

export const vuln = {
  fullScan: (target) => api.post('/vuln/full', { target }),
  niktoScan: (target) => api.post('/vuln/nikto', { target }),
  networkCapture: (target) => api.post('/vuln/capture', { target }),
};

export const admin = {
  getUsers: () => api.get('/admin/users'),
  updateRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getCommunityReports: () => api.get('/admin/community-reports'),
  updateReportStatus: (id, status) => api.put(`/admin/community-reports/${id}/status`, { status }),
  getStats: () => api.get('/admin/stats'),
};

export const settings = {
  getProfile: () => api.get('/settings/profile'),
  updateProfile: (data) => api.put('/settings/profile', data),
  changePassword: (data) => api.put('/settings/password', data),
};

export default api;