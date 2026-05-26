(() => {
  const root = (window.GenIA = window.GenIA || {});
  const { geniaAPI } = root.api;

  const decodeApiKey = (value) => {
    try {
      return atob(value);
    } catch {
      return value;
    }
  };

  const normalizePipelineData = (raw) => {
    const payload = raw?.data && typeof raw.data === "object" ? raw.data : raw || {};
    const nested = payload.data && typeof payload.data === "object" ? payload.data : {};

    return {
      status: payload.status || nested.status || "ok",
      pipelineId: payload.pipeline_id || payload.pipelineId || nested.pipeline_id || nested.pipelineId || null,
      structured: payload.structured || nested.structured || null,
      extracted: payload.extracted || nested.extracted || null,
      refined: payload.refined || nested.refined || null,
      script: payload.script || nested.script || null,
      variables: payload.variables || nested.variables || [],
      validation: payload.validation || nested.validation || null,
      editableFields: payload.editable_fields || nested.editable_fields || [],
      execution: payload.execution || payload.execution_result || nested.execution || nested.execution_result || null,
      homologation: payload.homologation || nested.homologation || null,
      finalReport: payload.final_report || nested.final_report || null,
      exportables: payload.exportables || nested.exportables || null,
      refactoredScript: payload.refactored_script || nested.refactored_script || null,
      refactoring: payload.refactoring || nested.refactoring || null,
      error: payload.error || nested.error || null,
      traceback: payload.traceback || nested.traceback || null,
    };
  };

  const createGenerationSession = (data) => ({
    id: Date.now(),
    startTime: Date.now(),
    pipelineId: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    awaitingUserResponse: false,
    results: null,
    logStream: null,
    promptOverrides: {},
    ...data,
  });

  const startPhaseOne = async (session) => {
    const apiKey = decodeApiKey(session.llmConfig.apiKey);
    const initResult = await geniaAPI.initializePipeline(session.llmConfig.provider, session.llmConfig.model, apiKey);
    if (!initResult.success) {
      throw new Error(initResult.error || "Falha ao inicializar a pipeline");
    }

    session.logStream = geniaAPI.streamPipelineLogs(session.pipelineId, {
      onLog: (event) => {
        if (event) {
          session.onLog?.(event);
        }
      },
      onError: (error) => {
        session.onLog?.({
          level: "error",
          stage: "logs",
          message: error?.message || "Erro no stream de logs",
        });
      },
    });

    const pipelineResult = await geniaAPI.runFullPipeline(
      session.testDescription,
      session.framework,
      session.language,
      session.llmConfig.provider,
      session.llmConfig.model,
      apiKey,
      session.testName,
      true,
      1,
      session.pipelineId,
      session.promptOverrides || {},
      session.llmOverrides || {}
    );

    if (!pipelineResult.success) {
      geniaAPI.closePipelineLogStream();
      throw new Error(pipelineResult.error || "Falha ao executar a pipeline");
    }

    const normalized = normalizePipelineData(pipelineResult.data);
    if (normalized.status === "error") {
      geniaAPI.closePipelineLogStream();
      throw new Error(normalized.error || "Falha ao executar a pipeline");
    }

    return normalized;
  };

  const continueAfterValidation = async (session, manualChanges = null) => {
    if (!session?.pipelineId) {
      throw new Error("Pipeline ID não encontrado");
    }

    const hasChanges = manualChanges && Object.keys(manualChanges).length > 0;
    if (!geniaAPI.activeLogStream) {
      session.logStream = geniaAPI.streamPipelineLogs(session.pipelineId, {
        onLog: (event) => {
          if (event) {
            session.onLog?.(event);
          }
        },
        onError: (error) => {
          session.onLog?.({
            level: "error",
            stage: "logs",
            message: error?.message || "Erro no stream de logs",
          });
        },
      });
    }

    const continueResult = await geniaAPI.runFullPipeline2(
      session.pipelineId,
      hasChanges ? manualChanges : null,
      !hasChanges,
      session.resumeFromStage || "confirmation",
      session.scriptOverride || null,
      session.promptOverrides || {},
      session.llmOverrides || {}
    );

    if (!continueResult.success) {
      geniaAPI.closePipelineLogStream();
      throw new Error(continueResult.error || "Falha ao continuar a pipeline");
    }

    const normalized = normalizePipelineData(continueResult.data);
    if (normalized.status === "error") {
      geniaAPI.closePipelineLogStream();
      throw new Error(normalized.error || "Falha ao continuar a pipeline");
    }

    geniaAPI.closePipelineLogStream();
    return normalized;
  };

  root.generation = {
    createGenerationSession,
    startPhaseOne,
    continueAfterValidation,
    normalizePipelineData,
  };
})();
