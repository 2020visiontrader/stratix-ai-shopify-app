// Source: https://github.com/growthbook/growthbook (adapted for Stratix)
// Split Testing System - GrowthBook SDK integration

const { GrowthBook } = require("@growthbook/growthbook");

function runExperiment(currentUser, aiGeneratedVersion, originalVersion) {
  // Initialize GrowthBook (assumes features/experiments are fetched from GrowthBook API)
  const gb = new GrowthBook({ user: { id: currentUser.id, attributes: {} } });

  // Example experiment: test AI-generated content ("new") vs original ("old")
  const experiment = {
    key: "ai_content_vs_original",
    variations: ["original_content", "ai_content"]
  };
  const { value: variation } = gb.run(experiment);  // GrowthBook selects a variation

  if (variation === "ai_content") {
    return aiGeneratedVersion;
  } else {
    return originalVersion;
  }
}

module.exports = { runExperiment }; 