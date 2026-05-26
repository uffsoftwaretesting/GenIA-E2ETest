(() => {
  const root = (window.GenIA = window.GenIA || {});
  const { byId, qsa, escapeHtml } = root.dom;
  const { INPUT_MODES, PIPELINE_STEPS, PROVIDER_MODELS, PROVIDER_SHORT, FRAMEWORK_LANGUAGES } = root.constants;
  const { authService } = root.auth;
  const { showToast } = root.toast;
  const { extractUrlsFromText, normalizeText } = root.utils;
  const { createGenerationSession, startPhaseOne, continueAfterValidation } = root.generation;
  const { setCurrentSession, clearCurrentSession } = root.state;

  const RESULT_TABS = [
    { key: "logs", title: "Logs", contentId: "executionLogs" },
    { key: "restructure", title: "Estruturação", contentId: "structuredJsonContent" },
    { key: "extraction", title: "Extração", contentId: "extractedJsonContent" },
    { key: "refinement", title: "Refinamento", contentId: "refinedJsonContent" },
    { key: "generation", title: "Geração", contentId: "scriptContent" },
    { key: "validation", title: "Validação", contentId: "validationJsonContent" },
    { key: "confirmation", title: "Confirmação", contentId: "confirmationContent" },
    { key: "execution", title: "Execução", contentId: "executionContent" },
    { key: "homologation", title: "Homologação", contentId: "homologationContent" },
    { key: "finalization", title: "Finalização", contentId: "finalizationContent" },
    { key: "refactoring", title: "Refatoração", contentId: "refactoringContent" },
  ];

  const setupTestGeneratorPage = (options = {}) => {
    const onGenerationComplete = options.onGenerationComplete;
    let currentSession = null;
    let promptBundle = {};
    let promptBundleFramework = "";
    let promptLoadToken = 0;

    const promptStages = [
      "structuring",
      "extraction",
      "refinement",
      "generation",
      "validation",
      "confirmation",
      "homologation",
      "finalization",
      "refactoring",
    ];

    const stageLabelMap = {
      structuring: "Estruturação",
      extraction: "Extração",
      refinement: "Refinamento",
      generation: "Geração",
      validation: "Validação",
      confirmation: "Confirmação",
      homologation: "Homologação",
      finalization: "Finalização",
      refactoring: "Refatoração",
    };

    const stageToResultKey = {
      structuring: "restructure",
      extraction: "extraction",
      refinement: "refinement",
      generation: "generation",
      validation: "validation",
      confirmation: "confirmation",
      execution: "execution",
      homologation: "homologation",
      finalization: "finalization",
      refactoring: "refactoring",
    };

    const stageToStatusIcon = {
      idle: "○",
      running: "⟳",
      done: "✓",
      error: "✕",
    };

    const loadPromptBundle = async (framework, inputMode = null) => {
      const currentToken = ++promptLoadToken;
      try {
        const response = await root.api.geniaAPI.getPromptBundle(framework, inputMode);
        if (currentToken !== promptLoadToken) return;
        promptBundle = response?.prompts || {};
        promptBundleFramework = `${framework || ""}:${inputMode || "test_case"}`;
        buildPromptsAccordion();
        refreshLLMSelectorInGenerator();
      } catch (error) {
        console.error(error);
      }
    };

    const getPromptText = (stage) => promptBundle?.[stage] || "";

    const getSelectedLLMConfigById = (configId) => {
      if (!configId) return null;
      return authService.getLLMConfigs().find((config) => config.id === configId) || null;
    };

    const resolveLLMConfigPayload = (config) => {
      if (!config) return null;
      return {
        id: config.id,
        name: config.name,
        provider: config.provider,
        model: config.model,
        apiKey: config.apiKey ? decodeApiKey(config.apiKey) : "",
        temperature: config.temperature ?? 0,
      };
    };

    const collectPipelineOverrides = () => {
      const promptOverrides = {};
      const llmOverrides = {};
      promptStages.forEach((stage) => {
        const textarea = byId(`${stage}Prompt`);
        const value = normalizeText(textarea?.value);
        const defaultValue = getPromptText(stage);
        if (value && value !== defaultValue) {
          promptOverrides[stage] = value;
        }

        const llmSelect = byId(`${stage}LlmSelect`);
        const selectedConfig = getSelectedLLMConfigById(llmSelect?.value || "");
        if (selectedConfig) {
          llmOverrides[stage] = resolveLLMConfigPayload(selectedConfig);
        }
      });
      return { promptOverrides, llmOverrides };
    };

    const addLog = (message, level = "info", stage = "") => {
      const container = byId("executionLogs");
      if (!container) return;

      if (typeof message === "object" && message !== null) {
        level = message.payload?.level || message.level || level;
        stage = message.channel || message.stage || stage;
        message = message.payload?.message || message.message || message.type || JSON.stringify(message);
      }

      const entry = document.createElement("div");
      entry.className = `log-entry log-${level}`;
      entry.textContent = `[${new Date().toLocaleTimeString()}] ${stage ? `[${stage}] ` : ""}${String(message || "")}`;
      container.appendChild(entry);
      container.scrollTop = container.scrollHeight;
    };

    const setResultStageState = (stageKey, state) => {
      const icon = stageToStatusIcon[state] || stageToStatusIcon.idle;
      const indicator = byId(`result-status-${stageKey}`);
      const tabButton = byId(`result-tab-btn-${stageKey}`);

      if (indicator) {
        indicator.textContent = icon;
        indicator.dataset.state = state;
      }

      if (tabButton) {
        tabButton.dataset.state = state;
      }
    };

    const renderStageOutput = (stageKey, payload) => {
      switch (stageKey) {
        case "restructure":
          renderGraphView("structuredTreeContent", getGraphDataForStage(stageKey, payload), "Estruturação");
          updateCode("structuredJsonContent", JSON.stringify(sanitizeModuleTreeForDisplay(payload?.structured || payload), null, 2));
          break;
        case "extraction":
          renderGraphView("extractedTreeContent", getGraphDataForStage(stageKey, payload), "Extração");
          updateCode("extractedJsonContent", JSON.stringify(sanitizeModuleTreeForDisplay(payload?.extracted_snapshot || payload?.elements || payload), null, 2));
          break;
        case "refinement":
          renderGraphView("refinedTreeContent", getGraphDataForStage(stageKey, payload), "Refinamento");
          updateCode("refinedJsonContent", JSON.stringify(sanitizeModuleTreeForDisplay(payload?.refined_snapshot || payload?.elements || payload), null, 2));
          break;
        case "generation":
          updateCode("scriptContent", payload?.script || payload?.script_preview || JSON.stringify(payload, null, 2));
          updateCode("confirmationGenerationScript", payload?.script || payload?.script_preview || JSON.stringify(payload, null, 2));
          updateCode("confirmationContent", payload?.script || payload?.script_preview || JSON.stringify(payload, null, 2));
          break;
        case "validation":
          renderValidationCards(payload);
          break;
        case "confirmation":
          updateCode("confirmationContent", payload?.confirmed_script || payload?.script || payload?.script_preview || JSON.stringify(payload, null, 2));
          updateCode("confirmationGenerationScript", currentSession?.results?.script || payload?.script || payload?.script_preview || "");
          break;
        case "execution":
          renderExecutionReport(payload);
          break;
        case "homologation":
          renderHomologationReport(payload);
          break;
        case "finalization":
          renderFinalizationReport(payload);
          break;
        case "refactoring":
          renderRefactoringReport(payload);
          break;
        default:
          break;
      }
    };

    const handlePipelineEvent = (event) => {
      addLog(event);
      const type = event?.type;
      const channel = event?.channel || event?.payload?.channel;
      const payload = event?.payload || {};
      const stageKey = stageToResultKey[channel];

      if (type === "STAGE_START" && stageKey) {
        setResultStageState(stageKey, "running");
      }

      if (type === "STAGE_DONE" && stageKey) {
        setResultStageState(stageKey, "done");
        renderStageOutput(stageKey, payload);
      }

      if (type === "MODULE_START" && channel === "extraction") {
        setResultStageState("extraction", "running");
        setStep(2, "running");
      }

      if (type === "MODULE_START" && channel === "refinement") {
        setResultStageState("refinement", "running");
        setStep(3, "running");
      }

      if (type === "EXTRACTION_DONE" && channel === "extraction") {
        renderStageOutput("extraction", payload);
        setResultStageState("extraction", payload.index >= payload.total ? "done" : "running");
        if (payload.index >= payload.total) {
          setStep(2, "ok");
          setResultStageState("refinement", "running");
          setStep(3, "running");
        } else {
          setResultStageState("refinement", "running");
          setStep(3, "running");
        }
      }

      if (type === "REFINEMENT_DONE" && channel === "refinement") {
        renderStageOutput("refinement", payload);
        setResultStageState("refinement", payload.index >= payload.total ? "done" : "running");
        if (payload.index >= payload.total) {
          setStep(3, "ok");
        }
      }

      if (type === "STAGE_DONE" && channel === "validation") {
        const validation = payload;
        setStep(5, "ok");
        renderValidationCards(validation);
        addLog("A etapa de validação terminou e a pipeline está pronta para continuar.", "success", "Validação");
        showToast("Validação concluída. A pipeline pode continuar.", "success");
      }

      if (type === "STAGE_START" && channel === "confirmation") {
        setStep(6, "running");
      }

      if (type === "STAGE_DONE" && channel === "confirmation") {
        setStep(6, "ok");
      }

      if (type === "STAGE_START" && channel === "execution") {
        setStep(7, "running");
        addLog("A pipeline voltou a rodar após a validação.", "info", "Execução");
        showToast("Pipeline retomada e em execução", "info");
      }

      if (type === "STAGE_START" && channel === "homologation") {
        setStep(8, "running");
      }

      if (type === "STAGE_START" && channel === "finalization") {
        setStep(9, "running");
      }

      if (type === "STAGE_START" && channel === "refactoring") {
        setStep(10, "running");
      }

      if (type === "STAGE_DONE" && channel === "execution") {
        setStep(7, "ok");
        renderExecutionReport(payload);
      }

      if (type === "STAGE_DONE" && channel === "homologation") {
        setStep(8, "ok");
        renderHomologationReport(payload);
      }

      if (type === "STAGE_DONE" && channel === "finalization") {
        setStep(9, "ok");
        renderFinalizationReport(payload);
      }

      if (type === "STAGE_DONE" && channel === "refactoring") {
        setStep(10, "ok");
        renderRefactoringReport(payload);
      }
    };

    const setStep = (step, status) => {
      const icon = status === "running" ? "⏳" : status === "ok" ? "✓" : status === "error" ? "✗" : "⏳";
      const iconEl = byId(`pstep${step}-status`);
      if (iconEl) iconEl.textContent = icon;
    };

    const updateCode = (id, content) => {
      const container = byId(id);
      if (!container) return;
      const code = container.querySelector("code") || container;
      code.textContent = content || "";
    };

    const copyCode = async (id) => {
      const el = byId(id);
      const text = el?.querySelector("code")?.textContent || el?.textContent || "";
      try {
        await navigator.clipboard.writeText(text);
        showToast("Copiado", "success");
      } catch {
        showToast("Não foi possível copiar", "error");
      }
    };

    const downloadScriptByTarget = (targetId, suffix = "script") => {
      const el = byId(targetId);
      const script = el?.querySelector("code")?.textContent || el?.textContent || "";
      if (!script) {
        showToast("Nenhum script disponível para download", "error");
        return;
      }
      downloadTextFile(script, makeFileName(currentSession?.testName, suffix, getScriptExtension()));
    };

    const downloadJsonTarget = (targetId, stageKey = "") => {
      const valueMap = {
        restructure: currentSession?.results?.structured,
        extraction: currentSession?.results?.extracted,
        refinement: currentSession?.results?.refined,
      };
      const target = valueMap[stageKey] ?? currentSession?.results?.[stageKey] ?? {};
      downloadTextFile(JSON.stringify(target, null, 2), makeFileName(currentSession?.testName, stageKey || "json", "json"), "application/json");
    };

    const buildPipelineGrid = () => {
      const grid = byId("pipelineGrid");
      if (!grid) return;
      grid.innerHTML = "";

      PIPELINE_STEPS.forEach((step, index) => {
        const card = document.createElement("div");
        card.className = "pipeline-step";
        card.id = `pipeline-step-${index + 1}`;
        card.innerHTML = `
          <div class="step-header">
            <span class="step-num">${index + 1}</span>
            <span class="step-name">${step.label}</span>
            <span class="step-status-icon" id="pstep${index + 1}-status">⏳</span>
          </div>
        `;
        grid.appendChild(card);
      });
    };

    const highlightPipelineStep = (stepNumber) => {
      qsa("#pipelineGrid .pipeline-step").forEach((step, index) => {
        step.style.borderColor = index + 1 === stepNumber ? "var(--text-primary)" : "var(--border)";
      });
    };

    const markPromptDefault = (key) => {
      const badge = byId(`${key}Badge`);
      if (!badge) return;
      badge.textContent = "Padrão";
      badge.classList.remove("custom");
    };

    const markPromptCustom = (key) => {
      const badge = byId(`${key}Badge`);
      if (!badge) return;
      badge.textContent = "Personalizado";
      badge.classList.add("custom");
    };

    const getGlobalLLMConfigId = () => qsa('input[name="selectedLLM"]:checked')[0]?.value || "";

    const buildLLMSelectOptions = (selectedId = "") => {
      const configs = authService.getLLMConfigs();
      const inheritedLabel = "Usar LLM global";
      const options = [`<option value="">${inheritedLabel}</option>`];

      configs.forEach((config) => {
        const selected = selectedId === config.id ? " selected" : "";
        const meta = `${config.provider} · ${config.model}`;
        options.push(
          `<option value="${escapeHtml(config.id)}"${selected}>${escapeHtml(config.name)} — ${escapeHtml(meta)}</option>`
        );
      });

      return options.join("");
    };

    const refreshStageLLMSelectors = () => {
      qsa("[data-stage-llm-select]").forEach((select) => {
        const stage = select.dataset.stageLlmSelect || "";
        const currentValue = select.value || "";
        select.innerHTML = buildLLMSelectOptions(currentValue);
        if (currentValue) {
          select.value = currentValue;
        }
        const selectedConfig = getSelectedLLMConfigById(currentValue);
        const label = select.closest(".prompt-stage-llm")?.querySelector(".prompt-stage-llm-summary");
        if (label) {
          label.textContent = selectedConfig
            ? `Selecionado: ${selectedConfig.name} (${selectedConfig.provider}/${selectedConfig.model})`
            : "Herda a configuração global";
        }
        const badge = byId(`${stage}LlmBadge`);
        if (badge) {
          badge.textContent = selectedConfig ? "Personalizado" : "Global";
          badge.classList.toggle("custom", Boolean(selectedConfig));
        }
      });
    };

    const buildPromptsAccordion = () => {
      const accordion = byId("promptsAccordion");
      if (!accordion) return;
      accordion.innerHTML = "";

      promptStages.forEach((stage) => {
        const card = document.createElement("div");
        card.className = "pipeline-step pipeline-prompt";
        card.innerHTML = `
          <div style="display:flex; flex-direction: column; gap: 1rem; width: 79%" >
            <div class="step-header">
              <span class="step-name">${stageLabelMap[stage] || stage}</span>
              <span class="step-badge" id="${stage}Badge">Padrão</span>
            </div>
            <div class="prompt-panel hidden" id="${stage}PromptWrap">
              <textarea id="${stage}Prompt" class="prompt-textarea" rows="8"></textarea>
              <div class="step-actions">
                <button type="button" class="btn-secondary btn-small" data-restore-prompt="${stage}">Restaurar padrão</button>
              </div>
            </div>
          </div>
            <select id="${stage}LlmSelect" class="prompt-stage-select" data-stage-llm-select="${stage}">
              ${buildLLMSelectOptions()}
            </select>
        `;

        card.querySelector(".step-header")?.addEventListener("click", () => {
          card.querySelector(`#${stage}PromptWrap`)?.classList.toggle("hidden");
        });

        const llmSelect = card.querySelector(`#${stage}LlmSelect`);
        llmSelect?.addEventListener("change", () => {
          refreshStageLLMSelectors();
        });

        card.querySelector(`[data-restore-prompt="${stage}"]`)?.addEventListener("click", () => {
          const field = byId(`${stage}Prompt`);
          if (field) field.value = getPromptText(stage);
          markPromptDefault(stage);
        });

        const field = card.querySelector(`#${stage}Prompt`);
        if (field) {
          field.value = getPromptText(stage);
          field.addEventListener("input", () => markPromptCustom(stage));
        }
        accordion.appendChild(card);
      });

      refreshStageLLMSelectors();
    };

    const setupFrameworkLanguageSync = () => {
      const framework = byId("testFramework");
      const language = byId("testLanguage");
      if (!framework || !language) return;

      const sync = () => {
        const languages = FRAMEWORK_LANGUAGES[framework.value] || [];
        language.innerHTML = "";

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = languages.length ? "Selecione linguagem" : "Selecione framework";
        language.appendChild(placeholder);

        languages.forEach((lang) => {
          const option = document.createElement("option");
          option.value = lang;
          option.textContent = lang.charAt(0).toUpperCase() + lang.slice(1);
          language.appendChild(option);
        });

        language.disabled = !languages.length;
        const currentInputMode = getPipelineInputMode();
        const expectedBundleKey = `${framework.value || ""}:${currentInputMode}`;
        if (framework.value && expectedBundleKey !== promptBundleFramework) {
          loadPromptBundle(framework.value, currentInputMode);
        }
      };

      framework.addEventListener("change", sync);
      sync();
    };

    const setupProviderModelSync = () => {
      const provider = byId("llmProvider");
      const model = byId("llmModel");
      if (!provider || !model) return;

      const sync = () => {
        const models = PROVIDER_MODELS[provider.value] || [];
        model.innerHTML = "";

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = models.length ? "Selecione um modelo" : "Selecione um provedor";
        model.appendChild(placeholder);

        models.forEach((name) => {
          const option = document.createElement("option");
          option.value = name;
          option.textContent = name;
          model.appendChild(option);
        });

        model.disabled = !models.length;
      };

      provider.addEventListener("change", sync);
      sync();
    };

    const syncEntryModeUI = () => {
      const mode = qsa('input[name="inputMode"]:checked')[0]?.value || INPUT_MODES.FREE;
      byId("freeTextSection")?.classList.toggle("hidden", mode !== INPUT_MODES.FREE);
      byId("structuredSection")?.classList.toggle("hidden", mode !== INPUT_MODES.STRUCTURED);
    };

    const syncInputTypeUI = () => {
      const type = qsa('input[name="inputType"]:checked')[0]?.value || "testcase";
      byId("testCaseGroup")?.classList.toggle("hidden", type === "gherkin");
      byId("gherkinGroup")?.classList.toggle("hidden", type !== "gherkin");
      if (type !== "gherkin") {
        setGherkinFileName("");
      }
      const framework = byId("testFramework")?.value || "";
      if (framework) {
        loadPromptBundle(framework, type === "gherkin" ? "user_story" : "test_case");
      }
    };

    const setGherkinFileName = (name = "") => {
      const label = byId("gherkinFileName");
      if (label) {
        label.textContent = name ? `Arquivo: ${name}` : "Nenhum arquivo selecionado";
      }
    };

    const getPipelineInputMode = () => (qsa('input[name="inputType"]:checked')[0]?.value === "gherkin" ? "user_story" : "test_case");

    const readTextFile = (file) => new Promise((resolve, reject) => {
      if (!file) {
        resolve("");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("Falha ao ler arquivo"));
      reader.readAsText(file);
    });

    const collectManualStoryUrls = () => extractUrlsFromText(normalizeText(byId("gherkinUrlsInput")?.value));

    const setupInputModeToggles = () => {
      qsa('input[name="inputMode"]').forEach((radio) => radio.addEventListener("change", syncEntryModeUI));
      qsa('input[name="inputType"]').forEach((radio) => radio.addEventListener("change", syncInputTypeUI));
      byId("gherkinFileInput")?.addEventListener("change", async (event) => {
        const file = event.target.files?.[0];
        if (!file) {
          setGherkinFileName("");
          return;
        }

        try {
          const content = await readTextFile(file);
          const input = byId("gherkinInput");
          if (input) input.value = content;
          setGherkinFileName(file.name);
        } catch (error) {
          console.error(error);
          showToast(error?.message || "Não foi possível ler o arquivo", "error");
          setGherkinFileName("");
        }
      });
      syncEntryModeUI();
      syncInputTypeUI();
    };

    const ensureStructuredModuleCard = () => {
      const container = byId("structuredModules");
      if (container && !container.querySelector(".module-card")) {
        addStructuredModuleCard();
      }
    };

    const addStructuredModuleCard = () => {
      const container = byId("structuredModules");
      if (!container) return;

      const number = container.querySelectorAll(".module-card").length + 1;
      const card = document.createElement("div");
      card.className = "module-card";
      card.innerHTML = `
        <h4>Módulo ${number}</h4>
        <input class="module-url" type="url" placeholder="https://exemplo.com/pagina" />
        <input class="module-purpose" type="text" placeholder="Finalidade do módulo" />
        <div class="module-steps"></div>
        <div class="module-actions">
          <button type="button" class="btn-secondary btn-small" data-action="add-step">+ Passo</button>
          <button type="button" class="btn-secondary btn-small" data-action="remove-module">Remover</button>
        </div>
      `;

      const stepsWrapper = card.querySelector(".module-steps");
      const addStep = () => {
        const row = document.createElement("div");
        row.className = "step-row";
        row.innerHTML = `<input class="step-input" type="text" placeholder="Descrição do passo" />`;
        stepsWrapper.appendChild(row);
      };

      addStep();

      card.querySelector('[data-action="add-step"]')?.addEventListener("click", addStep);
      card.querySelector('[data-action="remove-module"]')?.addEventListener("click", () => {
        card.remove();
        if (!container.querySelector(".module-card")) {
          addStructuredModuleCard();
        }
      });

      container.appendChild(card);
    };

    const buildStructuredPayload = () => {
      const title = normalizeText(byId("structuredTitle")?.value);
      const modules = [];

      qsa(".module-card").forEach((card) => {
        const url = normalizeText(card.querySelector(".module-url")?.value);
        const purpose = normalizeText(card.querySelector(".module-purpose")?.value);
        const steps = qsa(".step-input", card)
          .map((input) => normalizeText(input.value))
          .filter(Boolean);

        if (!url) return;

        modules.push({
          url,
          purpose,
          execution_steps: steps.map((step) => ({ step, extracted_data: [] })),
        });
      });

      return { testCase: title, modules };
    };

    const refreshLLMSelectorInGenerator = () => {
      const list = byId("llmSelectorList");
      if (!list) return;

      const configs = authService.getLLMConfigs();
      const selected = getGlobalLLMConfigId();
      list.innerHTML = "";

      if (!configs.length) {
        list.innerHTML = '<p class="empty-state">Nenhuma configuração de LLM salva. Configure em <strong>Config. LLM</strong>.</p>';
        refreshStageLLMSelectors();
        return;
      }

      configs.forEach((config) => {
        const item = document.createElement("label");
        item.className = "llm-selector-item";
        item.innerHTML = `
          <input type="radio" name="selectedLLM" value="${config.id}" />
          <div class="provider-badge provider-badge-sm">${PROVIDER_SHORT[config.provider] || "?"}</div>
          <div class="llm-selector-copy">
            <div class="config-name">${escapeHtml(config.name)}</div>
            <div class="config-meta">${escapeHtml(config.provider)} · ${escapeHtml(config.model)} · temp ${config.temperature}</div>
          </div>
        `;

        item.querySelector("input")?.addEventListener("change", () => {
          qsa(".llm-selector-item", list).forEach((entry) => entry.classList.remove("selected"));
          item.classList.add("selected");
        });

        list.appendChild(item);
      });

      const selectedItem = selected
        ? qsa(`input[name="selectedLLM"][value="${selected}"]`, list)[0]
        : qsa('input[name="selectedLLM"]', list)[0];

      if (selectedItem) {
        selectedItem.checked = true;
        selectedItem.closest(".llm-selector-item")?.classList.add("selected");
      }

      refreshStageLLMSelectors();
    };

    const refreshProjectOptions = () => {
      const select = byId("projectSelect");
      if (!select) return;

      const selected = select.value;
      const projects = Array.from(
        new Set([
          ...authService.getProjects(),
          ...authService.getTests().map((test) => test.project).filter(Boolean),
        ])
      );

      select.innerHTML = '<option value="">Selecionar projeto</option>';
      projects.forEach((project) => {
        const option = document.createElement("option");
        option.value = project;
        option.textContent = project;
        select.appendChild(option);
      });
      select.value = selected;
    };

    const collectValidationChanges = (includeManualChanges = true) => {
      if (!includeManualChanges) return {};

      const notes = normalizeText(byId("validationUserResponse")?.value);
      const payload = {};

      if (notes) {
        payload.user_response = notes;
      }

      const manualInputs = qsa("#validationEditableFields .validation-edit-card")
        .map((card) => {
          const name = card.dataset.name || "";
          const current = card.dataset.current || "";
          const value = normalizeText(card.querySelector(".validation-edit-value")?.value);
          if (!name || value === current) return null;
          return { name, value };
        })
        .filter(Boolean);

      if (manualInputs.length) {
        payload.manual_inputs = manualInputs;
      }

      return payload;
    };

    const renderVariables = (variables = []) => {
      const container = byId("variableList");
      if (!container) return;
      container.innerHTML = "";

      const items = Array.isArray(variables) ? variables : variables?.detected_inputs || [];
      if (!items.length) {
        container.innerHTML = '<p class="empty-state">Nenhuma variável detectada</p>';
        return;
      }

      items.forEach((item, index) => {
        const variable = typeof item === "object" ? item : { variable_name: `Var_${index + 1}`, current_value: item };
        const name = variable.variable_name || variable.name || `Variável ${index + 1}`;
        const description = variable.description || variable.placeholder || "Variável para parametrização";
        const currentValue = variable.current_value || variable.suggestedValue || variable.suggested_value || variable.value || "";

        const card = document.createElement("div");
        card.className = "variable-card";
        card.dataset.name = name;
        card.dataset.current = currentValue;
        card.innerHTML = `
          <div class="variable-header">
            <label>${escapeHtml(name)}</label>
            <span class="step-badge">Sugerido</span>
          </div>
          <p class="variable-help">${escapeHtml(description)}</p>
          <div class="variable-grid">
            <div>
              <label>Valor atual</label>
              <input class="variable-suggested" type="text" value="${escapeHtml(currentValue)}" readonly />
            </div>
            <div>
              <label>Seu valor</label>
              <input class="variable-value" type="text" value="${escapeHtml(currentValue)}" placeholder="Digite um valor..." />
            </div>
          </div>
        `;

        container.appendChild(card);
      });
    };

    const artifactUrl = (path) => {
      if (!path) return "";
      return `${root.constants.API_BASE_URL}/pipeline/artifact?path=${encodeURIComponent(path)}`;
    };

    const friendlyReportLabel = (key) => {
      const map = {
        execution_analysis: "Análise da Execução",
        final_conclusion: "Conclusão Final",
        general_recommendations: "Recomendações Gerais",
        logs_analysis: "Análise dos Logs",
        homologation_status: "Status da Homologação",
        success_rate: "Taxa de Sucesso",
        failure_rate: "Taxa de Falha",
        probable_cause: "Causa Provável",
        broken_elements: "Elementos Quebrados",
        selector_issues: "Problemas de Seletor",
        invalid_fields: "Campos Inválidos",
        execution_time: "Tempo de Execução",
        executed_steps: "Passos Executados",
        failed_steps: "Passos que Falharam",
        improvement_suggestions: "Sugestões de Melhoria",
        technical_diagnosis: "Diagnóstico Técnico",
        possible_improvements: "Possíveis Melhorias",
        stability_rate: "Taxa de Estabilidade",
        flaky_probability: "Probabilidade de Flaky Test",
        robustness_analysis: "Análise de Robustez",
        timeline: "Timeline",
        prompts_used: "Prompts Utilizados",
        exportables: "Artefatos Exportáveis",
        final_result: "Resultado Final",
      };
      return map[key] || key.replaceAll("_", " ");
    };

    const renderFinalResultSummary = (container, finalResult = {}) => {
      if (!finalResult || typeof finalResult !== "object") return false;

      const entries = [
        ["test_passed", "Teste passou"],
        ["automation_reliability", "Confiabilidade"],
        ["production_readiness", "Pronto para produção"],
        ["business_validation_status", "Validação de negócio"],
        ["main_failure_reason", "Falha principal"],
        ["technical_diagnosis", "Diagnóstico técnico"],
        ["final_conclusion", "Conclusão final"],
      ].filter(([key]) => Object.prototype.hasOwnProperty.call(finalResult, key));

      if (!entries.length) return false;

      const block = document.createElement("div");
      block.className = "report-block";
      block.innerHTML = `<h4>Resultado Final</h4>`;

      const grid = document.createElement("div");
      grid.className = "report-summary-grid";

      entries.forEach(([key, label]) => {
        const metric = document.createElement("div");
        metric.className = "report-metric";
        metric.innerHTML = `<span>${escapeHtml(label)}</span><strong>${escapeHtml(prettyValue(finalResult[key]))}</strong>`;
        grid.appendChild(metric);
      });

      block.appendChild(grid);
      container.appendChild(block);
      return true;
    };

    const normalizeValidationItems = (payload) => {
      if (!payload || typeof payload !== "object") return { detected_inputs: [], editable_fields: [] };
      return {
        detected_inputs: Array.isArray(payload.detected_inputs) ? payload.detected_inputs : [],
        editable_fields: Array.isArray(payload.editable_fields) ? payload.editable_fields : [],
      };
    };

    const renderValidationCards = (payload) => {
      const data = normalizeValidationItems(payload?.validation || payload);
      const detectedContainer = byId("validationDetectedInputs");
      const editableContainer = byId("validationEditableFields");
      const summaryContainer = byId("validationSummary");

      if (summaryContainer) {
        const totalDetected = data.detected_inputs.length;
        const totalEditable = data.editable_fields.length;
        summaryContainer.innerHTML = `
          <div class="report-summary-grid">
            <div class="report-metric"><span>Variáveis detectadas</span><strong>${escapeHtml(String(totalDetected))}</strong></div>
            <div class="report-metric"><span>Campos editáveis</span><strong>${escapeHtml(String(totalEditable))}</strong></div>
          </div>
        `;
      }

      const renderCardList = (container, items, mode) => {
        if (!container) return;
        if (!items.length) {
          container.innerHTML = '<p class="empty-state">Nenhum item detectado</p>';
          return;
        }

        container.innerHTML = items.map((item, index) => {
          const name = item.variable_name || item.name || `Variável ${index + 1}`;
          const value = item.current_value ?? item.value ?? "";
          const description = item.description || "Variável detectada automaticamente.";
          const type = item.type || "string";
          const required = item.required === false ? "Opcional" : "Obrigatória";
          const relatedSteps = Array.isArray(item.related_steps) ? item.related_steps : [];
          const stepTags = relatedSteps.length
            ? relatedSteps.map((step) => `<span class="chip">${escapeHtml(step)}</span>`).join("")
            : '<span class="chip chip-muted">Sem passos relacionados</span>';
          const detectableInput = mode === "Detectada"
            ? `<div class="validation-card-grid">
                <div><span>Valor atual</span><strong>${escapeHtml(prettyValue(value))}</strong></div>
                <div><span>Tipo</span><strong>${escapeHtml(String(type))}</strong></div>
                <div><span>Obrigatoriedade</span><strong>${escapeHtml(required)}</strong></div>
              </div>`
            : "";
          const editableInput = mode === "Editável"
            ? `<div class="validation-edit-field"><label>Novo valor</label><input class="validation-edit-value" type="text" value="${escapeHtml(prettyValue(value))}" placeholder="Digite o novo valor" /></div>`
            : "";
          const relatedStepsPreview = mode === "Detectada"
            ? `<div class="validation-card-steps">
                <span class="validation-card-label">Passos relacionados</span>
                <div class="chip-row">${stepTags}</div>
              </div>`
            : "";
          return `
            <article class="validation-card validation-${mode.toLowerCase()}-card${mode === "Editável" ? " validation-edit-card" : ""}" data-name="${escapeHtml(name)}" data-current="${escapeHtml(prettyValue(value))}">
              <div class="validation-card-head">
                <div>
                  <div class="validation-card-title">${escapeHtml(name)}</div>
                  <div class="validation-card-subtitle">${escapeHtml(description)}</div>
                </div>
                <span class="step-badge">${escapeHtml(mode)}</span>
              </div>
              ${detectableInput}
              ${editableInput}
              ${relatedStepsPreview}
            </article>
          `;
        }).join("");
      };

      renderCardList(detectedContainer, data.detected_inputs, "Detectada");
      renderCardList(editableContainer, data.editable_fields, "Editável");
    };

    const sanitizeModuleTreeForDisplay = (value) => {
      if (!value || typeof value !== "object") return value;
      const copy = typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
      const modules = Array.isArray(copy?.modules) ? copy.modules : [];
      modules.forEach((module) => {
        if (module && typeof module === "object" && "extracted_data" in module) {
          module.extracted_data = [];
        }
      });
      return copy;
    };

    const getScriptExtension = () => {
      const framework = String(currentSession?.framework || "").toLowerCase();
      const language = String(currentSession?.language || "").toLowerCase();
      if (framework.includes("robot") || language === "robot") return "robot";
      if (framework.includes("pytest") || language === "python" || framework.includes("python")) return "py";
      if (framework.includes("selenium")) return "py";
      if (framework.includes("cypress")) return "js";
      if (framework.includes("playwright")) return language === "ts" ? "ts" : "js";
      if (language === "js" || language === "javascript") return "js";
      if (language === "ts" || language === "typescript") return "ts";
      return "txt";
    };

    const makeFileName = (base, suffix, extension) => {
      const safeBase = normalizeText(base || "script").replace(/[^\w.-]+/g, "_") || "script";
      const safeSuffix = normalizeText(suffix || "").replace(/[^\w.-]+/g, "_");
      return `${safeBase}${safeSuffix ? `-${safeSuffix}` : ""}.${extension}`;
    };

    const downloadTextFile = (content, fileName, mimeType = "text/plain;charset=utf-8") => {
      const blob = new Blob([content || ""], { type: mimeType });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);
    };

    const downloadJsonByStage = (stageKey) => {
      const mapping = {
        restructure: "structured",
        extraction: "extracted",
        refinement: "refined",
      };
      const resultKey = mapping[stageKey];
      const payload = currentSession?.results?.[resultKey] || currentSession?.results?.[stageKey] || currentSession?.results || {};
      const extension = "json";
      downloadTextFile(JSON.stringify(payload, null, 2), makeFileName(currentSession?.testName, stageKey, extension), "application/json");
    };

    const getGraphDataForStage = (stageKey, payload) => {
      if (stageKey === "restructure") return payload?.structured || payload;
      if (stageKey === "extraction") return payload?.extracted_snapshot || payload?.extracted || payload;
      if (stageKey === "refinement") return payload?.refined_snapshot || payload?.refined || payload;
      return payload;
    };

    const buildGraphModel = (testData) => {
      const graph = {
        nodes: [],
        links: [],
      };

      const modules = Array.isArray(testData?.modules) ? testData.modules : [];
      let nodeId = 0;

      const rootId = nodeId++;
      graph.nodes.push({
        id: rootId,
        label: testData?.testCase || testData?.test_case || "Test Case",
        type: "testCase",
        level: 0,
      });

      let previousFlowId = rootId;

      modules.forEach((module, moduleIndex) => {
        const steps = Array.isArray(module?.execution_steps) ? module.execution_steps : [];

        steps.forEach((stepData, stepIndex) => {
          const stepId = nodeId++;
          graph.nodes.push({
            id: stepId,
            label: stepData?.step || `Step ${stepIndex + 1}`,
            type: "step",
            level: 1,
            moduleIndex,
            modulePurpose: module?.purpose || "",
            moduleUrl: module?.url || "",
          });

          graph.links.push({
            source: previousFlowId,
            target: stepId,
            isFlow: true,
          });
          previousFlowId = stepId;

          const details = Array.isArray(stepData?.extracted_data) ? stepData.extracted_data : [];
          details.forEach((detail, detailIndex) => {
            const detailId = nodeId++;
            graph.nodes.push({
              id: detailId,
              label: detail?.request_description || detail?.step_name || `Detail ${detailIndex + 1}`,
              type: "detail",
              level: 2,
              moduleIndex,
              parentStep: stepId,
            });

            graph.links.push({
              source: stepId,
              target: detailId,
              isChild: true,
              linkType: "detail",
            });

            const propertyEntries = Object.entries(detail || {})
              .filter(([key, value]) => {
                if (["request_description", "step_name"].includes(key)) return false;
                if (value === undefined || value === null || value === "") return false;
                return true;
              });

            propertyEntries.forEach(([key, value]) => {
              const propId = nodeId++;
              const displayValue = typeof value === "object" ? JSON.stringify(value) : String(value);
              graph.nodes.push({
                id: propId,
                label: `${key}: ${displayValue}`,
                type: "property",
                level: 3,
                parentDetail: detailId,
              });

              graph.links.push({
                source: detailId,
                target: propId,
                isChild: true,
                linkType: "property",
              });
            });
          });
        });
      });

      return graph;
    };

    const measureGraphNode = (node) => {
      const labelLength = String(node?.label || "").length;
      if (node?.type === "testCase") {
        return { width: Math.max(220, Math.min(420, labelLength * 9 + 48)), height: 84 };
      }
      if (node?.type === "step") {
        return { width: Math.max(180, Math.min(300, labelLength * 7 + 42)), height: 72 };
      }
      if (node?.type === "detail") {
        return { width: Math.max(170, Math.min(320, labelLength * 6 + 40)), height: 68 };
      }
      return { width: Math.max(150, Math.min(280, labelLength * 5 + 36)), height: 58 };
    };

    const wrapSvgText = (text, maxChars = 22) => {
      const value = String(text || "");
      if (!value) return [""];
      const words = value.split(/\s+/);
      const lines = [];
      let currentLine = "";

      words.forEach((word) => {
        const candidate = currentLine ? `${currentLine} ${word}` : word;
        if (candidate.length <= maxChars) {
          currentLine = candidate;
        } else {
          if (currentLine) lines.push(currentLine);
          if (word.length > maxChars) {
            let chunk = "";
            word.split("").forEach((char) => {
              const next = `${chunk}${char}`;
              if (next.length > maxChars) {
                if (chunk) lines.push(chunk);
                chunk = char;
              } else {
                chunk = next;
              }
            });
            currentLine = chunk;
          } else {
            currentLine = word;
          }
        }
      });

      if (currentLine) lines.push(currentLine);
      return lines.length ? lines : [value];
    };

    const getNodeColor = (type) => ({
      testCase: "#dbeafe",
      step: "#ede9fe",
      detail: "#dcfce7",
      property: "#fef3c7",
    }[type] || "#f8fafc");

    const getNodeStroke = (type) => ({
      testCase: "#2563eb",
      step: "#7c3aed",
      detail: "#16a34a",
      property: "#d97706",
    }[type] || "#94a3b8");

    const wrapLabel = (label, type) => {
      const text = String(label ?? "");
      const maxChars = {
        testCase: 24,
        step: 22,
        detail: 26,
        property: 32,
      }[type] || 24;

      if (text.length <= maxChars) return [text];
      const tokens = text.match(/[^\/\[\]\(\)\{\}\s=:@?&|,;]+|[\/\[\]\(\)\{\}\s=:@?&|,;]+/g) || [text];
      const lines = [];
      let current = "";

      const pushLine = () => {
        if (current.trim()) {
          lines.push(current.trim());
          current = "";
        }
      };

      tokens.forEach((token) => {
        if (/^\s+$/.test(token)) {
          if (current) current += " ";
          return;
        }

        const candidate = current ? `${current}${token}` : token;
        if (candidate.length <= maxChars) {
          current = candidate;
          return;
        }

        pushLine();

        if (token.length <= maxChars) {
          current = token;
          return;
        }

        for (let i = 0; i < token.length; i += maxChars) {
          lines.push(token.slice(i, i + maxChars));
        }
      });

      pushLine();
      return lines.length ? lines : [text];
    };

    const getNodeMetrics = (node, order, width, height, positionMap) => {
      const lines = wrapLabel(node.label, node.type);
      const maxLineLength = Math.max(...lines.map((line) => line.length), 1);
      const lineCount = lines.length;

      const baseWidth = {
        testCase: 240,
        step: 210,
        detail: 240,
        property: 290,
      }[node.type] || 180;

      const widthValue = Math.max(baseWidth, Math.min(460, Math.ceil(maxLineLength * (node.type === "property" ? 6.4 : 7.2) + 30)));
      const lineHeight = node.type === "property" ? 11 : node.type === "detail" ? 13 : 14;
      const heightValue = Math.max(
        {
          testCase: 58,
          step: 54,
          detail: 56,
          property: 46,
        }[node.type] || 50,
        lineCount * lineHeight + 22
      );

      const centerX = width / 2;
      const stepGap = 130;
      const baseTop = 85;
      let anchorX = centerX;
      let anchorY = baseTop;

      if (node.type === "testCase") {
        anchorX = centerX;
        anchorY = 70;
      } else if (node.type === "step") {
        anchorX = centerX + (order % 2 === 0 ? -22 : 22);
        anchorY = baseTop + order * stepGap + (order % 3) * 5;
      } else if (node.type === "detail") {
        const parent = positionMap.get(node.parentStep);
        const direction = order % 2 === 0 ? -1 : 1;
        anchorX = parent ? parent.x + direction * (220 + (order % 3) * 18) : centerX + direction * 240;
        anchorY = parent ? parent.y + ((order % 3) - 1) * 38 : baseTop + order * 42;
      } else if (node.type === "property") {
        const parent = positionMap.get(node.parentDetail);
        const propertyAnchors = [-160, 160, -255, 255];
        anchorX = parent ? parent.x + propertyAnchors[order % propertyAnchors.length] : centerX + propertyAnchors[order % propertyAnchors.length];
        anchorY = parent ? parent.y + ((order % 4) - 1.5) * 20 : baseTop + order * 18;
      }

      return {
        width: widthValue,
        height: heightValue,
        anchorX,
        anchorY,
      };
    };

    const renderGraphView = (containerId, data, stageLabel = "Estrutura") => {
      const container = byId(containerId);
      if (!container || typeof window.d3 === "undefined") return;

      let graphData = data;
      if (typeof graphData === "string") {
        try {
          graphData = JSON.parse(graphData);
        } catch {
          graphData = {};
        }
      }

      const graph = buildGraphModel(graphData);
      const width = 1600;
      const height = 920;

      const nodes = graph.nodes.map((node) => ({ ...node }));
      const links = graph.links.map((link) => ({ ...link }));

      const positionMap = new Map();
      let stepOrder = 0;
      let detailOrder = 0;
      let propertyOrder = 0;
      nodes.forEach((node, index) => {
        const order = node.type === "step"
          ? stepOrder++
          : node.type === "detail"
            ? detailOrder++
            : node.type === "property"
              ? propertyOrder++
              : index;
        const metrics = getNodeMetrics(node, order, width, height, positionMap);
        node.width = metrics.width;
        node.height = metrics.height;
        node.anchorX = metrics.anchorX;
        node.anchorY = metrics.anchorY;
        positionMap.set(node.id, {
          x: metrics.anchorX,
          y: metrics.anchorY,
          width: metrics.width,
          height: metrics.height,
        });
      });

      const shell = document.createElement("div");
      shell.className = "graph-shell";
      shell.innerHTML = `
        <aside class="graph-legend">
          <div class="legend-list">
            <div class="legend-item"><span class="legend-swatch legend-root"></span><span>Caso de teste</span></div>
            <div class="legend-item"><span class="legend-swatch legend-step"></span><span>Passos do fluxo</span></div>
            <div class="legend-item"><span class="legend-swatch legend-detail"></span><span>Elementos extraídos</span></div>
            <div class="legend-item"><span class="legend-swatch legend-property"></span><span>Propriedades do elemento</span></div>
            <div class="legend-item"><span class="legend-line legend-flow"></span><span>Fluxo principal</span></div>
            <div class="legend-item"><span class="legend-line legend-child"></span><span>Relação pai/filho</span></div>
          </div>
        </aside>
        <div class="graph-stage">
          <div class="graph-viewport">
            <svg class="graph-svg"></svg>
          </div>
        </div>
      `;

      container.innerHTML = "";
      container.appendChild(shell);

      const svg = window.d3.select(shell).select(".graph-svg");
      svg.selectAll("*").remove();
      svg.attr("width", width).attr("height", height).attr("viewBox", [0, 0, width, height]);

      const g = svg.append("g");
      const zoom = window.d3.zoom().on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
      svg.call(zoom);

      const simulation = window.d3.forceSimulation(nodes)
        .force("link", window.d3.forceLink(links)
          .id((d) => d.id)
          .distance((d) => d.isChild ? (d.linkType === "property" ? 85 : 72) : 145)
          .strength((d) => d.isChild ? 0.88 : 0.68))
        .force("charge", window.d3.forceManyBody().strength((d) => {
          if (d.type === "testCase") return -360;
          if (d.type === "step") return -220;
          if (d.type === "detail") return -140;
          return -90;
        }))
        .force("x", window.d3.forceX((d) => d.anchorX).strength((d) => {
          if (d.type === "step") return 0.72;
          if (d.type === "detail") return 0.35;
          return 0.24;
        }))
        .force("y", window.d3.forceY((d) => d.anchorY).strength((d) => {
          if (d.type === "step") return 0.88;
          if (d.type === "detail") return 0.56;
          return 0.34;
        }))
        .force("center", window.d3.forceCenter(width / 2, height / 2))
        .force("collide", window.d3.forceCollide((d) => Math.max(d.width, d.height) / 2 + 14).iterations(2));

      simulation.velocityDecay(0.54);

      // const link = g.selectAll("line")
      //   .data(links)
      //   .enter()
      //   .append("line")
      //   .attr("class", (d) => {
      //     if (!d.isChild) return "flow-link";
      //     return d.linkType === "property" ? "child-link property-link" : "child-link detail-link";
      //   })
      //   .attr("marker-end", "url(#arrowhead)")

      // svg.append("defs").append("marker")
      //   .attr("id", "arrowhead")
      //   .attr("markerWidth", 10)
      //   .attr("markerHeight", 10)
      //   .attr("refX", 12)
      //   .attr("refY", 5)
      //   .attr("orient", "auto")
      //   .append("polygon")
      //   .attr("points", "0 0, 10 5, 0 10")
      //   .attr("fill", "#2563eb");

      // cria id único para cada gráfico
      const markerId = `arrowhead-${containerId}`;

      // criar marker PRIMEIRO
      const defs = svg.append("defs");

      defs.append("marker")
        .attr("id", markerId)
        .attr("markerWidth", 40)
        .attr("markerHeight", 40)
        .attr("refX", 58) // afasta mais do card
        .attr("refY", 18)
        .attr("orient", "auto")
        .attr("markerUnits", "userSpaceOnUse")
        .append("polygon")
        .attr("points", "0 0, 36 18, 0 36")
        .attr("fill", "#2563eb");

      // criar links DEPOIS
      const link = g.selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("class", (d) => {
          if (!d.isChild) return "flow-link";

          return d.linkType === "property"
            ? "child-link property-link"
            : "child-link detail-link";
        })
        .attr("marker-end", d =>
          d.isFlow ? `url(#${markerId})` : ""
        );

      const node = g.selectAll("g.node")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .call(window.d3.drag()
          .on("start", dragStarted)
          .on("drag", dragged)
          .on("end", dragEnded));

      node.append("rect")
        .attr("width", (d) => d.width)
        .attr("height", (d) => d.height)
        .attr("x", (d) => -(d.width / 2))
        .attr("y", (d) => -(d.height / 2))
        .attr("rx", (d) => (d.type === "property" ? 5 : 10))
        .attr("class", (d) => `node-${d.type}`)
        .attr("fill", (d) => getNodeColor(d.type))
        .attr("stroke", (d) => getNodeStroke(d.type))
        .attr("stroke-width", 2.2);

      node.append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("class", "node-label")
      .each(function(d) {
        const lines = wrapLabel(d.label, d.type);

        const lineHeight =
          d.type === "property"
            ? 11
            : d.type === "detail"
              ? 13
              : 14;

        // centraliza verticalmente o bloco inteiro de linhas
        const startY =
          -((lines.length - 1) * lineHeight) / 2 + lineHeight / 2;

        const text = window.d3.select(this);

        text.selectAll("tspan").remove();

        lines.forEach((line, i) => {
          text.append("tspan")
            .attr("x", 0)
            .attr("dy", i === 0 ? startY : lineHeight)
            .text(line);
        });
      })
      .attr("font-size", "0.8rem")
      .attr("font-weight", (d) =>
        d.type === "testCase" || d.type === "step"
          ? "bold"
          : "normal"
      );  

      simulation.on("tick", () => {
        link
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);

        node.attr("transform", (d) => `translate(${d.x},${d.y})`);
      });

      function dragStarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.15).restart();
        d.fx = d.x;
        d.fy = d.y;
      }

      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragEnded(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
    };

    const prettyValue = (value) => {
      if (value === null || value === undefined || value === "") return "Não informado";
      if (Array.isArray(value)) {
        return value
          .map((item) => (typeof item === "object" ? JSON.stringify(item, null, 2) : String(item)))
          .join("\n");
      }
      if (typeof value === "object") {
        return JSON.stringify(value, null, 2);
      }
      return String(value);
    };

    const renderNarrativeBlocks = (container, payload) => {
      const orderedKeys = [
        "execution_analysis",
        "logs_analysis",
        "homologation_status",
        "success_rate",
        "failure_rate",
        "probable_cause",
        "final_conclusion",
        "general_recommendations",
        "technical_diagnosis",
        "possible_improvements",
        "stability_rate",
        "flaky_probability",
        "robustness_analysis",
      ];
      const availableKeys = orderedKeys.filter((key) => Object.prototype.hasOwnProperty.call(payload, key));
      if (!availableKeys.length) return false;

      const wrapper = document.createElement("div");
      wrapper.className = "report-stack";
      availableKeys.forEach((key) => {
        const block = document.createElement("article");
        block.className = "report-fragment";
        block.innerHTML = `
          <div class="report-fragment-title">${friendlyReportLabel(key)}</div>
          <div class="report-fragment-body">${escapeHtml(prettyValue(payload[key]))}</div>
        `;
        wrapper.appendChild(block);
      });
      container.appendChild(wrapper);
      return true;
    };

    const renderArtifacts = (items = [], containerId, title = "Artefatos") => {
      const container = byId(containerId);
      if (!container) return;
      const list = Array.isArray(items) ? items : [];

      if (!list.length) {
        container.innerHTML = `<p class="empty-state">Nenhum ${title.toLowerCase()} disponível</p>`;
        return;
      }

      container.innerHTML = `
        <div class="report-card">
          <div class="report-card-title">${title}</div>
          <div class="artifact-grid">
            ${list
              .map((item) => {
                const url = artifactUrl(item);
                const label = item.split(/[\\/]/).pop();
                return `
                  <a class="artifact-chip" href="${url}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>
                `;
              })
              .join("")}
          </div>
        </div>
      `;
    };

    const getImageArtifactPaths = (...groups) =>
      groups
        .flat()
        .filter((item) => typeof item === "string" && /\.(png|jpe?g|webp|gif)$/i.test(item));

    const renderScreenshotGallery = (paths = [], container, title = "Screenshots") => {
      const list = Array.isArray(paths) ? paths.filter((path) => typeof path === "string" && path.trim()) : [];
      if (!list.length || !container) return false;

      const block = document.createElement("div");
      block.className = "report-block";
      block.innerHTML = `<h4>${escapeHtml(title)}</h4><div class="screenshot-grid"></div>`;
      const grid = block.querySelector(".screenshot-grid");

      list.forEach((path) => {
        const figure = document.createElement("a");
        figure.className = "screenshot-card";
        figure.href = artifactUrl(path);
        figure.target = "_blank";
        figure.rel = "noreferrer";
        figure.innerHTML = `<img src="${artifactUrl(path)}" alt="screenshot" loading="lazy" /><span>${escapeHtml(path.split(/[\\/]/).pop())}</span>`;
        grid?.appendChild(figure);
      });

      container.appendChild(block);
      return true;
    };

    const renderReportSection = (containerId, title, value, extraRenderer = null) => {
      const container = byId(containerId);
      if (!container) return;
      const safeValue = value && typeof value === "object" ? value : { value };
      container.innerHTML = `
        <div class="report-card">
          <div class="report-card-title">${title}</div>
          <div class="report-grid"></div>
        </div>
      `;
      const grid = container.querySelector(".report-grid");
      if (!grid) return;

      const renderedNarrative = renderNarrativeBlocks(container.querySelector(".report-card"), safeValue);

      Object.entries(safeValue || {}).forEach(([key, item]) => {
        if (
          key === "screenshots" ||
          key === "logs" ||
          key === "exportables" ||
          key === "original_script" ||
          key === "refactored_script" ||
          key === "diff" ||
          key === "justification" ||
          key === "timeline" ||
          key === "prompts_used" ||
          key === "final_result"
        ) {
          return;
        }
        if (renderedNarrative && ["execution_analysis", "logs_analysis", "homologation_status", "success_rate", "failure_rate", "probable_cause", "final_conclusion", "general_recommendations", "technical_diagnosis", "possible_improvements", "stability_rate", "flaky_probability", "robustness_analysis"].includes(key)) {
          return;
        }

        const row = document.createElement("div");
        row.className = "report-item";
        row.innerHTML = `
          <div class="report-item-label">${escapeHtml(key.replaceAll("_", " "))}</div>
          <div class="report-item-value">${escapeHtml(typeof item === "object" ? JSON.stringify(item, null, 2) : String(item ?? ""))}</div>
        `;
        grid.appendChild(row);
      });

      extraRenderer?.(safeValue, container);
      const card = container.querySelector(".report-card");
      if (card) {
        const hasContent = grid.childElementCount > 0 || Boolean(renderedNarrative);
        card.classList.toggle("report-card--empty", !hasContent);
      }
    };

    const normalizeReportStatus = (value) => {
      if (value === undefined || value === null || value === "") return null;
      if (typeof value === "boolean") {
        return value ? { label: "PASSED", state: "passed" } : { label: "FAILED", state: "failed" };
      }
      const text = String(value).trim().toLowerCase();
      if (!text) return null;
      if (["passed", "pass", "success", "succeeded", "ok", "done", "ready", "validated", "validado", "true"].includes(text)) {
        return { label: "PASSED", state: "passed" };
      }
      if (["failed", "fail", "error", "rejected", "not_ready", "not ready", "false", "invalid", "not_validated", "not validated"].includes(text)) {
        return { label: "FAILED", state: "failed" };
      }
      return null;
    };

    const resolveReportStatus = (stageKey, value) => {
      if (!value || typeof value !== "object") return null;
      const candidates = [];

      if (stageKey === "execution") {
        if (typeof value?.test_results?.exit_code === "number") {
          return value.test_results.exit_code === 0
            ? { label: "PASSED", state: "passed" }
            : { label: "FAILED", state: "failed" };
        }
        candidates.push(
          value.status,
          value.result,
          value.outcome,
          value.test_results?.status,
          value.test_results?.result
        );
      }

      if (stageKey === "homologation") {
        candidates.push(value.homologation_status, value.status, value.test_passed, value.success_rate);
      }

      if (stageKey === "finalization") {
        candidates.push(
          value.pipeline_status,
          value.status,
          value.final_result?.test_passed,
          value.final_result?.production_readiness,
          value.final_result?.automation_reliability
        );
      }

      if (stageKey === "refactoring") {
        candidates.push(value.status, value.refactoring_status, value.pipeline_status, value.result);
      }

      for (const candidate of candidates) {
        const normalized = normalizeReportStatus(candidate);
        if (normalized) return normalized;
      }

      if (stageKey === "homologation") {
        if (value.test_passed === true) return { label: "PASSED", state: "passed" };
        if (value.test_passed === false) return { label: "FAILED", state: "failed" };
      }

      if (stageKey === "finalization") {
        const testPassed = value.final_result?.test_passed;
        if (testPassed === true || testPassed === "true") return { label: "PASSED", state: "passed" };
        if (testPassed === false || testPassed === "false") return { label: "FAILED", state: "failed" };
      }

      if (stageKey === "refactoring") {
        if (value.error || value.failed === true) return { label: "FAILED", state: "failed" };
        if (value.refactored_script || value.original_script) return { label: "PASSED", state: "passed" };
      }

      return null;
    };

    const injectReportStatus = (containerId, stageKey, value) => {
      const container = byId(containerId);
      if (!container) return;
      const card = container.querySelector(".report-card");
      if (!card) return;

      card.querySelector(".report-status")?.remove();
      const status = resolveReportStatus(stageKey, value);
      if (!status) return;

      const pill = document.createElement("div");
      pill.className = `report-status report-status-${status.state}`;
      pill.textContent = status.label;
      card.prepend(pill);
    };

    const renderExecutionReport = (execution) => {
      renderReportSection("executionContent", "Execução", execution, (value, container) => {
        const imageArtifacts = getImageArtifactPaths(
          value?.screenshots || [],
          value?.image_evidence || [],
          value?.evidence || [],
          value?.test_results?.screenshots || []
        );
        const primaryScreenshot = value?.primary_screenshot || imageArtifacts[0] || "";

        if (value.stdout) {
          const stdout = document.createElement("div");
          stdout.className = "report-block";
          stdout.innerHTML = `<h4>stdout</h4><pre>${escapeHtml(value.stdout)}</pre>`;
          container.appendChild(stdout);
        }

        if (value.stderr) {
          const stderr = document.createElement("div");
          stderr.className = "report-block";
          stderr.innerHTML = `<h4>stderr</h4><pre>${escapeHtml(value.stderr)}</pre>`;
          container.appendChild(stderr);
        }

        if (value.stacktrace) {
          const stack = document.createElement("div");
          stack.className = "report-block";
          stack.innerHTML = `<h4>Stack trace</h4><pre>${escapeHtml(value.stacktrace)}</pre>`;
          container.appendChild(stack);
        }

        if (value.execution_log_lines?.length) {
          const logs = document.createElement("div");
          logs.className = "report-block";
          logs.innerHTML = `<h4>Logs de execução</h4><pre>${escapeHtml(value.execution_log_lines.join("\n"))}</pre>`;
          container.appendChild(logs);
        }

        if (primaryScreenshot) {
          const hero = document.createElement("div");
          hero.className = "report-block";
          hero.innerHTML = `
            <h4>Screenshot de falha</h4>
            <a class="screenshot-hero" href="${artifactUrl(primaryScreenshot)}" target="_blank" rel="noreferrer">
              <img src="${artifactUrl(primaryScreenshot)}" alt="screenshot de falha" loading="lazy" />
              <span>${escapeHtml(primaryScreenshot.split(/[\\/]/).pop())}</span>
            </a>
          `;
          container.appendChild(hero);
        }

        if (imageArtifacts.length) {
          renderScreenshotGallery(imageArtifacts, container, "Screenshots");
        }

        if (value.evidence?.length) {
          renderArtifacts(value.evidence, "executionArtifacts", "Evidências");
        } else if (!imageArtifacts.length) {
          renderArtifacts(value.screenshots || [], "executionArtifacts", "Screenshots");
        }

        if (value.test_results) {
          const summary = document.createElement("div");
          summary.className = "report-block";
          summary.innerHTML = `<h4>Resumo técnico</h4><pre>${escapeHtml(JSON.stringify(value.test_results, null, 2))}</pre>`;
          container.appendChild(summary);
        }
      });
      injectReportStatus("executionContent", "execution", execution);
    };

    const renderHomologationReport = (homologation) => {
      const banner = byId("homologationHeader");
      if (banner) {
        banner.textContent = homologation?.homologation_status ? `Status: ${homologation.homologation_status}` : "Homologação atualizada";
        banner.classList.remove("hidden");
      }
      renderReportSection("homologationContent", "Homologação", homologation, (value, container) => {
        const imageArtifacts = getImageArtifactPaths(
          value?.execution_artifacts?.screenshots || [],
          value?.execution_artifacts?.image_evidence || [],
          value?.screenshots || [],
          value?.image_evidence || [],
          value?.evidence || []
        );

        const summaryGrid = document.createElement("div");
        summaryGrid.className = "report-summary-grid";
        const summaryFields = [
          ["Taxa de sucesso", value.success_rate],
          ["Falhas", value.failure_count || value.failures || value.error_count],
          ["Causa provável", value.probable_cause],
          ["Tempo de execução", value.execution_time || value.runtime],
        ].filter(([, fieldValue]) => fieldValue !== undefined && fieldValue !== null && fieldValue !== "");

        if (summaryFields.length) {
          summaryFields.forEach(([label, fieldValue]) => {
            const summary = document.createElement("div");
            summary.className = "report-metric";
            summary.innerHTML = `<span>${escapeHtml(label)}</span><strong>${escapeHtml(prettyValue(fieldValue))}</strong>`;
            summaryGrid.appendChild(summary);
          });
          container.appendChild(summaryGrid);
        }

        if (imageArtifacts.length) {
          renderScreenshotGallery(imageArtifacts, container, "Screenshots");
        }
      });
      injectReportStatus("homologationContent", "homologation", homologation);
    };

    const renderFinalizationReport = (report) => {
      renderReportSection("finalizationContent", "Finalização", report);
      injectReportStatus("finalizationContent", "finalization", report);
      const exportables = report?.exportables || {};
      const container = byId("finalizationContent");
      if (!container) return;
      if (report?.final_result) {
        renderFinalResultSummary(container, report.final_result);
      }
      const timeline = report?.timeline || [];
      if (timeline.length) {
        const timelineBlock = document.createElement("div");
        timelineBlock.className = "report-block";
        timelineBlock.innerHTML = `
          <h4>Timeline</h4>
          <div class="timeline-list">
            ${timeline
              .map((item) => `<div class="timeline-item"><strong>${escapeHtml(item.stage || item.event || "Etapa")}</strong><span>${escapeHtml(item.timestamp || "")}</span></div>`)
              .join("")}
          </div>
        `;
        container.appendChild(timelineBlock);
      }
      if (exportables.json || exportables.html || exportables.markdown) {
        const wrap = document.createElement("div");
        wrap.className = "report-block";
        wrap.innerHTML = `
          <h4>Exportáveis</h4>
          <div class="artifact-grid">
            ${exportables.json ? '<button type="button" class="artifact-chip" data-export="json">JSON</button>' : ""}
            ${exportables.html ? '<button type="button" class="artifact-chip" data-export="html">HTML</button>' : ""}
            ${exportables.markdown ? '<button type="button" class="artifact-chip" data-export="markdown">Markdown</button>' : ""}
          </div>
        `;
        container.appendChild(wrap);
      }
    };

    const renderRefactoringReport = (refactoring) => {
      renderReportSection("refactoringContent", "Refatoração", refactoring, (value, container) => {
        if (value.original_script || value.refactored_script) {
          const block = document.createElement("div");
          block.className = "report-block";
          block.innerHTML = `
            <h4>Executado / Refatorado</h4>
            <div class="split-grid">
              <div><strong>Executado</strong><pre>${escapeHtml(value.original_script || "")}</pre></div>
              <div><strong>Refatorado</strong><pre>${escapeHtml(value.refactored_script || "")}</pre></div>
            </div>
          `;
          container.appendChild(block);
        }
        if (value.diff) {
          const diff = document.createElement("div");
          diff.className = "report-block";
          diff.innerHTML = `<h4>Diff</h4><pre>${escapeHtml(value.diff)}</pre>`;
          container.appendChild(diff);
        }
        if (value.justification) {
          const just = document.createElement("div");
          just.className = "report-block";
          just.innerHTML = `<h4>Justificativa</h4><pre>${escapeHtml(value.justification)}</pre>`;
          container.appendChild(just);
        }
      });
      injectReportStatus("refactoringContent", "refactoring", refactoring);

      const editor = byId("refactoringScriptEditor");
      if (editor && refactoring?.refactored_script) {
        editor.value = refactoring.refactored_script;
      }
    };

    const setValidationFeedback = (message, level = "info") => {
      const banner = byId("validationFeedback");
      if (!banner) return;
      banner.textContent = message;
      banner.className = `status-banner status-${level}`;
      banner.classList.remove("hidden");
    };

    const updateExecutionArtifacts = (execution) => {
      const artifacts = [
        ...(execution?.screenshots || []),
        ...(execution?.traces || []),
        ...(execution?.evidence || []),
      ];
      renderArtifacts(artifacts, "executionArtifacts", artifacts.length ? "Artefatos de execução" : "Artefatos");
    };

    const buildTabContent = () =>
      RESULT_TABS.map((tab) => {
        if (["restructure", "extraction", "refinement"].includes(tab.key)) {
          const treeIdMap = {
            restructure: "structuredTreeContent",
            extraction: "extractedTreeContent",
            refinement: "refinedTreeContent",
          };
          // <div class="report-shell">
          //   <div class="report-card">
          //     <div id="${treeId}" class="graph-host"></div>
          //   </div>
          // </div>
          const treeId = treeIdMap[tab.key] || `${tab.key}TreeContent`;
          return `
            <div id="tab-${tab.key}" class="result-tab">
              <div class="dual-result-layout">
                <div class="report-shell">
                  <div id="${treeId}" class="graph-host"></div>
                </div>
                <div class="report-shell">
                  <div class="code-actions">
                    <button type="button" class="btn-secondary" data-copy-target="${tab.contentId}">Copiar JSON</button>
                    <button type="button" class="btn-secondary" data-action="download-json-target" data-json-target="${tab.contentId}" data-json-stage="${tab.key}">Baixar JSON</button>
                  </div>
                  <div class="code-container"><pre id="${tab.contentId}"><code></code></pre></div>
                </div>
              </div>
            </div>
          `;
        }

        if (tab.key === "validation") {
          return `
            <div id="tab-validation" class="result-tab">
              <div id="validationFeedback" class="status-banner hidden"></div>
              <div class="code-actions">
                <button type="button" class="btn-primary btn-primary-inline" data-action="continue-no-changes">Continuar sem alterações</button>
                <button type="button" class="btn-primary btn-primary-inline" data-action="continue-pipeline">Aplicar alterações e continuar</button>
              </div>
              <div id="validationSummary"></div>
              <div class="validation-section">
                <div class="validation-section-header">
                  <h4>Variáveis detectadas</h4>
                </div>
                <div id="validationDetectedInputs" class="validation-card-grid-list"></div>
              </div>
              <div class="validation-section">
                <div class="validation-section-header">
                  <h4>Campos editáveis</h4>
                </div>
                <div id="validationEditableFields" class="validation-card-grid-list"></div>
              </div>
              <div class="form-group">
                <label for="validationUserResponse">Resposta do usuário</label>
                <textarea id="validationUserResponse" rows="5" placeholder="Explique a validação, ajuste os valores detectados ou descreva qualquer mudança necessária."></textarea>
              </div>
            </div>
          `;
        }

        if (tab.key === "confirmation") {
          return `
            <div id="tab-confirmation" class="result-tab">
              <div class="report-block">
                <h4>Consolidação da Confirmação</h4>
                <div class="split-grid">
                  <div>
                    <div class="code-actions code-actions-inline">
                      <button type="button" class="btn-secondary btn-small" data-copy-target="confirmationGenerationScript">Copiar</button>
                      <button type="button" class="btn-secondary btn-small" data-action="download-script-target" data-script-target="confirmationGenerationScript" data-script-suffix="generated">Baixar</button>
                    </div>
                    <strong>Script original gerado</strong><pre id="confirmationGenerationScript"><code></code></pre>
                  </div>
                  <div>
                    <div class="code-actions code-actions-inline">
                      <button type="button" class="btn-secondary btn-small" data-copy-target="confirmationContent">Copiar</button>
                      <button type="button" class="btn-secondary btn-small" data-action="download-script-target" data-script-target="confirmationContent" data-script-suffix="confirmed">Baixar</button>
                    </div>
                    <strong>Script ajustado na validação</strong><pre id="confirmationContent"><code></code></pre>
                  </div>
                </div>
              </div>
            </div>
          `;
        }

        if (tab.key === "homologation") {
          return `
            <div id="tab-homologation" class="result-tab">
              <div class="report-shell">
                <div id="homologationContent" class="report-host"></div>
              </div>
            </div>
          `;
        }

        if (tab.key === "finalization") {
          return `
            <div id="tab-finalization" class="result-tab">
              <div class="report-shell">
                <div id="finalizationContent" class="report-host"></div>
              </div>
            </div>
          `;
        }

        if (tab.key === "refactoring") {
          return `
            <div id="tab-refactoring" class="result-tab">
              <div class="code-actions">
                <button type="button" class="btn-secondary" data-action="rerun-from-zero">Executar do zero novamente</button>
                <button type="button" class="btn-primary btn-primary-inline" data-action="apply-refactor-stage">Executar script refatorado a partir de Confirmation</button>
                <button type="button" class="btn-secondary" data-action="finalize-execution">Finalizar execução</button>
              </div>
              <div class="form-group">
                <label for="refactoringScriptEditor">Script refatorado</label>
                <textarea id="refactoringScriptEditor" rows="14" class="prompt-textarea"></textarea>
              </div>
              <div class="report-shell">
                <div id="refactoringContent" class="report-host"></div>
              </div>
            </div>
          `;
        }

        if (tab.key === "execution") {
          return `
            <div id="tab-execution" class="result-tab">
              <div class="report-shell">
                <div id="executionContent" class="report-host"></div>
                <div id="executionArtifacts" class="report-host"></div>
              </div>
            </div>
          `;
        }

        if (tab.key === "logs") {
          return `
            <div id="tab-logs" class="result-tab">
              <div id="executionLogs" class="execution-logs"></div>
            </div>
          `;
        }

        if (["restructure", "extraction", "refinement"].includes(tab.key)) {
          const treeIdMap = {
            restructure: "structuredTreeContent",
            extraction: "extractedTreeContent",
            refinement: "refinedTreeContent",
          };
          const treeId = treeIdMap[tab.key] || `${tab.key}TreeContent`;
          return `
            <div id="tab-${tab.key}" class="result-tab">
              <div class="dual-result-layout">
                <div class="report-shell">
                  <div class="report-card" style="padding: 0rem;">
                    <div id="${treeId}" class="graph-host"></div>
                  </div>
                <div class="report-shell">
                  <div class="code-actions">
                    <button type="button" class="btn-secondary" data-copy-target="${tab.contentId}">Copiar JSON</button>
                    <button type="button" class="btn-secondary" data-action="download-json-target" data-json-target="${tab.contentId}" data-json-stage="${tab.key}">Baixar JSON</button>
                  </div>
                  <div class="code-container"><pre id="${tab.contentId}"><code></code></pre></div>
                </div>
              </div>
            </div>
          `;
        }

        return `
          <div id="tab-${tab.key}" class="result-tab">
            <div class="code-actions">
              <button type="button" class="btn-secondary" data-copy-target="${tab.contentId}">Copiar</button>
              ${tab.key === "generation" ? '<button type="button" class="btn-secondary" data-action="download-script">Download</button>' : ""}
            </div>
            <div class="code-container"><pre id="${tab.contentId}"><code></code></pre></div>
          </div>
        `;
      }).join("");

    const activateResultTab = (key) => {
      const container = byId("generationResults");
      if (!container) return;
      qsa(".result-tab-btn", container).forEach((button) => button.classList.remove("active"));
      qsa(".result-tab", container).forEach((panel) => panel.classList.remove("active"));
      container.querySelector(`[data-result-tab="${key}"]`)?.classList.add("active");
      container.querySelector(`#tab-${key}`)?.classList.add("active");
    };

    const buildResultTabs = () => {
      const container = byId("generationResults");
      if (!container) return;

      container.innerHTML = `
        <div class="results-tabs">
          ${RESULT_TABS.map((tab, index) => `<button type="button" class="result-tab-btn${index === 0 ? " active" : ""}" id="result-tab-btn-${tab.key}" data-result-tab="${tab.key}"><span>${tab.title}</span><span class="result-tab-indicator" id="result-status-${tab.key}">○</span></button>`).join("")}
        </div>
        <div class="result-content">${buildTabContent()}</div>
      `;

      container.querySelectorAll(".result-tab-btn").forEach((button) => {
        button.addEventListener("click", () => activateResultTab(button.dataset.resultTab));
      });

      RESULT_TABS.forEach((tab) => setResultStageState(tab.key, "idle"));

      if (!container.dataset.bound) {
        container.addEventListener("click", async (event) => {
          const target = event.target.closest("[data-copy-target],[data-action]");
          if (!target) return;

          const copyTarget = target.dataset.copyTarget;
          const action = target.dataset.action;

          if (copyTarget) {
            await copyCode(copyTarget);
          }

          if (action === "download-script") {
            downloadScriptByTarget("scriptContent", "generated");
          }

          if (action === "download-script-target") {
            downloadScriptByTarget(target.dataset.scriptTarget, target.dataset.scriptSuffix || "script");
          }

          if (action === "download-json-target") {
            downloadJsonTarget(target.dataset.jsonTarget, target.dataset.jsonStage || "");
          }

          if (action === "continue-pipeline") {
            await continueGenerationPipeline(true);
          }

          if (action === "continue-no-changes") {
            await continueGenerationPipeline(false);
          }

          if (action === "relaunch-from-stage") {
            await relaunchPipelineFromStage();
          }

          if (action === "apply-refactor-stage") {
            await applyRefactoredScriptAndRerun();
          }

          if (action === "rerun-from-zero") {
            await rerunPipelineFromZero();
          }

          if (action === "finalize-execution") {
            finalizeExecution();
          }

          if (target.dataset.export) {
            const exportType = target.dataset.export;
            const content = currentSession?.results?.exportables?.[exportType];
            if (content) {
              const blob = new Blob([typeof content === "string" ? content : JSON.stringify(content, null, 2)], {
                type: exportType === "html" ? "text/html" : "application/json",
              });
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = `genia-report.${exportType === "markdown" ? "md" : exportType}`;
              link.click();
              URL.revokeObjectURL(link.href);
            }
          }
        });
        container.dataset.bound = "1";
      }

      activateResultTab("logs");
    };

    const renderPhaseOneResults = (results) => {
      setStep(1, "ok");
      if (results.structured) {
        renderGraphView("structuredTreeContent", results.structured, "Estruturação");
        updateCode("structuredJsonContent", JSON.stringify(results.structured, null, 2));
        addLog("Estruturação concluída", "success", "Estruturação");
      }

      setStep(2, "ok");
      if (results.extracted) {
        renderGraphView("extractedTreeContent", results.extracted, "Extração");
        updateCode("extractedJsonContent", JSON.stringify(results.extracted, null, 2));
        addLog("Extração concluída", "success", "Extração");
      }

      setStep(3, "ok");
      if (results.refined) {
        renderGraphView("refinedTreeContent", results.refined, "Refinamento");
        updateCode("refinedJsonContent", JSON.stringify(results.refined, null, 2));
        addLog("Refinamento concluído", "success", "Refinamento");
      }

      setStep(4, "ok");
      if (results.script) {
        updateCode("scriptContent", results.script);
        updateCode("confirmationGenerationScript", results.script);
        updateCode("confirmationContent", results.script);
        const confirmationEditor = byId("confirmationScriptEditor");
        if (confirmationEditor && !confirmationEditor.value) {
          confirmationEditor.value = results.script;
        }
        addLog("Geração concluída", "success", "Geração");
      }

      setStep(5, "ok");
      renderValidationCards(results.validation || results);
      setValidationFeedback("A validação está pronta. Você pode continuar sem mudanças ou ajustar os campos detectados.", "info");
      addLog("Validação concluída", "success", "Validação");
    };

    const renderPhaseTwoResults = (results) => {
      setStep(6, "ok");
      addLog(results.confirmation_used_llm ? "Confirmação concluída com ajustes manuais" : "Confirmação concluída sem alterações", "success", "Confirmação");
      if (results.confirmed_script) {
        updateCode("confirmationContent", results.confirmed_script);
      }

      setStep(7, "ok");
      if (results.execution || results.execution_result) {
        renderExecutionReport(results.execution || results.execution_result);
        addLog("Execução concluída", "success", "Execução");
      }

      setStep(8, "ok");
      if (results.homologation) {
        renderHomologationReport(results.homologation);
        addLog("Homologação concluída", "success", "Homologação");
      }

      setStep(9, "ok");
      addLog("Finalização concluída", "success", "Finalização");
      if (results.finalReport || results.exportables?.json) {
        renderFinalizationReport(results.finalReport || results.exportables?.json);
      }

      setStep(10, "ok");
      if (results.refactoring || results.refactoredScript) {
        renderRefactoringReport(results.refactoring || { refactored_script: results.refactoredScript });
        addLog("Refatoração concluída", "success", "Refatoração");
      }
    };

    const validateAndGenerateTest = async () => {
      try {
        root.api?.geniaAPI?.closePipelineLogStream?.();
        const configs = authService.getLLMConfigs();
        const selectedId = getGlobalLLMConfigId();
        const llmConfig = configs.find((config) => config.id === selectedId);

        if (!llmConfig) {
          showToast("Selecione uma configuração de LLM", "error");
          return;
        }

        const testName = normalizeText(byId("testCaseName")?.value);
        const framework = byId("testFramework")?.value;
        const language = byId("testLanguage")?.value;
        const inputMode = qsa('input[name="inputMode"]:checked')[0]?.value || INPUT_MODES.FREE;
        const project = byId("projectSelect")?.value || "default";

        if (!testName || !framework || !language) {
          showToast("Preencha nome, framework e linguagem", "error");
          return;
        }

        let testDescription = "";
        let urls = [];
        let backendInputMode = "test_case";
        let userStoryContent = "";
        let userStoryFilename = "";
        let manualUrls = [];

        if (inputMode === INPUT_MODES.FREE) {
          const inputType = qsa('input[name="inputType"]:checked')[0]?.value || "testcase";
          if (inputType === "gherkin") {
            const textareaStory = normalizeText(byId("gherkinInput")?.value);
            const storyFile = byId("gherkinFileInput")?.files?.[0] || null;
            const fileStory = storyFile ? await readTextFile(storyFile) : "";
            userStoryContent = textareaStory || fileStory;
            userStoryFilename = storyFile?.name || "";
            manualUrls = collectManualStoryUrls();
            testDescription = userStoryContent;
            backendInputMode = "user_story";
            urls = Array.from(new Set([
              ...extractUrlsFromText(userStoryContent),
              ...manualUrls,
            ]));
          } else {
            testDescription = normalizeText(byId("freeTextInput")?.value);
            if (!testDescription) {
              showToast("Informe o caso de teste", "error");
              return;
            }
            urls = extractUrlsFromText(testDescription);
          }
        } else {
          const payload = buildStructuredPayload();
          testDescription = payload.testCase;
          backendInputMode = "test_case";
          urls = payload.modules.map((module) => module.url).filter(Boolean);
          if (!testDescription) {
            showToast("Informe o título estruturado", "error");
            return;
          }
        }

        if (!urls.length) {
          showToast("Nenhuma URL detectada no texto", "error");
          return;
        }

        await loadPromptBundle(framework, backendInputMode);

        const pipelineOverrides = collectPipelineOverrides();

        currentSession = createGenerationSession({
          testName,
          framework,
          language,
          inputMode,
          backendInputMode,
          project,
          testDescription,
          urls,
          userStoryContent,
          userStoryFilename,
          manualUrls,
          llmConfig,
          promptOverrides: pipelineOverrides.promptOverrides,
          llmOverrides: pipelineOverrides.llmOverrides,
        });
        currentSession.onLog = handlePipelineEvent;
        setCurrentSession(currentSession);

        const resultsEl = byId("generationResults");
        if (resultsEl) {
          resultsEl.style.display = "block";
          buildResultTabs();
          resultsEl.scrollIntoView({ behavior: "smooth" });
        }

        qsa(".log-entry", byId("executionLogs") || document).forEach((entry) => entry.remove());
        await runGenerationPipeline();
      } catch (error) {
        console.error(error);
        root.api?.geniaAPI?.closePipelineLogStream?.();
        showToast(error.message || "Erro inesperado", "error");
      }
    };

    const runGenerationPipeline = async () => {
      if (!currentSession) return;

      try {
        setStep(1, "running");
        addLog("Estruturando caso de teste...", "info");

        const results = await startPhaseOne(currentSession);
        currentSession.pipelineId = results.pipelineId || currentSession.pipelineId;
        currentSession.awaitingUserResponse = results.status === "waiting_validation";
        currentSession.results = results;

        if (currentSession.pipelineId) {
          addLog(`Pipeline ID armazenado: ${currentSession.pipelineId}`, "info");
        }

        if (currentSession.awaitingUserResponse) {
          addLog("Pipeline pausado na validação. Aguardando resposta do usuário.", "info");
          setValidationFeedback("Pipeline pausada para validação humana. Revise os campos e confirme para continuar.", "warning");
        }

        renderPhaseOneResults(results);
        activateResultTab("validation");
        showToast("Validação pronta. Revise os dados e continue quando estiver pronto.", "success");
      } catch (error) {
        console.error(error);
        setStep(1, "error");
        addLog(`Erro: ${error.message}`, "error");
        root.api?.geniaAPI?.closePipelineLogStream?.();
        showToast(error.message, "error");
      }
    };

    const continueGenerationPipeline = async (withManualChanges = true) => {
      if (!currentSession?.pipelineId) {
        showToast("Pipeline ID não encontrado", "error");
        return;
      }

      try {
        currentSession.scriptOverride = normalizeText(
          byId("confirmationScriptEditor")?.value ||
            byId("confirmationContent")?.textContent ||
            currentSession.results?.confirmed_script ||
            currentSession.results?.script ||
            ""
        );
        currentSession.resumeFromStage = "confirmation";
        setValidationFeedback("A resposta foi enviada. O pipeline voltou a rodar.", "success");
        addLog("Continuando pipeline após validação...", "info", "Validação");
        const manualChanges = collectValidationChanges(withManualChanges);
        setStep(6, "running");
        activateResultTab("logs");

        const results = await continueAfterValidation(currentSession, manualChanges);
        currentSession.awaitingUserResponse = false;
        currentSession.results = {
          ...(currentSession.results || {}),
          ...results,
        };

        renderPhaseTwoResults(results);

        const duration = (Date.now() - currentSession.startTime) / 1000;
        authService.addTest({
          name: currentSession.testName,
          framework: currentSession.framework,
          language: currentSession.language,
          project: currentSession.project,
          provider: currentSession.llmConfig.provider,
          model: currentSession.llmConfig.model,
          inputMode: currentSession.backendInputMode || currentSession.inputMode,
          prompt: Object.keys(currentSession.promptOverrides || {}).length ? JSON.stringify(currentSession.promptOverrides || {}) : "",
          urls: currentSession.urls,
          results: currentSession.results,
          duration: Math.round(duration),
          createdAt: new Date().toISOString(),
          status: "success",
        });

        addLog(`Pipeline completa finalizada em ${duration.toFixed(2)}s`, "success", "Finalização");
        showToast("Pipeline concluída com sucesso", "success");
        onGenerationComplete?.();
        currentSession.completed = true;
      } catch (error) {
        console.error(error);
        setStep(6, "error");
        addLog(`Erro ao continuar: ${error.message}`, "error");
        root.api?.geniaAPI?.closePipelineLogStream?.();
        showToast(error.message, "error");
      }
    };

    const relaunchPipelineFromStage = async () => {
      if (!currentSession?.pipelineId) {
        showToast("Pipeline não encontrada", "error");
        return;
      }

      const resumeStage = byId("resumeStageSelect")?.value || "confirmation";
      const scriptOverride = normalizeText(byId("confirmationScriptEditor")?.value);
      const pipelineOverrides =
        currentSession.promptOverrides || currentSession.llmOverrides
          ? {
              promptOverrides: currentSession.promptOverrides || {},
              llmOverrides: currentSession.llmOverrides || {},
            }
          : collectPipelineOverrides();

      if (!scriptOverride) {
        showToast("Edite o script antes de reexecutar", "error");
        return;
      }

      try {
        setValidationFeedback(`Reexecutando a pipeline a partir de ${resumeStage}.`, "info");
        addLog(`Reexecutando a pipeline a partir de ${resumeStage}...`, "info", "Refatoração");
        currentSession.scriptOverride = scriptOverride;
        currentSession.resumeFromStage = resumeStage;
        currentSession.promptOverrides = pipelineOverrides.promptOverrides;
        currentSession.llmOverrides = pipelineOverrides.llmOverrides;
        const manualChanges = collectValidationChanges(true);
        currentSession.results = currentSession.results || {};
        activateResultTab("logs");
        const results = await continueAfterValidation(currentSession, manualChanges);
        currentSession.results = {
          ...(currentSession.results || {}),
          ...results,
        };
        renderPhaseTwoResults(results);
        currentSession.completed = true;
        showToast("Pipeline reiniciada a partir do estágio selecionado", "success");
      } catch (error) {
        console.error(error);
        addLog(`Falha ao reexecutar: ${error.message}`, "error");
        showToast(error.message, "error");
      }
    };

    const applyRefactoredScriptAndRerun = async () => {
      const editor = byId("refactoringScriptEditor");
      const scriptOverride = normalizeText(editor?.value);
      if (!scriptOverride) {
        showToast("Nenhum script refatorado foi informado", "error");
        return;
      }

      if (!currentSession?.pipelineId) {
        showToast("Pipeline não encontrada", "error");
        return;
      }

      try {
        currentSession.scriptOverride = scriptOverride;
        currentSession.resumeFromStage = "confirmation";
        const results = await continueAfterValidation(currentSession, collectValidationChanges(true));
        currentSession.results = {
          ...(currentSession.results || {}),
          ...results,
        };
        renderPhaseTwoResults(results);
        setResultStageState("confirmation", "done");
        showToast("Script refatorado aplicado e pipeline reexecutada", "success");
      } catch (error) {
        console.error(error);
        addLog(`Falha ao aplicar refatoração: ${error.message}`, "error");
        showToast(error.message, "error");
      }
    };

    const rerunPipelineFromZero = async () => {
      if (!currentSession) {
        showToast("Nenhuma pipeline ativa", "error");
        return;
      }

      try {
        root.api?.geniaAPI?.closePipelineLogStream?.();
        currentSession.pipelineId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        currentSession.startTime = Date.now();
        currentSession.results = null;
        currentSession.awaitingUserResponse = false;
        currentSession.resumeFromStage = null;
        currentSession.scriptOverride = null;
        const pipelineOverrides = collectPipelineOverrides();
        currentSession.promptOverrides = pipelineOverrides.promptOverrides;
        currentSession.llmOverrides = pipelineOverrides.llmOverrides;
        buildResultTabs();
        activateResultTab("logs");
        await runGenerationPipeline();
        showToast("Pipeline reiniciada do zero", "success");
      } catch (error) {
        console.error(error);
        showToast(error.message || "Falha ao reiniciar pipeline", "error");
      }
    };

    const finalizeExecution = () => {
      addLog("Execução finalizada pelo usuário.", "success", "Finalização");
      showToast("Execução finalizada", "success");
      currentSession = null;
      clearCurrentSession();
      root.api?.geniaAPI?.closePipelineLogStream?.();
    };

    const setupProjectManagement = () => {
      byId("createProjectBtn")?.addEventListener("click", () => {
        const input = byId("newProjectName");
        const name = normalizeText(input?.value);
        if (!name) {
          showToast("Informe o nome do projeto", "error");
          return;
        }
        authService.addProject(name);
        if (input) input.value = "";
        refreshProjectOptions();
        showToast("Projeto criado", "success");
      });

      refreshProjectOptions();
    };

    const bind = () => {
      buildPromptsAccordion();
      refreshLLMSelectorInGenerator();
      ensureStructuredModuleCard();
      setupInputModeToggles();
      setupFrameworkLanguageSync();
      setupProviderModelSync();
      setupProjectManagement();

      byId("generateTestBtn")?.addEventListener("click", validateAndGenerateTest);
      byId("addModuleBtn")?.addEventListener("click", addStructuredModuleCard);
    };

    bind();

    return {
      refreshLLMSelectorInGenerator,
      refreshProjectOptions,
      reset: () => {
        currentSession = null;
        root.api?.geniaAPI?.closePipelineLogStream?.();
        clearCurrentSession();
        const results = byId("generationResults");
        if (results) {
          results.style.display = "none";
          results.innerHTML = "";
          delete results.dataset.bound;
        }
      },
      updateDashboard: onGenerationComplete,
      continueGenerationPipeline,
    };
  };

  root.features = root.features || {};
  root.features.generator = {
    setupTestGeneratorPage,
  };
})();
