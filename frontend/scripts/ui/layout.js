(() => {
  const root = (window.GenIA = window.GenIA || {});

  const showAuthShell = () => {
    const authPanel = document.getElementById("authPanel");
    const appPanel = document.getElementById("appPanel");
    if (authPanel) authPanel.style.display = "flex";
    if (appPanel) appPanel.style.display = "none";
  };

  const showAppShell = (email = "") => {
    const authPanel = document.getElementById("authPanel");
    const appPanel = document.getElementById("appPanel");
    if (authPanel) authPanel.style.display = "none";
    if (appPanel) appPanel.style.display = "flex";
    if (email) {
      const userEmail = document.getElementById("userEmail");
      if (userEmail) userEmail.textContent = email;
    }
  };

  const resetShell = () => {
    const userEmail = document.getElementById("userEmail");
    if (userEmail) userEmail.textContent = "—";
  };

  root.layout = {
    showAuthShell,
    showAppShell,
    resetShell,
  };
})();

