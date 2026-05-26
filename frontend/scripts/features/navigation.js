(() => {
  const root = (window.GenIA = window.GenIA || {});
  const { qsa, byId } = root.dom;

  const setActiveScreen = (screen) => {
    qsa(".nav-item").forEach((item) => item.classList.remove("active"));
    qsa(".screen").forEach((section) => section.classList.remove("active"));

    const nav = qsa(`.nav-item[data-screen="${screen}"]`)[0];
    const panel = byId(screen);
    if (nav) nav.classList.add("active");
    if (panel) panel.classList.add("active");
  };

  const setupNavigation = (options = {}) => {
    const onNavigate = options.onNavigate;

    qsa(".nav-item[data-screen]").forEach((button) => {
      button.addEventListener("click", () => {
        const screen = button.dataset.screen;
        setActiveScreen(screen);
        onNavigate?.(screen);
      });
    });

    qsa(".nav-sub-item[data-screen]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const screen = button.dataset.screen;
        const section = button.dataset.section;
        const step = button.dataset.step;
        setActiveScreen(screen);
        onNavigate?.(screen);

        window.setTimeout(() => {
          if (section) {
            const target = byId(section);
            target?.scrollIntoView({ behavior: "smooth", block: "start" });
          }

          if (step && root.app?.controllers?.generator?.highlightPipelineStep) {
            root.app.controllers.generator.highlightPipelineStep(Number(step));
          }
        }, 80);
      });
    });

    const genButton = byId("genTestNavBtn");
    const genSubnav = byId("genTestSub");
    if (genButton && genSubnav) {
      genButton.addEventListener("click", () => {
        const isExpanded = genButton.classList.contains("expanded");
        genButton.classList.toggle("expanded", !isExpanded);
        genSubnav.classList.toggle("open", !isExpanded);
        if (!isExpanded) {
          setActiveScreen("test-generator");
          onNavigate?.("test-generator");
        }
      });
    }

    setActiveScreen("dashboard");
  };

  root.features = root.features || {};
  root.features.navigation = {
    setupNavigation,
    setActiveScreen,
  };
})();

