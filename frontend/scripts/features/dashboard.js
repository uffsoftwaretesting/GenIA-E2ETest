(() => {
  const root = (window.GenIA = window.GenIA || {});
  const { byId, setText, clear } = root.dom;
  const { groupBy, getMostUsedValue } = root.utils;
  const { authService } = root.auth;

  const setupDashboard = () => {
    const updateProjectFilter = (tests) => {
      const select = byId("dashboardProjectFilter");
      if (!select) return;
      const current = select.value;
      const projects = Array.from(new Set(tests.map((test) => test.project).filter(Boolean)));
      select.innerHTML = '<option value="">Todos os projetos</option>';
      projects.forEach((project) => {
        const option = document.createElement("option");
        option.value = project;
        option.textContent = project;
        select.appendChild(option);
      });
      select.value = current;
    };

    const updateModelFilter = (tests) => {
      const select = byId("dashboardModelFilter");
      if (!select) return;
      const current = select.value;
      const models = Array.from(new Set(tests.map((test) => test.model).filter(Boolean)));
      select.innerHTML = '<option value="">Todos os modelos</option>';
      models.forEach((model) => {
        const option = document.createElement("option");
        option.value = model;
        option.textContent = model;
        select.appendChild(option);
      });
      select.value = current;
    };

    const filterTests = (tests) => {
      const project = byId("dashboardProjectFilter")?.value || "";
      const framework = byId("dashboardFrameworkFilter")?.value || "";
      const model = byId("dashboardModelFilter")?.value || "";
      const status = byId("dashboardStatusFilter")?.value || "";
      const period = byId("dashboardPeriodFilter")?.value || "";
      const now = Date.now();
      const periodMs = {
        "24h": 86400000,
        "7d": 604800000,
        "30d": 2592000000,
      };

      return tests.filter((test) => {
        const createdAt = new Date(test.createdAt || 0).getTime();
        return (
          (!project || test.project === project) &&
          (!framework || test.framework === framework) &&
          (!model || test.model === model) &&
          (!status || test.status === status) &&
          (!period || (createdAt && now - createdAt <= periodMs[period]))
        );
      });
    };

    const render = () => {
      const tests = authService.getTests();
      const filtered = filterTests(tests);
      updateProjectFilter(tests);
      updateModelFilter(tests);

      const total = filtered.length;
      const failures = filtered.filter((test) => test.status === "error").length;
      const averageDuration = total
        ? Math.round(filtered.reduce((sum, test) => sum + (Number(test.duration) || 0), 0) / total)
        : 0;

      setText("totalTests", String(total));
      setText("failureRate", total ? `${Math.round((failures / total) * 100)}%` : "0%");
      setText("avgDuration", `${averageDuration}s`);
      setText("popularFramework", getMostUsedValue(filtered, "framework") || "—");
      setText("popularModel", getMostUsedValue(filtered, "model") || "—");
      setText("customPromptRate", total ? `${Math.round((filtered.filter((test) => test.prompt).length / total) * 100)}%` : "0%");
      setText("llmProviderCard", getMostUsedValue(filtered, "provider") || "—");

      const projectMetrics = byId("projectMetrics");
      if (projectMetrics) {
        clear(projectMetrics);
        const groups = groupBy(filtered, (test) => test.project || "Sem projeto");
        if (!groups.size) {
          projectMetrics.innerHTML = '<p class="empty-state">Nenhum resultado disponível</p>';
        } else {
          groups.forEach((items, project) => {
            const row = document.createElement("div");
            row.className = "metric-item";
            row.textContent = `${project}: ${items.length} teste(s)`;
            projectMetrics.appendChild(row);
          });
        }
      }

      const recentTestsList = byId("recentTestsList");
      if (recentTestsList) {
        clear(recentTestsList);
        const recent = [...filtered]
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, 5);

        if (!recent.length) {
          recentTestsList.innerHTML = '<p class="empty-state">Nenhum teste executado ainda</p>';
        } else {
          recent.forEach((test) => {
            const item = document.createElement("div");
            item.className = "recent-test-item";
            item.textContent = `${test.name} · ${test.framework} · ${test.project || "—"} · ${test.status}`;
            recentTestsList.appendChild(item);
          });
        }
      }
    };

    const filters = [
      "dashboardProjectFilter",
      "dashboardFrameworkFilter",
      "dashboardModelFilter",
      "dashboardStatusFilter",
      "dashboardPeriodFilter",
    ];

    const bindFilter = (id) => {
      const el = byId(id);
      el?.addEventListener("change", render);
      el?.addEventListener("input", render);
    };

    filters.forEach(bindFilter);

    return {
      updateDashboard: render,
    };
  };

  root.features = root.features || {};
  root.features.dashboard = {
    setupDashboard,
  };
})();
