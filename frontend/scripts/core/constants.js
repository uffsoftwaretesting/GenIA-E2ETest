(() => {
  const root = (window.GenIA = window.GenIA || {});

  root.constants = {
    INPUT_MODES: {
      FREE: "free",
      STRUCTURED: "structured",
    },
    PROVIDER_MODELS: {
      openai: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"],
      gemini: ["gemini-2.0-flash", "gemini-1.5-pro"],
      claude: ["claude-3-5-sonnet-latest", "claude-3-opus-latest"],
      cohere: ["command-r", "command-r-plus"],
    },
    PROVIDER_SHORT: {
      openai: "OAI",
      gemini: "GEM",
      claude: "CLU",
      cohere: "COH",
    },
    FRAMEWORK_LANGUAGES: {
      robotframework: ["python"],
      playwright: ["javascript", "typescript"],
      cypress: ["javascript", "typescript"],
      pytest: ["python"],
      junit: ["java"],
      selenium: ["python", "javascript", "typescript", "java"],
    },
    PIPELINE_STEPS: [
      { key: "structuring", label: "Estruturação", promptKey: "structuring", resultId: "structuredJsonContent" },
      { key: "extraction", label: "Extração", promptKey: "extraction", resultId: "extractedJsonContent" },
      { key: "refinement", label: "Refinamento", promptKey: "refinement", resultId: "refinedJsonContent" },
      { key: "generation", label: "Geração", promptKey: "generation", resultId: "scriptContent" },
      { key: "validation", label: "Validação", promptKey: "validation", resultId: "validationJsonContent" },
      { key: "confirmation", label: "Confirmação", promptKey: "confirmation", resultId: "confirmationContent" },
      { key: "execution", label: "Execução", resultId: "executionContent" },
      { key: "homologation", label: "Homologação", promptKey: "homologation", resultId: "homologationContent" },
      { key: "finalization", label: "Finalização", promptKey: "finalization", resultId: "finalizationContent" },
      { key: "refactoring", label: "Refatoração", promptKey: "refactoring", resultId: "refactoringContent" },
    ],
    API_BASE_URL: "https://genia-e2etest-ai-driven-platform.onrender.com/api",
    // API_BASE_URL: "http://localhost:5000/api",
  };
})();
