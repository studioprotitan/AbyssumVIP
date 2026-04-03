
'use server';
/**
 * @fileOverview Sync Intel Node — The predictive guidance layer of the Avatar Brain.
 *
 * - getSyncIntel - Analyzes world state to provide tactical guidance.
 * - SyncIntelInput - State snapshot input.
 * - SyncIntelOutput - Strategic recommendations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { ThreatLevel, SurvivalDirective } from '@/lib/game/types';

const SyncIntelInputSchema = z.object({
  environment: z.string(),
  threatLevel: z.nativeEnum(ThreatLevel),
  entropyScore: z.number(),
  pilotIntent: z.string(),
});

const SyncIntelOutputSchema = z.object({
  suggestedDirective: z.nativeEnum(SurvivalDirective),
  tacticalWeights: z.record(z.number()).describe('Weighting for different behavior categories.'),
  riskAssessment: z.string().describe('Short summary of current tactical risk.'),
});

export type SyncIntelInput = z.infer<typeof SyncIntelInputSchema>;
export type SyncIntelOutput = z.infer<typeof SyncIntelOutputSchema>;

export async function getSyncIntel(input: SyncIntelInput): Promise<SyncIntelOutput> {
  return syncIntelFlow(input);
}

const syncPrompt = ai.definePrompt({
  name: 'syncPrompt',
  input: { schema: SyncIntelInputSchema },
  output: { schema: SyncIntelOutputSchema },
  prompt: `You are the Sync Intel Node, the strategic intelligence layer for the Sentinel.
Your goal is to evaluate the current world state and provide tactical guidance.

Environment: {{{environment}}}
Threat Level: {{{threatLevel}}}
Entropy (Uncertainty): {{{entropyScore}}}
Pilot Intent: {{{pilotIntent}}}

Strategic Rules:
1. If threat is CRITICAL or entropy is high (>0.8), prioritize EMERGENCY or SURVIVAL directives.
2. If threat is MODERATE and environment is 'interior', weight 'stealth' and 'efficient' tactics higher.
3. If pilot intent is 'evade', suggest FLIGHT directive.
4. Provide weights for 'traversal', 'combat', and 'stealth' based on the context.

Generate the strategic directive and risk assessment.`,
});

const syncIntelFlow = ai.defineFlow(
  {
    name: 'syncIntelFlow',
    inputSchema: SyncIntelInputSchema,
    outputSchema: SyncIntelOutputSchema,
  },
  async (input) => {
    const { output } = await syncPrompt(input);
    if (!output) throw new Error('Sync Node failed to generate intel.');
    return output;
  }
);
