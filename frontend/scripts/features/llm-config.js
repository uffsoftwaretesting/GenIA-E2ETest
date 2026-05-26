(() => {
  const root = (window.GenIA = window.GenIA || {});
  const { byId, qsa, escapeHtml } = root.dom;
  const { PROVIDER_MODELS, PROVIDER_SHORT } = root.constants;
  const { authService } = root.auth;
  const { showToast } = root.toast;

  const setupLLMConfigPage = (options = {}) => {
    const onChanged = options.onChanged;

    const clearForm = () => {
      const fields = {
        editingConfigId: "",
        llmConfigName: "",
        llmProvider: "",
        llmApiKey: "",
      };

      Object.entries(fields).forEach(([id, value]) => {
        const el = byId(id);
        if (el) el.value = value;
      });

      const model = byId("llmModel");
      if (model) {
        model.innerHTML = '<option value="">Selecione um provedor</option>';
        model.disabled = true;
      }

      const temperature = byId("llmTemperature");
      const temperatureValue = byId("temperatureValue");
      if (temperature) temperature.value = "0";
      if (temperatureValue) temperatureValue.textContent = "0";
    };

    const syncProviderModel = () => {
      const provider = byId("llmProvider");
      const model = byId("llmModel");
      if (!provider || !model) return;

      const models = PROVIDER_MODELS[provider.value] || [];
      model.innerHTML = "";

      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = models.length ? "Selecione um modelo" : "Selecione um provedor";
      model.appendChild(placeholder);

      models.forEach((modelName) => {
        const option = document.createElement("option");
        option.value = modelName;
        option.textContent = modelName;
        model.appendChild(option);
      });

      model.disabled = !models.length;
    };

    const editLLMConfig = (id) => {
      const config = authService.getLLMConfigs().find((item) => item.id === id);
      if (!config) return;

      byId("editingConfigId").value = config.id;
      byId("llmConfigName").value = config.name || "";
      byId("llmProvider").value = config.provider || "";
      syncProviderModel();
      byId("llmModel").value = config.model || "";
      byId("llmApiKey").value = config.apiKey ? atob(config.apiKey) : "";
      byId("llmTemperature").value = String(config.temperature ?? 0);
      byId("temperatureValue").textContent = String(config.temperature ?? 0);
      byId("llmFormTitle").textContent = "Editar Configuração";
      byId("llmFormCard").style.display = "block";
      byId("llmFormCard").scrollIntoView({ behavior: "smooth" });
    };

    const refreshLLMConfigList = () => {
      const list = byId("llmConfigsList");
      const noMsg = byId("noConfigsMsg");
      if (!list) return;

      const configs = authService.getLLMConfigs();
      qsa(".llm-config-card", list).forEach((card) => card.remove());

      if (!configs.length) {
        if (noMsg) noMsg.style.display = "block";
        return;
      }

      if (noMsg) noMsg.style.display = "none";

      configs.forEach((config) => {
        const card = document.createElement("div");
        card.className = "llm-config-card";
        card.dataset.id = config.id;
        card.innerHTML = `
          <div class="provider-badge">${PROVIDER_SHORT[config.provider] || String(config.provider || "?").slice(0, 3).toUpperCase()}</div>
          <div class="llm-config-copy">
            <div class="config-name">${escapeHtml(config.name)}</div>
            <div class="config-meta">${escapeHtml(config.provider)} · ${escapeHtml(config.model)}</div>
          </div>
          <div class="config-actions">
            <button type="button" class="btn-icon" data-action="edit" data-id="${config.id}" title="Editar">✏️</button>
            <button type="button" class="btn-icon danger" data-action="delete" data-id="${config.id}" title="Remover">🗑</button>
          </div>
        `;

        card.querySelector('[data-action="edit"]')?.addEventListener("click", (event) => {
          event.stopPropagation();
          editLLMConfig(config.id);
        });

        card.querySelector('[data-action="delete"]')?.addEventListener("click", (event) => {
          event.stopPropagation();
          authService.deleteLLMConfig(config.id);
          refreshLLMConfigList();
          onChanged?.();
          showToast("Configuração removida", "info");
        });

        list.appendChild(card);
      });
    };

    const saveLLMConfig = () => {
      const editId = byId("editingConfigId").value;
      const name = byId("llmConfigName").value.trim();
      const provider = byId("llmProvider").value;
      const model = byId("llmModel").value;
      const apiKey = byId("llmApiKey").value.trim();
      const temperature = parseFloat(byId("llmTemperature").value || "0");

      if (!name || !provider || !model || !apiKey) {
        showToast("Preencha todos os campos obrigatórios", "error");
        return;
      }

      const existing = editId ? authService.getLLMConfigs().find((cfg) => cfg.id === editId) : null;
      authService.saveLLMConfig({
        id: editId || String(Date.now()),
        name,
        provider,
        model,
        apiKey: btoa(apiKey),
        temperature,
        createdAt: existing?.createdAt || new Date().toISOString(),
      });

      clearForm();
      byId("llmFormTitle").textContent = "Nova Configuração";
      byId("llmFormCard").style.display = "none";
      refreshLLMConfigList();
      onChanged?.();
      showToast(editId ? "Configuração atualizada" : "Configuração salva", "success");
    };

    const bind = () => {
      byId("llmProvider")?.addEventListener("change", syncProviderModel);
      byId("llmTemperature")?.addEventListener("input", () => {
        byId("temperatureValue").textContent = byId("llmTemperature").value;
      });
      byId("newLLMConfigBtn")?.addEventListener("click", () => {
        clearForm();
        byId("llmFormTitle").textContent = "Nova Configuração";
        byId("llmFormCard").style.display = "block";
      });
      byId("saveLLMConfigBtn")?.addEventListener("click", saveLLMConfig);
      byId("cancelLLMConfigBtn")?.addEventListener("click", () => {
        clearForm();
        byId("llmFormCard").style.display = "none";
        byId("llmFormTitle").textContent = "Nova Configuração";
      });
      byId("toggleApiKey")?.addEventListener("click", () => {
        const input = byId("llmApiKey");
        if (!input) return;
        input.type = input.type === "password" ? "text" : "password";
      });

      refreshLLMConfigList();
      const configs = authService.getLLMConfigs();
      byId("llmFormCard").style.display = configs.length ? "none" : "block";
      syncProviderModel();
    };

    bind();

    return {
      refreshLLMConfigList,
      clearForm,
    };
  };

  root.features = root.features || {};
  root.features.llmConfig = {
    setupLLMConfigPage,
  };
})();

