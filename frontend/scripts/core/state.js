(() => {
  const root = (window.GenIA = window.GenIA || {});

  const appState = {
    initialized: false,
    currentSession: null,
    controllers: {},
  };

  const setCurrentSession = (session) => {
    appState.currentSession = session;
  };

  const clearCurrentSession = () => {
    appState.currentSession = null;
  };

  const setController = (name, controller) => {
    appState.controllers[name] = controller;
  };

  root.state = {
    appState,
    setCurrentSession,
    clearCurrentSession,
    setController,
  };
})();

