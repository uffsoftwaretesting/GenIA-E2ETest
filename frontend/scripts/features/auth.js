(() => {
  const root = (window.GenIA = window.GenIA || {});
  const { authService } = root.auth;
  const { showAppShell, showAuthShell, resetShell } = root.layout;
  const { showToast } = root.toast;

  const setupAuthUI = (options = {}) => {
    const onAuthenticated = options.onAuthenticated;
    const onLoggedOut = options.onLoggedOut;
    let bound = false;

    const bindTabs = () => {
      document.querySelectorAll(".tab-btn").forEach((button) => {
        button.addEventListener("click", () => {
          const tab = button.dataset.tab;
          document.querySelectorAll(".tab-btn").forEach((item) => item.classList.remove("active"));
          document.querySelectorAll(".auth-form").forEach((form) => form.classList.remove("active"));
          button.classList.add("active");
          document.querySelector(`.auth-form[data-form="${tab}"]`)?.classList.add("active");
        });
      });
    };

    const bindForms = () => {
      document.getElementById("loginForm")?.addEventListener("submit", (event) => {
        event.preventDefault();
        try {
          const user = authService.login(
            document.getElementById("loginEmail").value,
            document.getElementById("loginPassword").value
          );
          showAppShell(user.email);
          onAuthenticated?.(user);
        } catch (error) {
          showToast(error.message, "error");
        }
      });

      document.getElementById("registerForm")?.addEventListener("submit", (event) => {
        event.preventDefault();
        const password = document.getElementById("registerPassword").value;
        const confirmPassword = document.getElementById("registerConfirmPassword").value;

        if (password !== confirmPassword) {
          showToast("Senhas não conferem", "error");
          return;
        }

        try {
          const user = authService.register({
            email: document.getElementById("registerEmail").value,
            firstName: document.getElementById("registerFirstName").value,
            lastName: document.getElementById("registerLastName").value,
            birthDate: document.getElementById("registerBirthDate").value,
            password,
          });
          showAppShell(user.email);
          onAuthenticated?.(user);
        } catch (error) {
          showToast(error.message, "error");
        }
      });

      document.getElementById("logoutBtn")?.addEventListener("click", () => {
        authService.logout();
        showAuthShell();
        resetShell();
        onLoggedOut?.();
      });
    };

    const syncInitialVisibility = () => {
      const user = authService.getCurrentUser();
      if (authService.isAuthenticated() && user) {
        showAppShell(user.email);
        onAuthenticated?.(user);
      } else {
        showAuthShell();
      }
    };

    if (!bound) {
      bindTabs();
      bindForms();
      bound = true;
    }

    syncInitialVisibility();
  };

  root.features = root.features || {};
  root.features.auth = {
    setupAuthUI,
  };
})();

