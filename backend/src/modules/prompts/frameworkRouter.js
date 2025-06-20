// Source: https://github.com/hadeeb/coppieGPT (adapted for Stratix)
// Framework Router - Stores frameworks and routes prompts

const frameworks = {
  PAS: {
    name: 'Problem-Agitate-Solution',
    template: (input) => `Problem: ${input.problem}\nAgitate: ${input.agitate}\nSolution: ${input.solution}`,
  },
  AIDA: {
    name: 'Attention-Interest-Desire-Action',
    template: (input) => `Attention: ${input.attention}\nInterest: ${input.interest}\nDesire: ${input.desire}\nAction: ${input.action}`,
  },
  FAB: {
    name: 'Features-Advantages-Benefits',
    template: (input) => `Feature: ${input.feature}\nAdvantage: ${input.advantage}\nBenefit: ${input.benefit}`,
  },
  // ...add 17+ more frameworks as needed
};

/**
 * Route a prompt through the correct framework
 * @param {string} type - Generation type (e.g., 'ad', 'cta', 'seo')
 * @param {object} input - Input fields for the framework
 */
function routePrompt(type, input) {
  // Example: select framework based on type
  if (type === 'ad') return frameworks.PAS.template(input);
  if (type === 'cta') return frameworks.AIDA.template(input);
  if (type === 'seo') return frameworks.FAB.template(input);
  // Default to PAS
  return frameworks.PAS.template(input);
}

const copywriting_formulas = [
  "AIDA", "PAS", "BAB", "4 Cs", "4 Ps", "4 Us", "FAB", "QUEST", "ACCA", "OATH", "APP", "RECIPE",
  // ... (full list of 232 frameworks as in CoppieGPT)
];

function rewrite_with_frameworks(content, count = 6) {
  // Generate content variations using random copywriting frameworks
  const chosen = [];
  while (chosen.length < count) {
    const idx = Math.floor(Math.random() * copywriting_formulas.length);
    if (!chosen.includes(copywriting_formulas[idx])) chosen.push(copywriting_formulas[idx]);
  }
  return chosen.map(formula => `[${formula}] ${content}`); // In practice, replace with LLM output
}

// Example usage:
// const alt_headlines = rewrite_with_frameworks("Introducing our new eco-friendly water bottle.", 3);
// alt_headlines.forEach(h => console.log(h));

module.exports = { frameworks, routePrompt, copywriting_formulas, rewrite_with_frameworks }; 