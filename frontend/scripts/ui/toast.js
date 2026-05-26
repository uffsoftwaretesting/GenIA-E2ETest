(() => {
  const root = (window.GenIA = window.GenIA || {});

  let toastContainer = null;

  const ensureContainer = () => {
    if (toastContainer && document.body.contains(toastContainer)) return toastContainer;
    toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      toastContainer.className = "toast-container";
      document.body.appendChild(toastContainer);
    }
    return toastContainer;
  };

  const showToast = (message, type = "info") => {
    const container = ensureContainer();
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));

    window.setTimeout(() => {
      toast.classList.remove("show");
      window.setTimeout(() => toast.remove(), 200);
    }, 2800);
  };

  root.toast = {
    showToast,
  };
})();

