// Split Testing System - TypeScript implementation using GrowthBook SDK
// Runs experiments and selects variations using real GrowthBook integration.

// @ts-ignore
import { Experiment, GrowthBook } from '@growthbook/growthbook';

export interface ExperimentResult {
  variation: string;
}

export async function runExperiment(userId: string, experimentKey: string, variations: string[]): Promise<ExperimentResult> {
  // Initialize GrowthBook (assumes features/experiments are fetched from GrowthBook API)
  const gb = new GrowthBook({ user: { id: userId, attributes: {} } });
  const experiment: Experiment<string> = {
    key: experimentKey,
    variations,
  };
  const { value: variation } = gb.run(experiment);
  return { variation };
} 