/**
 * GenIA E2E Test - Frontend Application Logic
 * =============================================
 * UI interactions, form handling, and DOM manipulation.
 * All backend communication goes through api.js.
 */

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const INPUT_MODES = { FREE: 'free', STRUCTURED: 'structured' };

const PROVIDER_MODELS = {
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini'],
  gemini: ['gemini-2.0-flash', 'gemini-1.5-pro'],
  claude: ['claude-3-5-sonnet-latest', 'claude-3-opus-latest'],
  cohere: ['command-r', 'command-r-plus'],
};

const PROVIDER_SHORT = {
  openai: 'OAI', gemini: 'GEM', claude: 'CLU', cohere: 'COH',
};

const FRAMEWORK_LANGUAGES = {
  robotframework: ['python'],
  playwright: ['javascript', 'typescript'],
  cypress: ['javascript', 'typescript'],
  pytest: ['python'],
  junit: ['java'],
};

const PIPELINE_STEPS = [
  { key: 'restructure', label: 'Estruturação', icon: '', prompt: 'restructure' },
  { key: 'extraction', label: 'Extração', icon: '', prompt: 'extraction' },
  { key: 'refinement', label: 'Refinamento', icon: '', prompt: 'refinement' },
  { key: 'generation', label: 'Geração', icon: '', prompt: 'generation' },
  // { key: 'validation', label: 'Validação', icon: '⚙️', prompt: 'processing' },
  // { key: 'confirmation', label: 'Confirmação', icon: '✅', prompt: null },
  // { key: 'execution', label: 'Execução', icon: '▶️', prompt: null },
  // { key: 'homologation', label: 'Homologação', icon: '🧪', prompt: null },
  // { key: 'finalization', label: 'Finalização', icon: '🏁', prompt: null },
  // { key: 'refactoring', label: 'Refatoração', icon: '🔄', prompt: null },
];

let currentGenerationSession = null;
let appInitialized = false;

window.addEventListener('error', (event) => {
  console.error('[GenIA Frontend] window error', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[GenIA Frontend] unhandled rejection', event.reason);
});

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  if (authManager.isAuthenticated()) {
    initializeApp();
  }
});

function initializeApp() {
  if (appInitialized) return;
  appInitialized = true;

  console.info('[GenIA Frontend] initializeApp');

  setupNavigation();
  setupSidebarSubnav();
  setupLLMConfigPage();
  setupTestGeneratorPage();
  setupProjectManagement();
  setupDashboardFilters();
  setupToggleApiKey();
  updateDashboard();
  updateHistory();
}

// ============================================================================
// NAVIGATION
// ============================================================================

function setupNavigation() {
  document.querySelectorAll('.nav-item[data-screen]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const screen = btn.dataset.screen;
      navigateTo(screen);
    });
  });

  document.querySelectorAll('.nav-sub-item[data-screen]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const screen = btn.dataset.screen;
      const section = btn.dataset.section;
      const step = btn.dataset.step;
      navigateTo(screen);
      if (section) {
        setTimeout(() => {
          const el = document.getElementById(section);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          if (step) highlightPipelineStep(parseInt(step));
        }, 80);
      }
    });
  });
}

function navigateTo(screen) {
  document.querySelectorAll('.nav-item').forEach((i) => i.classList.remove('active'));
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));

  const targetNav = document.querySelector(`.nav-item[data-screen="${screen}"]`);
  targetNav?.classList.add('active');
  document.getElementById(screen)?.classList.add('active');

  if (screen === 'llm-config') refreshLLMConfigList();
  if (screen === 'test-generator') refreshLLMSelectorInGenerator();
  if (screen === 'dashboard') updateDashboard();
  if (screen === 'history') updateHistory();
}

function setupSidebarSubnav() {
  const genBtn = document.getElementById('genTestNavBtn');
  const sub = document.getElementById('genTestSub');

  if (!genBtn || !sub) return;

  genBtn.addEventListener('click', () => {
    const isExpanded = genBtn.classList.contains('expanded');
    if (isExpanded) {
      genBtn.classList.remove('expanded');
      sub.classList.remove('open');
    } else {
      genBtn.classList.add('expanded');
      sub.classList.add('open');
      navigateTo('test-generator');
    }
  });
}

// ============================================================================
// LLM CONFIGURATION
// ============================================================================

function setupLLMConfigPage() {
  const saveBtn = document.getElementById('saveLLMConfigBtn');
  const cancelBtn = document.getElementById('cancelLLMConfigBtn');
  const newBtn = document.getElementById('newLLMConfigBtn');

  setupProviderModelSync();

  const tempInput = document.getElementById('llmTemperature');
  const tempVal = document.getElementById('temperatureValue');
  if (tempInput && tempVal) {
    tempInput.addEventListener('input', () => {
      tempVal.textContent = tempInput.value;
    });
  }

  newBtn?.addEventListener('click', () => {
    clearLLMForm();
    document.getElementById('llmFormTitle').textContent = 'Nova Configuração';
    document.getElementById('llmFormCard').style.display = 'block';
  });

  saveBtn?.addEventListener('click', saveLLMConfig);
  cancelBtn?.addEventListener('click', () => {
    document.getElementById('llmFormCard').style.display = 'none';
    clearLLMForm();
  });

  const configs = authManager.getLLMConfigs?.() || [];
  document.getElementById('llmFormCard').style.display = configs.length ? 'none' : 'block';

  refreshLLMConfigList();
}

function clearLLMForm() {
  document.getElementById('editingConfigId').value = '';
  document.getElementById('llmConfigName').value = '';
  document.getElementById('llmProvider').value = '';
  document.getElementById('llmModel').innerHTML = '<option value="">Selecione um provedor</option>';
  document.getElementById('llmModel').disabled = true;
  document.getElementById('llmApiKey').value = '';
  document.getElementById('llmTemperature').value = '0';
  document.getElementById('temperatureValue').textContent = '0';
}

function saveLLMConfig() {
  const editId = document.getElementById('editingConfigId').value;
  const name = document.getElementById('llmConfigName').value.trim();
  const provider = document.getElementById('llmProvider').value;
  const model = document.getElementById('llmModel').value;
  const apiKey = document.getElementById('llmApiKey').value.trim();
  const temperature = parseFloat(document.getElementById('llmTemperature').value || 0);

  if (!name || !provider || !model || !apiKey) {
    showToast('Preencha todos os campos obrigatórios', 'error');
    return;
  }

  const config = {
    id: editId || String(Date.now()),
    name,
    provider,
    model,
    apiKey: btoa(apiKey),
    temperature,
    createdAt: new Date().toISOString(),
  };

  authManager.saveLLMConfig(config);
  showToast(editId ? 'Configuração atualizada' : 'Configuração salva', 'success');
  clearLLMForm();
  document.getElementById('llmFormCard').style.display = 'none';
  document.getElementById('llmFormTitle').textContent = 'Nova Configuração';
  refreshLLMConfigList();
  refreshLLMSelectorInGenerator();
}

function refreshLLMConfigList() {
  const list = document.getElementById('llmConfigsList');
  const noMsg = document.getElementById('noConfigsMsg');
  const configs = authManager.getLLMConfigs?.() || [];

  if (!list) return;

  list.querySelectorAll('.llm-config-card').forEach((c) => c.remove());

  if (configs.length === 0) {
    if (noMsg) noMsg.style.display = 'block';
    return;
  }
  if (noMsg) noMsg.style.display = 'none';

  configs.forEach((cfg) => {
    const card = document.createElement('div');
    card.className = 'llm-config-card';
    card.dataset.id = cfg.id;
    card.innerHTML = `
      <div class="provider-badge">${PROVIDER_SHORT[cfg.provider] || cfg.provider.slice(0, 3).toUpperCase()}</div>
      <div style="flex:1;min-width:0;">
        <div class="config-name">${escapeHtml(cfg.name)}</div>
        <div class="config-meta">${cfg.provider} · ${cfg.model}</div>
      </div>
      <div class="config-actions">
        <button class="btn-icon" title="Editar" data-action="edit" data-id="${cfg.id}">✏️</button>
        <button class="btn-icon danger" title="Remover" data-action="delete" data-id="${cfg.id}">🗑</button>
      </div>`;

    card.querySelector('[data-action="edit"]').addEventListener('click', (e) => {
      e.stopPropagation();
      editLLMConfig(cfg.id);
    });
    card.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteLLMConfig(cfg.id);
    });

    list.appendChild(card);
  });
}

function editLLMConfig(id) {
  const cfg = (authManager.getLLMConfigs?.() || []).find((c) => c.id === id);
  if (!cfg) return;

  document.getElementById('editingConfigId').value = cfg.id;
  document.getElementById('llmConfigName').value = cfg.name;
  document.getElementById('llmProvider').value = cfg.provider;
  document.getElementById('llmProvider').dispatchEvent(new Event('change'));

  setTimeout(() => {
    document.getElementById('llmModel').value = cfg.model;
    document.getElementById('llmApiKey').value = cfg.apiKey ? atob(cfg.apiKey) : '';
    document.getElementById('llmTemperature').value = String(cfg.temperature ?? 0);
    document.getElementById('temperatureValue').textContent = String(cfg.temperature ?? 0);
  }, 50);

  document.getElementById('llmFormTitle').textContent = 'Editar Configuração';
  document.getElementById('llmFormCard').style.display = 'block';
  document.getElementById('llmFormCard').scrollIntoView({ behavior: 'smooth' });
}

function deleteLLMConfig(id) {
  authManager.deleteLLMConfig?.(id);
  refreshLLMConfigList();
  refreshLLMSelectorInGenerator();
  showToast('Configuração removida', 'info');
}

function refreshLLMSelectorInGenerator() {
  const list = document.getElementById('llmSelectorList');
  if (!list) return;

  const configs = authManager.getLLMConfigs?.() || [];
  list.innerHTML = '';

  if (configs.length === 0) {
    list.innerHTML = '<p class="empty-state">Nenhuma configuração de LLM salva. Configure em <strong>Config. LLM</strong>.</p>';
    return;
  }

  configs.forEach((cfg) => {
    const item = document.createElement('label');
    item.className = 'llm-selector-item';
    item.innerHTML = `
      <input type="radio" name="selectedLLM" value="${cfg.id}" />
      <div class="provider-badge" style="width:24px;height:24px;font-size:9px;">${PROVIDER_SHORT[cfg.provider] || '?'}</div>
      <div>
        <div style="font-size:13px;font-weight:500;">${escapeHtml(cfg.name)}</div>
        <div style="font-size:11px;color:var(--text-muted);">${cfg.provider} · ${cfg.model} · temp ${cfg.temperature}</div>
      </div>`;

    item.querySelector('input').addEventListener('change', () => {
      list.querySelectorAll('.llm-selector-item').forEach((i) => i.classList.remove('selected'));
      item.classList.add('selected');
    });

    list.appendChild(item);
  });

  // Auto-select first if none selected
  if (configs.length > 0) {
    list.querySelector('.llm-selector-item')?.classList.add('selected');
    const radio = list.querySelector('input[type=radio]');
    if (radio) radio.checked = true;
  }
}

// ============================================================================
// TEST GENERATOR
// ============================================================================

function setupTestGeneratorPage() {
  buildPipelineGrid();
  buildPromptsAccordion();
  ensureStructuredModuleCard();
  setupInputModeToggles();
  setupFrameworkLanguageSync();

  document.getElementById('generateTestBtn')?.addEventListener('click', validateAndGenerateTest);
  document.getElementById('addModuleBtn')?.addEventListener('click', addStructuredModuleCard);
}

function buildPipelineGrid() {
  const grid = document.getElementById('pipelineGrid');
  if (!grid) return;
  grid.innerHTML = '';

  PIPELINE_STEPS.forEach((step, i) => {
    const div = document.createElement('div');
    div.className = 'pipeline-step';
    div.id = `pipeline-step-${i + 1}`;
    div.innerHTML = `
      <div class="step-header">
        <span class="step-num">${i + 1}</span>
        <span class="step-name">${step.icon} ${step.label}</span>
        <span class="step-status-icon" id="pstep${i + 1}-status">⏳</span>
      </div>`;
    grid.appendChild(div);
  });
}

function highlightPipelineStep(stepNum) {
  document.querySelectorAll('.pipeline-step').forEach((el, i) => {
    el.style.borderColor = i + 1 === stepNum ? 'var(--accent)' : 'var(--border)';
  });
}

function buildPromptsAccordion() {
  const accordion = document.getElementById('promptsAccordion');
  if (!accordion) return;
  accordion.innerHTML = '';

  const promptSteps = PIPELINE_STEPS.filter((s) => s.prompt);

  promptSteps.forEach((step) => {
    const key = step.prompt;
    const div = document.createElement('div');
    div.className = 'pipeline-step';
    div.style.cssText = 'display:flex;flex-direction:column;';
    div.innerHTML = `
      <div class="step-header" style="cursor:pointer;">
        <span class="step-name" style="font-size:13px;">${step.icon} ${step.label}</span>
        <span class="step-badge" id="${key}Badge">Padrão</span>
      </div>
      <div id="${key}PromptWrap" style="display:none;margin-top:8px;">
        <textarea id="${key}Prompt" class="prompt-textarea" rows="5" style="width:100%;"></textarea>
        <div class="step-actions">
          <button type="button" class="btn-secondary" style="font-size:11px;padding:5px 10px;" data-restore="${key}">Restaurar padrão</button>
        </div>
      </div>`;

    div.querySelector('.step-header').addEventListener('click', () => {
      const wrap = div.querySelector(`#${key}PromptWrap`);
      wrap.style.display = wrap.style.display === 'none' ? 'block' : 'none';
    });

    div.querySelector(`[data-restore="${key}"]`).addEventListener('click', () => {
      markPromptDefault(key);
    });

    div.querySelector(`#${key}Prompt`).addEventListener('input', () => markPromptCustom(key));

    accordion.appendChild(div);
  });
}

function markPromptDefault(key) {
  const badge = document.getElementById(`${key}Badge`);
  if (badge) {
    badge.textContent = 'Padrão';
    badge.classList.remove('custom');
  }
}

function markPromptCustom(key) {
  const badge = document.getElementById(`${key}Badge`);
  if (badge) {
    badge.textContent = 'Personalizado';
    badge.classList.add('custom');
  }
}

// ============================================================================
// TEST GENERATION & VALIDATION
// ============================================================================

async function validateAndGenerateTest() {
  try {
    console.info('[GenIA Frontend] validateAndGenerateTest start');
    const configs = authManager.getLLMConfigs?.() || [];
    const selectedRadio = document.querySelector('input[name="selectedLLM"]:checked');
    const selectedId = selectedRadio ? selectedRadio.value : null;

    if (!selectedId || !configs.find((c) => c.id === selectedId)) {
      console.warn('[GenIA Frontend] blocked: no LLM selected', { selectedId, configsCount: configs.length });
      addLog('Fluxo bloqueado: nenhuma configuração de LLM selecionada.', 'error');
      showToast('Selecione uma configuração de LLM', 'error');
      return;
    }

    const llmConfig = configs.find((c) => c.id === selectedId);
    const testName = document.getElementById('testCaseName')?.value?.trim();
    const framework = document.getElementById('testFramework')?.value;
    const language = document.getElementById('testLanguage')?.value;
    const inputMode = document.querySelector('input[name="inputMode"]:checked')?.value || INPUT_MODES.FREE;
    const project = document.getElementById('projectSelect')?.value || 'default';

    if (!testName || !framework || !language) {
      console.warn('[GenIA Frontend] blocked: missing basic fields', { testName, framework, language });
      addLog('Fluxo bloqueado: nome, framework ou linguagem não informados.', 'error');
      showToast('Preencha nome, framework e linguagem', 'error');
      return;
    }

    let testDescription = '';
    let urls = [];

    if (inputMode === INPUT_MODES.FREE) {
      const inputType = document.querySelector('input[name="inputType"]:checked')?.value || 'testcase';
      testDescription =
        inputType === 'gherkin'
          ? document.getElementById('gherkinInput')?.value?.trim()
          : document.getElementById('freeTextInput')?.value?.trim();

      if (!testDescription) {
        console.warn('[GenIA Frontend] blocked: free text empty');
        addLog('Fluxo bloqueado: caso de teste vazio.', 'error');
        showToast('Informe o caso de teste', 'error');
        return;
      }
      urls = extractUrlsFromText(testDescription);
    } else {
      const payload = buildStructuredPayload();
      testDescription = payload.testCase;
      urls = payload.modules.map((m) => m.url).filter(Boolean);
      if (!testDescription) {
        console.warn('[GenIA Frontend] blocked: structured title empty');
        addLog('Fluxo bloqueado: título estruturado vazio.', 'error');
        showToast('Informe o título estruturado', 'error');
        return;
      }
    }

    if (urls.length === 0) {
      console.warn('[GenIA Frontend] blocked: no URLs detected', { testDescription });
      addLog('Fluxo bloqueado: nenhuma URL detectada no caso de teste.', 'error');
      showToast('Nenhuma URL detectada no texto', 'error');
      return;
    }

    currentGenerationSession = {
      id: Date.now(),
      testName,
      framework,
      language,
      inputMode,
      project,
      testDescription,
      urls,
      llmConfig,
      startTime: Date.now(),
      pipelineId: null,
    };

    const resultsEl = document.getElementById('generationResults');
    resultsEl.style.display = 'block';
    buildResultTabs();
    resultsEl.scrollIntoView({ behavior: 'smooth' });

    console.info('[GenIA Frontend] session created', currentGenerationSession);
    await runGenerationPipeline();
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Erro inesperado', 'error');
  }
}

async function runGenerationPipeline() {
  if (!currentGenerationSession) return;

  const { llmConfig, testDescription, testName, framework, language, urls, project } = currentGenerationSession;

  try {
    console.info('[GenIA Frontend] runGenerationPipeline start', {
      testName,
      framework,
      language,
      project,
      urlCount: urls?.length || 0,
    });
    // Initialize API with current LLM config
    const initResult = await geniaAPI.initializePipeline(
      llmConfig.provider,
      llmConfig.model,
      atob(llmConfig.apiKey)
    );

    if (!initResult.success) {
      console.error('[GenIA Frontend] initializePipeline failed', initResult);
      throw new Error('Failed to initialize pipeline');
    }

    setStep(1, 'running');
    addLog('Estruturando caso de teste...', 'info');

    // Run only phase 1 via API; validation pauses the flow for user input
    const pipelineResult = await geniaAPI.runFullPipeline1(
      testDescription,
      framework,
      language,
      llmConfig.provider,
      llmConfig.model,
      atob(llmConfig.apiKey),
      testName,
      true,
      1
    );

    if (!pipelineResult.success) {
      console.error('[GenIA Frontend] runFullPipeline1 failed', pipelineResult);
      throw new Error(pipelineResult.error || 'Pipeline failed');
    }

    const results = pipelineResult.data;
    console.info('[GenIA Frontend] runFullPipeline1 response', results);

    if (results.status === 'error') {
      if (results.traceback) {
        console.error('[GenIA Frontend] pipeline traceback', results.traceback);
      }
      throw new Error(results.error || 'Pipeline failed');
    }
    
    // Store pipeline_id for continuing after validation
    if (results.pipeline_id) {
      currentGenerationSession.pipelineId = results.pipeline_id;
      // startLogPolling(results.pipeline_id); comentada por enquanto
      addLog(`Pipeline ID armazenado: ${results.pipeline_id}`, 'info');
    }

    if (results.status === 'waiting_confirmation' || results.status === 'waiting_validation') {
      currentGenerationSession.awaitingUserResponse = true;
      addLog('Pipeline pausado na validação. Aguardando resposta do usuário.', 'info');
    }

    // Update results display
    setStep(1, 'ok');
    if (results.structured) {
      updateCode('structuredJsonContent', JSON.stringify(results.structured, null, 2));
      addLog('✓ Estruturação concluída', 'success', 'Estruturação');
    }

    setStep(2, 'ok');
    if (results.extracted) {
      updateCode('extractedJsonContent', JSON.stringify(results.extracted, null, 2));
      addLog('✓ Extração concluída', 'success', 'Extração');
    }

    setStep(3, 'ok');
    if (results.refined) {
      updateCode('refinedJsonContent', JSON.stringify(results.refined, null, 2));
      addLog('✓ Refinamento concluído', 'success', 'Refinamento');
    }

    setStep(4, 'ok');
    if (results.script) {
      updateCode('scriptContent', results.script);
      addLog('✓ Geração concluída', 'success', 'Geração');
    }

    setStep(5, 'ok');
    const variables = results.variables || [];
    updateCode('validationJsonContent', JSON.stringify(variables, null, 2));
    renderVariables(variables);
    addLog('✓ Validação concluída', 'success', 'Validação');

    currentGenerationSession.results = results;

    activateResultTab('validation');

    console.info('[GenIA Frontend] validation stage rendered');
    showToast('Validação pronta. Revise os dados e envie sua resposta para continuar.', 'success');
  } catch (err) {
    console.error(err);
    addLog(`Erro: ${err.message}`, 'error');
    showToast(err.message, 'error');
  }
}

async function continueGenerationPipeline(manualChanges = null) {
  if (!currentGenerationSession?.pipelineId) {
    console.warn('[GenIA Frontend] continue blocked: missing pipelineId');
    showToast('Pipeline ID não encontrado', 'error');
    return;
  }

  try {
    console.info('[GenIA Frontend] continueGenerationPipeline start', {
      pipelineId: currentGenerationSession.pipelineId,
      manualChangesProvided: manualChanges !== null,
    });
    addLog('Continuando pipeline após validação...', 'info');
    const collectedChanges = manualChanges ?? collectValidationChanges();
    const hasChanges = collectedChanges && Object.keys(collectedChanges).length > 0;
    console.info('[GenIA Frontend] collected validation changes', collectedChanges);

    setStep(5, 'running');

    const continueResult = await geniaAPI.runFullPipeline2(
      currentGenerationSession.pipelineId,
      hasChanges ? collectedChanges : null,
      !hasChanges
    );

    if (!continueResult.success) {
      console.error('[GenIA Frontend] runFullPipeline2 failed', continueResult);
      throw new Error(continueResult.error || 'Falha ao continuar pipeline');
    }

    const results = continueResult.data;
    console.info('[GenIA Frontend] runFullPipeline2 response', results);
    currentGenerationSession.awaitingUserResponse = false;

    if (results.status === 'error') {
      throw new Error(results.error || 'Falha ao continuar pipeline');
    }

    // Update results display with remaining stages
    setStep(5, 'ok');
    addLog('✓ Confirmação concluída', 'success');

    setStep(6, 'ok');
    if (results.execution || results.execution_result) {
      const executionResult = results.execution || results.execution_result;
      updateCode('executionContent', JSON.stringify(executionResult, null, 2));
      addLog('✓ Execução concluída', 'success');
    }

    setStep(7, 'ok');
    if (results.homologation) {
      updateCode('homologationContent', JSON.stringify(results.homologation, null, 2));
      addLog('✓ Homologação concluída', 'success');
    }

    setStep(8, 'ok');
    addLog('✓ Finalização concluída', 'success');

    setStep(9, 'ok');
    if (results.refactored_script) {
      updateCode('refactoringContent', results.refactored_script);
      addLog('✓ Refatoração concluída', 'success');
    }

    const endTime = Date.now();
    const duration = (endTime - currentGenerationSession.startTime) / 1000;

    if (results.final_report) {
      updateCode('finalizationContent', JSON.stringify(results.final_report, null, 2));
    }

    authManager.addTest({
      name: currentGenerationSession.testName,
      framework: currentGenerationSession.framework,
      language: currentGenerationSession.language,
      project: currentGenerationSession.project,
      provider: currentGenerationSession.llmConfig.provider,
      model: currentGenerationSession.llmConfig.model,
      inputMode: currentGenerationSession.inputMode,
      prompt: '',
      urls: currentGenerationSession.urls,
      results: {
        ...(currentGenerationSession.results || {}),
        ...results,
      },
      duration: Math.round(duration),
      createdAt: new Date().toISOString(),
      status: 'success',
    });

    updateDashboard();
    updateHistory();
    addLog(`Pipeline completa finalizada em ${duration.toFixed(2)}s ✓`, 'success');
    showToast('Pipeline completada com sucesso', 'success');
  } catch (err) {
    console.error(err);
    setStep(5, 'error');
    addLog(`Erro ao continuar: ${err.message}`, 'error');
    showToast(err.message, 'error');
  }
  stopLogPolling();
}

function collectValidationChanges() {
  const notes = document.getElementById('validationUserResponse')?.value?.trim() || '';
  const variableChanges = Array.from(document.querySelectorAll('#variableList .variable-card'))
    .map((card) => {
      const name = card.dataset.name || '';
      const input = card.querySelector('.variable-value');
      const suggestedInput = card.querySelector('.variable-suggested');
      const value = input?.value?.trim() || '';
      const suggested = suggestedInput?.value?.trim() || card.dataset.suggested || '';
      
      return { 
        name, 
        value, 
        suggested,
        changed: value !== suggested
      };
    })
    .filter((item) => item.name);

  const payload = {};

  if (notes) {
    payload.user_response = notes;
  }

  const changedVariables = variableChanges.filter((item) => item.changed);
  if (changedVariables.length > 0) {
    payload.manual_inputs = changedVariables.map(({ name, value }) => ({ name, value }));
  }

  console.info('[GenIA Frontend] collectValidationChanges payload', payload);
  return payload;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function setStep(step, status) {
  const el = document.getElementById(`step${step}-status`);
  if (!el) return;
  el.textContent = status === 'running' ? '⏳' : status === 'ok' ? '✓' : status === 'error' ? '✗' : '⏳';

  const gridEl = document.getElementById(`pstep${step}-status`);
  if (gridEl) gridEl.textContent = el.textContent;
}

function updateCode(id, content) {
  const pre = document.getElementById(id);
  if (!pre) return;
  const code = pre.querySelector('code') || pre;
  code.textContent = content;
}

// function addLog(message, level = 'info') {
//   const container = document.getElementById('executionLogs');
//   if (!container) return;

//   const entry = document.createElement('div');
//   entry.className = `log-entry log-${level}`;

//   entry.textContent =
//     `[${new Date().toLocaleTimeString()}] ` +
//     `${stage ? `[${stage}] ` : ''}` +
//     `${message}`;

//   container.appendChild(entry);
//   container.scrollTop = container.scrollHeight;
// }

async function copyCode(id) {
  const el = document.getElementById(id);
  const text = el?.querySelector('code')?.textContent || el?.textContent || '';
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copiado', 'success');
  } catch {
    showToast('Não foi possível copiar', 'error');
  }
}

function downloadScript() {
  const script = document.getElementById('scriptContent')?.querySelector('code')?.textContent || '';
  const blob = new Blob([script], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${currentGenerationSession?.testName || 'script'}.txt`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function renderVariables(variables = []) {
  const container = document.getElementById('variableList');
  if (!container) return;
  container.innerHTML = '';

  // Normalizar entrada
  let varArray = Array.isArray(variables) ? variables : (variables?.detected_inputs || []);
  
  if (!varArray.length) {
    container.innerHTML = '<p class="empty-state">Nenhuma variável detectada</p>';
    return;
  }

  varArray.forEach((v, i) => {
    // Garantir estrutura correta
    const varItem = typeof v === 'object' ? v : { name: `Var_${i}`, value: v };
    const varName = varItem.name || varItem.variable_name || `Variável ${i + 1}`;
    const varDesc = varItem.description || varItem.placeholder || 'Variável para parametrização';
    const suggestedValue = varItem.suggestedValue || varItem.suggested_value || varItem.value || '';
    
    const card = document.createElement('div');
    card.className = 'variable-card';
    card.dataset.name = varName;
    card.dataset.suggested = suggestedValue;
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <label style="font-size:12px;font-weight:600;flex:1;">${escapeHtml(varName)}</label>
        <span style="font-size:10px;color:var(--text-muted);background:var(--accent-soft);padding:2px 6px;border-radius:4px;">Sugerido</span>
      </div>
      <p class="variable-help" style="margin:0 0 8px 0;">${escapeHtml(varDesc)}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
        <div>
          <label style="font-size:11px;color:var(--text-secondary);">Valor sugerido</label>
          <input class="variable-suggested" type="text" value="${escapeHtml(suggestedValue)}" readonly style="width:100%;background:var(--bg);border:1px solid var(--border);padding:6px;border-radius:4px;font-size:11px;color:var(--text-muted);" />
        </div>
        <div>
          <label style="font-size:11px;color:var(--text-secondary);">Seu valor</label>
          <input class="variable-value" type="text" value="${escapeHtml(suggestedValue)}" placeholder="Digite um valor..." style="width:100%;padding:6px;border-radius:4px;font-size:11px;" />
        </div>
      </div>`;
    
    container.appendChild(card);
  });
}

function ensureValidationResponseArea() {
  const tab = document.getElementById('tab-validation');
  if (!tab || document.getElementById('validationUserResponse')) return;

  const variableSection = tab.querySelector('#variableList')?.parentElement;
  if (!variableSection) return;

  const responseCard = document.createElement('div');
  responseCard.style.padding = '16px';
  responseCard.style.background = 'var(--bg)';
  responseCard.style.borderRadius = 'var(--radius-sm)';
  responseCard.style.marginBottom = '16px';
  responseCard.innerHTML = `
    <div style="font-size:13px;font-weight:600;margin-bottom:8px;">Resposta do Usuário</div>
    <textarea id="validationUserResponse" rows="5" placeholder="Explique aqui a validação, ajuste os valores detectados ou descreva qualquer mudança necessária..." style="width:100%;resize:vertical;"></textarea>
  `;

  variableSection.insertAdjacentElement('afterend', responseCard);
}

// ============================================================================
// RESULT TABS & UI
// ============================================================================

function buildResultTabs() {
  const container = document.getElementById('generationResults');
  if (!container) return;

  container.innerHTML = `
    <div class="results-tabs">
      ${PIPELINE_STEPS.map((s, i) => `
        <button class="result-tab-btn${i === 0 ? ' active' : ''}" data-result-tab="${s.key}">
          ${s.icon} ${s.label}
        </button>`).join('')}
      <button class="result-tab-btn" style="display:none;" data-result-tab="logs">📋 Logs</button>
    </div>
    <div class="result-content">
      ${buildTabContent()}
    </div>`;

  container.querySelectorAll('.result-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.result-tab-btn').forEach((b) => b.classList.remove('active'));
      container.querySelectorAll('.result-tab').forEach((t) => t.classList.remove('active'));
      btn.classList.add('active');
      const panel = container.querySelector(`#tab-${btn.dataset.resultTab}`);
      panel?.classList.add('active');
    });
  });

  ensureValidationResponseArea();
}

function buildTabContent() {
  return `
    <div id="tab-restructure" class="result-tab active">
      <div class="code-actions"><button class="btn-secondary" onclick="copyCode('structuredJsonContent')">📋 Copiar</button></div>
      <div class="code-container"><pre id="structuredJsonContent"><code></code></pre></div>
    </div>
    <div id="tab-extraction" class="result-tab">
      <div class="code-actions"><button class="btn-secondary" onclick="copyCode('extractedJsonContent')">📋 Copiar</button></div>
      <div class="code-container"><pre id="extractedJsonContent"><code></code></pre></div>
    </div>
    <div id="tab-refinement" class="result-tab">
      <div class="code-actions"><button class="btn-secondary" onclick="copyCode('refinedJsonContent')">📋 Copiar</button></div>
      <div class="code-container"><pre id="refinedJsonContent"><code></code></pre></div>
    </div>
    <div id="tab-generation" class="result-tab">
      <div class="code-actions">
        <button class="btn-secondary" onclick="copyCode('scriptContent')">📋 Copiar</button>
        <button class="btn-secondary" onclick="downloadScript()">⬇️ Download</button>
      </div>
      <div class="code-container"><pre id="scriptContent"><code></code></pre></div>
    </div>
  `;
}

function activateResultTab(key) {
  const container = document.getElementById('generationResults');
  if (!container) return;
  container.querySelectorAll('.result-tab-btn').forEach((b) => b.classList.remove('active'));
  container.querySelectorAll('.result-tab').forEach((t) => t.classList.remove('active'));
  const btn = container.querySelector(`[data-result-tab="${key}"]`);
  const panel = container.querySelector(`#tab-${key}`);
  btn?.classList.add('active');
  panel?.classList.add('active');
}

// ============================================================================
// PROJECT MANAGEMENT
// ============================================================================

function setupProjectManagement() {
  const createBtn = document.getElementById('createProjectBtn');
  const newInput = document.getElementById('newProjectName');
  const projectSelect = document.getElementById('projectSelect');

  const refresh = () => {
    if (!projectSelect) return;
    const saved = projectSelect.value;
    const projects = Array.from(
      new Set([
        ...(authManager.getProjects?.() || []),
        ...(authManager.getTests?.() || []).map((t) => t.project).filter(Boolean),
      ])
    );
    projectSelect.innerHTML = '<option value="">Selecionar projeto</option>';
    projects.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      projectSelect.appendChild(opt);
    });
    if (saved) projectSelect.value = saved;
  };

  createBtn?.addEventListener('click', () => {
    const name = newInput?.value?.trim();
    if (!name) {
      showToast('Informe o nome do projeto', 'error');
      return;
    }
    authManager.addProject(name);
    if (newInput) newInput.value = '';
    refresh();
    showToast('Projeto criado', 'success');
  });

  refresh();
}

// ============================================================================
// FRAMEWORK & LANGUAGE
// ============================================================================

function setupFrameworkLanguageSync() {
  const frameworkSelect = document.getElementById('testFramework');
  const languageSelect = document.getElementById('testLanguage');
  if (!frameworkSelect || !languageSelect) return;

  const sync = () => {
    const langs = FRAMEWORK_LANGUAGES[frameworkSelect.value] || [];
    languageSelect.innerHTML = '';
    const ph = document.createElement('option');
    ph.value = '';
    ph.textContent = langs.length ? 'Selecione linguagem' : 'Selecione framework';
    languageSelect.appendChild(ph);
    langs.forEach((l) => {
      const opt = document.createElement('option');
      opt.value = l;
      opt.textContent = l.charAt(0).toUpperCase() + l.slice(1);
      languageSelect.appendChild(opt);
    });
    languageSelect.disabled = !langs.length;
  };

  frameworkSelect.addEventListener('change', sync);
  sync();
}

function setupProviderModelSync() {
  const providerSelect = document.getElementById('llmProvider');
  const modelSelect = document.getElementById('llmModel');
  if (!providerSelect || !modelSelect) return;

  const sync = () => {
    const models = PROVIDER_MODELS[providerSelect.value] || [];
    modelSelect.innerHTML = '';
    const ph = document.createElement('option');
    ph.value = '';
    ph.textContent = models.length ? 'Selecione um modelo' : 'Selecione um provedor';
    modelSelect.appendChild(ph);
    models.forEach((m) => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      modelSelect.appendChild(opt);
    });
    modelSelect.disabled = !models.length;
  };

  providerSelect.addEventListener('change', sync);
  sync();
}

// ============================================================================
// INPUT MODES
// ============================================================================

function setupInputModeToggles() {
  document.querySelectorAll('input[name="inputMode"]').forEach((r) => r.addEventListener('change', syncEntryModeUI));
  document.querySelectorAll('input[name="inputType"]').forEach((r) => r.addEventListener('change', syncInputTypeUI));
  syncEntryModeUI();
  syncInputTypeUI();
}

function syncEntryModeUI() {
  const mode = document.querySelector('input[name="inputMode"]:checked')?.value || INPUT_MODES.FREE;
  document.getElementById('freeTextSection')?.classList.toggle('hidden', mode !== INPUT_MODES.FREE);
  document.getElementById('structuredSection')?.classList.toggle('hidden', mode !== INPUT_MODES.STRUCTURED);
}

function syncInputTypeUI() {
  const type = document.querySelector('input[name="inputType"]:checked')?.value || 'testcase';
  document.getElementById('testCaseGroup')?.classList.toggle('hidden', type === 'gherkin');
  document.getElementById('gherkinGroup')?.classList.toggle('hidden', type !== 'gherkin');
}

// ============================================================================
// STRUCTURED MODULES
// ============================================================================

function ensureStructuredModuleCard() {
  const container = document.getElementById('structuredModules');
  if (container && !container.querySelector('.module-card')) addStructuredModuleCard();
}

function addStructuredModuleCard() {
  const container = document.getElementById('structuredModules');
  if (!container) return;

  const card = document.createElement('div');
  card.className = 'module-card';

  const num = container.querySelectorAll('.module-card').length + 1;
  const urlInput = Object.assign(document.createElement('input'), {
    className: 'module-url',
    type: 'url',
    placeholder: 'https://exemplo.com/pagina',
    style: 'width:100%;',
  });
  const purposeInput = Object.assign(document.createElement('input'), {
    className: 'module-purpose',
    type: 'text',
    placeholder: 'Finalidade do módulo',
    style: 'width:100%;',
  });
  const stepsWrapper = document.createElement('div');
  stepsWrapper.className = 'module-steps';

  const addStep = () => {
    const row = document.createElement('div');
    row.className = 'step-row';
    const input = Object.assign(document.createElement('input'), {
      className: 'step-input',
      type: 'text',
      placeholder: 'Descrição do passo',
    });
    row.appendChild(input);
    stepsWrapper.appendChild(row);
  };

  const addStepBtn = document.createElement('button');
  addStepBtn.type = 'button';
  addStepBtn.className = 'btn-secondary';
  addStepBtn.textContent = '+ Passo';
  addStepBtn.style.cssText = 'font-size:11px;padding:5px 10px;margin-right:6px;';
  addStepBtn.addEventListener('click', addStep);

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn-secondary';
  removeBtn.textContent = 'Remover';
  removeBtn.style.cssText = 'font-size:11px;padding:5px 10px;';
  removeBtn.addEventListener('click', () => card.remove());

  const h4 = document.createElement('h4');
  h4.textContent = `Módulo ${num}`;

  addStep();
  card.append(h4, urlInput, purposeInput, stepsWrapper, addStepBtn, removeBtn);
  container.appendChild(card);
}

function buildStructuredPayload() {
  const title = document.getElementById('structuredTitle')?.value?.trim();
  const modules = [];
  document.querySelectorAll('.module-card').forEach((card) => {
    const url = card.querySelector('.module-url')?.value?.trim();
    const purpose = card.querySelector('.module-purpose')?.value?.trim();
    const steps = [...card.querySelectorAll('.step-input')].map((s) => s.value.trim()).filter(Boolean);
    if (url)
      modules.push({
        url,
        purpose,
        execution_steps: steps.map((s) => ({ step: s, extracted_data: [] })),
      });
  });
  return { testCase: title, modules };
}

// ============================================================================
// DASHBOARD
// ============================================================================

function setupDashboardFilters() {
  const filters = [
    'dashboardProjectFilter',
    'dashboardFrameworkFilter',
    'dashboardModelFilter',
    'dashboardStatusFilter',
    'dashboardPeriodFilter',
    'historySearch',
    'historyFilter',
  ];

  filters.forEach((id) => {
    document.getElementById(id)?.addEventListener('change', () => {
      updateDashboard();
      updateHistory();
    });
    document.getElementById(id)?.addEventListener('input', () => {
      updateDashboard();
      updateHistory();
    });
  });
}

function updateDashboard() {
  const tests = authManager.getTests?.() || [];
  const filtered = filterTestsForDashboard(tests);

  const projectFilter = document.getElementById('dashboardProjectFilter');
  if (projectFilter) {
    const cur = projectFilter.value;
    const projects = Array.from(new Set(tests.map((t) => t.project).filter(Boolean)));
    projectFilter.innerHTML = '<option value="">Todos os projetos</option>';
    projects.forEach((p) => {
      const o = document.createElement('option');
      o.value = p;
      o.textContent = p;
      projectFilter.appendChild(o);
    });
    projectFilter.value = cur;
  }

  const modelFilter = document.getElementById('dashboardModelFilter');
  if (modelFilter) {
    const cur = modelFilter.value;
    const models = Array.from(new Set(tests.map((t) => t.model).filter(Boolean)));
    modelFilter.innerHTML = '<option value="">Todos os modelos</option>';
    models.forEach((m) => {
      const o = document.createElement('option');
      o.value = m;
      o.textContent = m;
      modelFilter.appendChild(o);
    });
    modelFilter.value = cur;
  }

  const total = filtered.length;
  const failures = filtered.filter((t) => t.status === 'error').length;
  const avgDur = total ? Math.round(filtered.reduce((s, t) => s + (Number(t.duration) || 0), 0) / total) : 0;

  setText('totalTests', String(total));
  setText('failureRate', total ? `${Math.round((failures / total) * 100)}%` : '0%');
  setText('avgDuration', `${avgDur}s`);
  setText('popularFramework', getMostUsedValue(filtered, 'framework') || '—');
  setText('popularModel', getMostUsedValue(filtered, 'model') || '—');
  setText('customPromptRate', total ? `${Math.round((filtered.filter((t) => t.prompt).length / total) * 100)}%` : '0%');

  const projectMetrics = document.getElementById('projectMetrics');
  if (projectMetrics) {
    projectMetrics.innerHTML = '';
    const byProject = groupBy(filtered, (t) => t.project || 'Sem projeto');
    if (!byProject.size) {
      projectMetrics.innerHTML = '<p class="empty-state">Nenhum resultado disponível</p>';
    } else {
      byProject.forEach((items, project) => {
        const row = document.createElement('div');
        row.className = 'metric-item';
        row.textContent = `${project}: ${items.length} teste(s)`;
        projectMetrics.appendChild(row);
      });
    }
  }

  const recentList = document.getElementById('recentTestsList');
  if (recentList) {
    recentList.innerHTML = '';
    const recent = [...filtered].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);
    if (!recent.length) {
      recentList.innerHTML = '<p class="empty-state">Nenhum teste executado ainda</p>';
    } else {
      recent.forEach((t) => {
        const item = document.createElement('div');
        item.className = 'recent-test-item';
        item.textContent = `${t.name} · ${t.framework} · ${t.project || '—'} · ${t.status}`;
        recentList.appendChild(item);
      });
    }
  }
}

function filterTestsForDashboard(tests) {
  const project = document.getElementById('dashboardProjectFilter')?.value || '';
  const framework = document.getElementById('dashboardFrameworkFilter')?.value || '';
  const model = document.getElementById('dashboardModelFilter')?.value || '';
  const status = document.getElementById('dashboardStatusFilter')?.value || '';
  const period = document.getElementById('dashboardPeriodFilter')?.value || '';
  const now = Date.now();
  const periodMs = { '24h': 86400000, '7d': 604800000, '30d': 2592000000 };

  return tests.filter((t) => {
    const created = new Date(t.createdAt || 0).getTime();
    return (
      (!project || t.project === project) &&
      (!framework || t.framework === framework) &&
      (!model || t.model === model) &&
      (!status || t.status === status) &&
      (!period || (created && now - created <= periodMs[period]))
    );
  });
}

// ============================================================================
// HISTORY
// ============================================================================

function updateHistory() {
  const list = document.getElementById('historyList');
  if (!list) return;

  const search = (document.getElementById('historySearch')?.value || '').toLowerCase().trim();
  const status = document.getElementById('historyFilter')?.value || '';
  const tests = authManager.getTests?.() || [];

  const filtered = tests
    .filter((t) => {
      const matchSearch =
        !search ||
        [t.name, t.project, t.framework, t.language]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(search));
      return matchSearch && (!status || t.status === status);
    })
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  list.innerHTML = '';
  if (!filtered.length) {
    list.innerHTML = '<p class="empty-state">Nenhum teste encontrado</p>';
    return;
  }
  filtered.forEach((t) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    const statusDot = t.status === 'success' ? '🟢' : '🔴';
    item.textContent = `${statusDot} ${t.name} · ${t.framework} · ${t.language} · ${t.project || '—'} · ${t.model || '—'}`;
    list.appendChild(item);
  });
}

// ============================================================================
// UTILITIES
// ============================================================================

function setupToggleApiKey() {
  const btn = document.getElementById('toggleApiKey');
  const input = document.getElementById('llmApiKey');
  if (!btn || !input) return;
  btn.addEventListener('click', () => {
    input.type = input.type === 'password' ? 'text' : 'password';
  });
}

function extractUrlsFromText(text) {
  return [...new Set((text.match(/(https?:\/\/[^\s]+)/g) || []))];
}

function getMostUsedValue(items, key) {
  const counts = new Map();
  items.forEach((item) => {
    const v = item[key];
    if (v) counts.set(v, (counts.get(v) || 0) + 1);
  });
  let winner = '';
  let max = 0;
  counts.forEach((c, v) => {
    if (c > max) {
      max = c;
      winner = v;
    }
  });
  return winner;
}

function groupBy(items, fn) {
  const map = new Map();
  items.forEach((item) => {
    const k = fn(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(item);
  });
  return map;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function addLog(message, level = 'info', stage = '') {
  const container = document.getElementById('executionLogs');
  if (!container) return;

  // Se message for um objeto com estrutura de log, extrair campos
  if (typeof message === 'object' && message !== null) {
    level = message.level || message.type || level;
    stage = message.stage || stage;
    message = message.message || JSON.stringify(message);
  }

  const entry = document.createElement('div');
  entry.className = `log-entry log-${level}`;

  const stagePrefix = stage ? `[${stage}] ` : '';
  const cleanMessage = (message || '').toString();

  entry.textContent =
    `[${new Date().toLocaleTimeString()}] ` +
    `${stagePrefix}${cleanMessage}`;

  container.appendChild(entry);
  container.scrollTop = container.scrollHeight;
}

let logPollingInterval = null;

let lastLogIndex = 0;

function startLogPolling(pipelineId) {
  if (logPollingInterval) clearInterval(logPollingInterval);

  lastLogIndex = 0;

  logPollingInterval = setInterval(async () => {
    try {
      const res = await geniaAPI.getLogs();

      if (res && res.logs && Array.isArray(res.logs)) {
        const newLogs = res.logs.slice(lastLogIndex);
        
        newLogs.forEach((log) => {
          if (typeof log === 'object' && log.message) {
            addLog(log.message, log.level || log.type || 'info', log.stage || '');
          } else {
            addLog(log, 'info');
          }
        });
        
        lastLogIndex = res.logs.length;
      }
    } catch (e) {
      console.error("Erro ao buscar logs", e);
    }
  }, 800);
}

function stopLogPolling() {
  if (logPollingInterval) {
    clearInterval(logPollingInterval);
    logPollingInterval = null;
  }
}

function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');

  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');

  toast.textContent = message;
  toast.style.marginBottom = '10px';
  toast.style.padding = '10px 14px';
  toast.style.borderRadius = '6px';
  toast.style.color = '#fff';
  toast.style.fontSize = '13px';
  toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';

  const colors = {
    success: '#2ecc71',
    error: '#e74c3c',
    info: '#3498db',
    warning: '#f1c40f',
  };

  toast.style.background = colors[type] || colors.info;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}