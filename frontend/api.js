/**
 * GenIA E2E Test - Frontend API Service Layer
 * =============================================
 * This module handles all HTTP communication with the Python backend.
 * Provides a clean interface for frontend components.
 */

class GenIAAPI {
  constructor(baseURL = "http://localhost:5000/api") {
    this.baseURL = baseURL;
    this.currentLLMConfig = null;
  }

  log(message, details = null) {
    if (details !== null && details !== undefined) {
      console.info(`[GenIAAPI] ${message}`, details);
    } else {
      console.info(`[GenIAAPI] ${message}`);
    }
  }

  // ========================================================================
  // CORE HTTP METHODS
  // ========================================================================

  /**
   * Execute HTTP request
   */
  async request(endpoint, method = "GET", body = null) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      this.log(`request start ${method} ${url}`, body ? Object.keys(body) : []);
      const options = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (body && (method === "POST" || method === "PUT")) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const data = await response.json();
      this.log(`request end ${method} ${url} status=${response.status}`, {
        ok: response.ok,
        requestId: response.headers.get("X-Request-Id"),
        keys: data && typeof data === "object" ? Object.keys(data) : typeof data,
      });

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return {
        success: true,
        status: response.status,
        data,
      };
    } catch (error) {
      console.error(`API Error [${endpoint}]`, error);
      this.log(`request error ${method} ${endpoint}`, error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * GET request
   */
  async get(endpoint) {
    return this.request(endpoint, "GET");
  }

  /**
   * POST request
   */
  async post(endpoint, body) {
    return this.request(endpoint, "POST", body);
  }

  // ========================================================================
  // HEALTH & INFO
  // ========================================================================

  /**
   * Check backend health
   */
  async healthCheck() {
    const response = await this.get("/health");
    return response.data;
  }

  /**
   * Get platform information
   */
  async getPlatformInfo() {
    const response = await this.get("/info");
    return response.data;
  }

  /**
   * Get available frameworks and their languages
   */
  async getFrameworks() {
    const response = await this.get("/frameworks");
    return response.data;
  }

  /**
   * Get available LLM models
   */
  async getLLMModels() {
    const response = await this.get("/llm/models");
    return response.data;
  }

  // ========================================================================
  // LLM CONFIGURATION
  // ========================================================================

  /**
   * Validate LLM connection
   */
  async validateLLMConnection(provider, model, apiKey) {
    this.log("validateLLMConnection", { provider, model });
    const response = await this.post("/llm/validate", {
      provider,
      model,
      api_key: apiKey,
    });

    if (response.success) {
      this.currentLLMConfig = {
        provider,
        model,
        api_key: apiKey,
      };
    }

    return response;
  }

  /**
   * Initialize pipeline with LLM provider
   */
  async initializePipeline(provider, model, apiKey) {
    this.log("initializePipeline", { provider, model });
    const response = await this.post("/pipeline/initialize", {
      provider,
      model,
      api_key: apiKey,
    });

    if (response.success) {
      this.currentLLMConfig = {
        provider,
        model,
        api_key: apiKey,
      };
    }

    return response;
  }

  // ========================================================================
  // PIPELINE STAGES
  // ========================================================================

  /**
   * Execute Restructuring (Stage 1)
   */
  async restructure(testCase, urls, project, mode) {
    return this.post("/pipeline/restructure", {
      test_case: testCase,
      urls,
      project,
      mode,
    });
  }

  /**
   * Execute Extraction (Stage 2)
   */
  async extract(structuredJson, urls, headless = true) {
    return this.post("/pipeline/extract", {
      structured_json: structuredJson,
      urls,
      headless,
    });
  }

  /**
   * Execute Refinement (Stage 3)
   */
  async refine(extractedJson, structuredJson, urls, headless = true) {
    return this.post("/pipeline/refine", {
      extracted_json: extractedJson,
      structured_json: structuredJson,
      urls,
      headless,
    });
  }

  /**
   * Execute Script Generation (Stage 4)
   */
  async generateScript(refinedJson, framework, language, project) {
    return this.post("/pipeline/generate-script", {
      refined_json: refinedJson,
      framework,
      language,
      project,
    });
  }

  /**
   * Execute Validation (Stage 5)
   */
  async validate(script, refinedJson, framework, language) {
    return this.post("/pipeline/validate", {
      script,
      refined_json: refinedJson,
      framework,
      language,
    });
  }

  // ========================================================================
  // COMPLETE PIPELINE
  // ========================================================================

  /**
   * Execute pipeline phase 1 up to validation
   */
  async runFullPipeline1(
    testCase,
    framework,
    language,
    provider,
    model,
    apiKey,
    testName = "untitled",
    headless = true,
    attempt = 1
  ) {
    this.log("runFullPipeline1", {
      framework,
      language,
      provider,
      model,
      testName,
    });
    return this.post("/pipeline/run-until-validation", {
      test_case: testCase,
      framework,
      language,
      provider,
      model,
      api_key: apiKey,
      test_name: testName,
      headless,
      attempt,
    });
  }

  /**
   * Backward-compatible alias for phase 1 execution
   */
  async runFullPipeline(
    testCase,
    framework,
    language,
    provider,
    model,
    apiKey,
    testName = "untitled",
    headless = true,
    attempt = 1
  ) {
    return this.runFullPipeline1(
      testCase,
      framework,
      language,
      provider,
      model,
      apiKey,
      testName,
      headless,
      attempt
    );
  }

  // ========================================================================
  // LOGS
  // ========================================================================

  /**
   * Execute pipeline phase 2 after validation
   */
  async runFullPipeline2(
    pipelineId,
    manualChanges = null,
    continueWithoutChanges = true
  ) {
    this.log("runFullPipeline2", {
      pipelineId,
      continueWithoutChanges,
      hasManualChanges: !!manualChanges,
    });
    return this.post("/pipeline/continue-after-validation", {
      pipeline_id: pipelineId,
      manual_changes: manualChanges,
      continue_without_changes: continueWithoutChanges,
    });
  }

  /**
   * Backward-compatible alias for phase 2 execution
   */
  async continueAfterValidation(
    pipelineId,
    manualChanges = null,
    continueWithoutChanges = true
  ) {
    return this.runFullPipeline2(pipelineId, manualChanges, continueWithoutChanges);
  }

  /**
   * Get execution logs
   */
  async getLogs() {
    const response = await this.get("/logs");
    return response.data;
  }

  /**
   * Clear execution logs
   */
  async clearLogs() {
    return this.post("/logs/clear", {});
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  /**
   * Get current LLM configuration
   */
  getCurrentLLMConfig() {
    return this.currentLLMConfig;
  }

  /**
   * Check if LLM is configured
   */
  isLLMConfigured() {
    return this.currentLLMConfig !== null;
  }

  /**
   * Clear current configuration
   */
  clearLLMConfig() {
    this.currentLLMConfig = null;
  }

  /**
   * Get provider name from config
   */
  getProviderName() {
    return this.currentLLMConfig?.provider || null;
  }

  /**
   * Get model name from config
   */
  getModelName() {
    return this.currentLLMConfig?.model || null;
  }

  /**
   * Build language options for framework
   */
  getLanguagesForFramework(framework) {
    const langMap = {
      robotframework: ["python"],
      playwright: ["javascript", "typescript"],
      cypress: ["javascript", "typescript"],
      pytest: ["python"],
      junit: ["java"],
    };
    return langMap[framework] || [];
  }

  /**
   * Validate framework selection
   */
  isValidFramework(framework) {
    const validFrameworks = [
      "robotframework",
      "playwright",
      "cypress",
      "pytest",
      "junit",
    ];
    return validFrameworks.includes(framework);
  }

  /**
   * Validate provider selection
   */
  isValidProvider(provider) {
    const validProviders = ["openai", "anthropic", "gemini", "cohere"];
    return validProviders.includes(provider);
  }

  /**
   * Build full module with metadata
   */
  buildModulePayload(url, purpose, executionSteps) {
    return {
      url,
      purpose,
      execution_steps: executionSteps.map((step) => ({
        step,
        extracted_data: [],
      })),
    };
  }

  /**
   * Parse extracted elements from response
   */
  parseExtractedElements(response) {
    if (!response.success) {
      throw new Error(response.error);
    }

    if (Array.isArray(response.data.data)) {
      return response.data.data;
    }

    return response.data.data.extracted_data || [];
  }

  /**
   * Parse pipeline results
   */
  parsePipelineResults(response) {
    if (!response.success) {
      throw new Error(response.error);
    }

    return {
      status: response.data.status,
      structured: response.data.data?.structured,
      extracted: response.data.data?.extracted,
      refined: response.data.data?.refined,
      script: response.data.data?.script,
      variables: response.data.data?.variables,
      logs: response.data.logs,
      error: response.data.error,
    };
  }
}

// ============================================================================
// EXPORT
// ============================================================================

const geniaAPI = new GenIAAPI("http://localhost:5000/api");
