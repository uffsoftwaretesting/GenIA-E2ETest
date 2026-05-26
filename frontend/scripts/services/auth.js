(() => {
  const root = (window.GenIA = window.GenIA || {});

  class AuthService {
    constructor() {
      this.STORAGE_KEY = "genia_users";
      this.SESSION_KEY = "genia_session";
    }

    readUsers() {
      try {
        return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "{}");
      } catch {
        return {};
      }
    }

    saveUsers(users) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
    }

    getSessionEmail() {
      return localStorage.getItem(this.SESSION_KEY);
    }

    isAuthenticated() {
      return Boolean(this.getSessionEmail());
    }

    getCurrentUser() {
      const email = this.getSessionEmail();
      if (!email) return null;
      return this.readUsers()[email] || null;
    }

    saveCurrentUser(user) {
      const users = this.readUsers();
      users[user.email] = user;
      this.saveUsers(users);
    }

    login(email, password) {
      const users = this.readUsers();
      const user = users[email];
      if (!user || user.password !== btoa(password)) {
        throw new Error("Credenciais inválidas");
      }
      localStorage.setItem(this.SESSION_KEY, email);
      return user;
    }

    register(data) {
      const users = this.readUsers();
      if (users[data.email]) {
        throw new Error("Email já cadastrado");
      }

      const user = {
        ...data,
        password: btoa(data.password),
        tests: [],
        projects: [],
        llmConfigs: [],
      };

      users[data.email] = user;
      this.saveUsers(users);
      localStorage.setItem(this.SESSION_KEY, data.email);
      return user;
    }

    logout() {
      localStorage.removeItem(this.SESSION_KEY);
    }

    getLLMConfigs() {
      return this.getCurrentUser()?.llmConfigs || [];
    }

    saveLLMConfig(config) {
      const user = this.getCurrentUser();
      if (!user) return;
      const llmConfigs = user.llmConfigs || [];
      const index = llmConfigs.findIndex((cfg) => cfg.id === config.id);
      if (index >= 0) {
        llmConfigs[index] = config;
      } else {
        llmConfigs.push(config);
      }
      user.llmConfigs = llmConfigs;
      this.saveCurrentUser(user);
    }

    deleteLLMConfig(id) {
      const user = this.getCurrentUser();
      if (!user) return;
      user.llmConfigs = (user.llmConfigs || []).filter((cfg) => cfg.id !== id);
      this.saveCurrentUser(user);
    }

    getUserConfig() {
      return this.getLLMConfigs()[0] || null;
    }

    updateUserConfig(config) {
      const existing = this.getLLMConfigs().find((cfg) => cfg.name === "Padrão");
      this.saveLLMConfig({
        ...config,
        id: existing?.id || String(Date.now()),
        name: existing?.name || "Padrão",
        createdAt: existing?.createdAt || new Date().toISOString(),
      });
    }

    getTests() {
      return this.getCurrentUser()?.tests || [];
    }

    addTest(test) {
      const user = this.getCurrentUser();
      if (!user) return;
      user.tests = user.tests || [];
      user.tests.push(test);
      this.saveCurrentUser(user);
    }

    getProjects() {
      return this.getCurrentUser()?.projects || [];
    }

    addProject(name) {
      const user = this.getCurrentUser();
      if (!user) return;
      user.projects = user.projects || [];
      if (!user.projects.includes(name)) {
        user.projects.push(name);
        this.saveCurrentUser(user);
      }
    }
  }

  root.auth = {
    AuthService,
    authService: new AuthService(),
    authManager: null,
  };

  root.auth.authManager = root.auth.authService;
})();

