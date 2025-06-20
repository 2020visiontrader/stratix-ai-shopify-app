// Source: Manual vs Autopilot Toggle (adapted for Stratix)
// Simple feature flag for autopilot mode

let autopilotEnabled = false;  // false = Manual mode, true = Autopilot mode

function enableAutopilot() {
  autopilotEnabled = true;
  console.log("Autopilot enabled – AI will act automatically.");
}

function disableAutopilot() {
  autopilotEnabled = false;
  console.log("Autopilot disabled – manual mode active.");
}

function isAutopilot() {
  return autopilotEnabled;
}

// Example usage:
// enableAutopilot();
// console.log("Current mode:", isAutopilot() ? "Autopilot" : "Manual");

module.exports = { enableAutopilot, disableAutopilot, isAutopilot }; 