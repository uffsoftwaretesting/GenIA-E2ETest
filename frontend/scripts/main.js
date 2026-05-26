(() => {
  const root = (window.GenIA = window.GenIA || {});
  const { appState, setController } = root.state;
  const { authService } = root.auth;

  let controllers = {};

  const refreshAllViews = () => {
    controllers.llmConfig?.refreshLLMConfigList?.();
    controllers.generator?.refreshLLMSelectorInGenerator?.();
    controllers.generator?.refreshProjectOptions?.();
    controllers.dashboard?.updateDashboard?.();
    controllers.history?.updateHistory?.();
  };

  const initializeApp = () => {
    if (appState.initialized) {
      controllers.navigation?.setActiveScreen?.("dashboard");
      refreshAllViews();
      return;
    }

    controllers.navigation = root.features.navigation.setupNavigation({
      onNavigate: (screen) => {
        if (screen === "llm-config") controllers.llmConfig?.refreshLLMConfigList?.();
        if (screen === "test-generator") {
          controllers.generator?.refreshLLMSelectorInGenerator?.();
          controllers.generator?.refreshProjectOptions?.();
        }
        if (screen === "dashboard") controllers.dashboard?.updateDashboard?.();
        if (screen === "history") controllers.history?.updateHistory?.();
      },
    });

    controllers.llmConfig = root.features.llmConfig.setupLLMConfigPage({
      onChanged: refreshAllViews,
    });

    controllers.generator = root.features.generator.setupTestGeneratorPage({
      onGenerationComplete: refreshAllViews,
    });

    controllers.dashboard = root.features.dashboard.setupDashboard();
    controllers.history = root.features.history.setupHistory();

    setController("navigation", controllers.navigation);
    setController("llmConfig", controllers.llmConfig);
    setController("generator", controllers.generator);
    setController("dashboard", controllers.dashboard);
    setController("history", controllers.history);

    appState.initialized = true;
    refreshAllViews();
  };

  const resetApp = () => {
    controllers.generator?.reset?.();
  };

  window.addEventListener("error", (event) => {
    console.error("[GenIA Frontend] window error", event.error || event.message);
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("[GenIA Frontend] unhandled rejection", event.reason);
  });

  document.addEventListener("DOMContentLoaded", () => {
    root.features.auth.setupAuthUI({
      onAuthenticated: () => {
        initializeApp();
      },
      onLoggedOut: resetApp,
    });

    if (!authService.isAuthenticated()) {
      root.layout.showAuthShell();
    }
  });

  root.app = {
    initializeApp,
    resetApp,
    controllers,
  };
})();
