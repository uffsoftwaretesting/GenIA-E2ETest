(() => {
  const root = (window.GenIA = window.GenIA || {});
  const { byId, clear } = root.dom;
  const { authService } = root.auth;

  const setupHistory = () => {
    const render = () => {
      const list = byId("historyList");
      if (!list) return;

      const search = (byId("historySearch")?.value || "").toLowerCase().trim();
      const status = byId("historyFilter")?.value || "";
      const tests = authService.getTests();

      const filtered = tests
        .filter((test) => {
          const matchSearch =
            !search ||
            [test.name, test.project, test.framework, test.language]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(search));
          return matchSearch && (!status || test.status === status);
        })
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      clear(list);
      if (!filtered.length) {
        list.innerHTML = '<p class="empty-state">Nenhum teste encontrado</p>';
        return;
      }

      filtered.forEach((test) => {
        const item = document.createElement("div");
        item.className = "history-item";
        const statusDot = test.status === "success" ? "🟢" : "🔴";
        item.textContent = `${statusDot} ${test.name} · ${test.framework} · ${test.language} · ${test.project || "—"} · ${test.model || "—"}`;
        list.appendChild(item);
      });
    };

    const search = byId("historySearch");
    const filter = byId("historyFilter");
    search?.addEventListener("input", render);
    filter?.addEventListener("change", render);

    return {
      updateHistory: render,
    };
  };

  root.features = root.features || {};
  root.features.history = {
    setupHistory,
  };
})();

