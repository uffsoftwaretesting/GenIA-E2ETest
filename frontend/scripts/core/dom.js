(() => {
  const root = (window.GenIA = window.GenIA || {});

  const byId = (id) => document.getElementById(id);
  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const setText = (id, value) => {
    const el = byId(id);
    if (el) el.textContent = value;
  };
  const clear = (node) => {
    if (node) node.innerHTML = "";
  };
  const escapeHtml = (value) => {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };
  const show = (el, display = "") => {
    if (el) el.style.display = display;
  };
  const hide = (el) => {
    if (el) el.style.display = "none";
  };
  const toggleClass = (el, className, active) => {
    if (!el) return;
    el.classList.toggle(className, Boolean(active));
  };

  root.dom = {
    byId,
    qs,
    qsa,
    setText,
    clear,
    escapeHtml,
    show,
    hide,
    toggleClass,
  };
})();

