// ==================== AUTH.JS ADDITIONS ====================
// Add these methods to your existing authManager object in auth.js
// These extend the existing auth system to support multiple LLM configurations

// Paste these methods inside your authManager / AuthManager class or object:

/*

  // --- Multi-LLM Config Storage ---

  getLLMConfigs() {
    const user = this.getCurrentUser();
    if (!user) return [];
    return user.llmConfigs || [];
  },

  saveLLMConfig(config) {
    const user = this.getCurrentUser();
    if (!user) return;
    if (!user.llmConfigs) user.llmConfigs = [];
    const idx = user.llmConfigs.findIndex(c => c.id === config.id);
    if (idx >= 0) {
      user.llmConfigs[idx] = config;
    } else {
      user.llmConfigs.push(config);
    }
    this.saveCurrentUser(user);
  },

  deleteLLMConfig(id) {
    const user = this.getCurrentUser();
    if (!user) return;
    user.llmConfigs = (user.llmConfigs || []).filter(c => c.id !== id);
    this.saveCurrentUser(user);
  },

  // Legacy single-config compat (used in dashboard card)
  getUserConfig() {
    const configs = this.getLLMConfigs();
    return configs[0] || null;
  },

*/

// ==================== MINIMAL STANDALONE AUTH ====================
// If you don't have auth.js yet, use this minimal version:

const authManager = (() => {
  const STORAGE_KEY = 'genia_users';
  const SESSION_KEY = 'genia_session';

  const getUsers = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  const saveUsers = (u) => localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  const getSessionEmail = () => localStorage.getItem(SESSION_KEY);

  return {
    isAuthenticated() {
      return !!getSessionEmail();
    },

    getCurrentUser() {
      const email = getSessionEmail();
      if (!email) return null;
      return getUsers()[email] || null;
    },

    saveCurrentUser(user) {
      const users = getUsers();
      users[user.email] = user;
      saveUsers(users);
    },

    login(email, password) {
      const users = getUsers();
      const user = users[email];
      if (!user || user.password !== btoa(password)) throw new Error('Credenciais inválidas');
      localStorage.setItem(SESSION_KEY, email);
      return user;
    },

    register(data) {
      const users = getUsers();
      if (users[data.email]) throw new Error('Email já cadastrado');
      const user = { ...data, password: btoa(data.password), tests: [], projects: [], llmConfigs: [] };
      users[data.email] = user;
      saveUsers(users);
      localStorage.setItem(SESSION_KEY, data.email);
      return user;
    },

    logout() {
      localStorage.removeItem(SESSION_KEY);
    },

    // Multi-LLM configs
    getLLMConfigs() {
      const user = this.getCurrentUser();
      return user?.llmConfigs || [];
    },

    saveLLMConfig(config) {
      const user = this.getCurrentUser();
      if (!user) return;
      if (!user.llmConfigs) user.llmConfigs = [];
      const idx = user.llmConfigs.findIndex(c => c.id === config.id);
      if (idx >= 0) user.llmConfigs[idx] = config;
      else user.llmConfigs.push(config);
      this.saveCurrentUser(user);
    },

    deleteLLMConfig(id) {
      const user = this.getCurrentUser();
      if (!user) return;
      user.llmConfigs = (user.llmConfigs || []).filter(c => c.id !== id);
      this.saveCurrentUser(user);
    },

    // Legacy compat
    getUserConfig() {
      return this.getLLMConfigs()[0] || null;
    },

    updateUserConfig(config) {
      // Upsert as a named config for backward compat
      const existing = this.getLLMConfigs().find(c => c.name === 'Padrão');
      this.saveLLMConfig({ ...config, id: existing?.id || String(Date.now()), name: existing?.name || 'Padrão', createdAt: new Date().toISOString() });
    },

    // Tests
    getTests() {
      return this.getCurrentUser()?.tests || [];
    },

    addTest(test) {
      const user = this.getCurrentUser();
      if (!user) return;
      if (!user.tests) user.tests = [];
      user.tests.push(test);
      this.saveCurrentUser(user);
    },

    // Projects
    getProjects() {
      return this.getCurrentUser()?.projects || [];
    },

    addProject(name) {
      const user = this.getCurrentUser();
      if (!user) return;
      if (!user.projects) user.projects = [];
      if (!user.projects.includes(name)) user.projects.push(name);
      this.saveCurrentUser(user);
    },
  };
})();

// ==================== AUTH UI ====================

document.addEventListener('DOMContentLoaded', () => {
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
      btn.classList.add('active');
      document.querySelector(`.auth-form[data-form="${tab}"]`)?.classList.add('active');
    });
  });

  // Login
  document.getElementById('loginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    try {
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      authManager.login(email, password);
      showAppPanel();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Register
  document.getElementById('registerForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const pwd = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirmPassword').value;
    if (pwd !== confirm) { showToast('Senhas não conferem', 'error'); return; }
    try {
      authManager.register({
        email:     document.getElementById('registerEmail').value,
        firstName: document.getElementById('registerFirstName').value,
        lastName:  document.getElementById('registerLastName').value,
        birthDate: document.getElementById('registerBirthDate').value,
        password:  pwd,
      });
      showAppPanel();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    authManager.logout();
    document.getElementById('appPanel').style.display = 'none';
    document.getElementById('authPanel').style.display = 'flex';
    appInitialized = false;
  });

  // Auto-login
  if (authManager.isAuthenticated()) showAppPanel();
});

function showAppPanel() {
  document.getElementById('authPanel').style.display = 'none';
  document.getElementById('appPanel').style.display = 'flex';
  const user = authManager.getCurrentUser();
  const emailEl = document.getElementById('userEmail');
  if (emailEl) emailEl.textContent = user?.email || '';
  initializeApp();
}
