
'use server';
/**
 * @fileOverview Oracle AI Intel Node - The predictive guidance layer of the Avatar Brain.
 *
 * - oracleIntelNode - Analyzes world state to provide tactical guidance.
 * - OracleIntelInput - State snapshot input.
 * - OracleIntelOutput - Strategic recommendations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { ThreatLevel, SurvivalDirective } from '@/lib/game/types';

const OracleIntelInputSchema = z.object({
  environment: z.string(),
  threatLevel: z.nativeEnum(ThreatLevel),
  entropyScore: z.number(),
  pilotIntent: z.string(),
});

const OracleIntelOutputSchema = z.object({
  suggestedDirective: z.nativeEnum(SurvivalDirective),
  tacticalWeights: z.record(z.number()).describe('Weighting for different behavior categories.'),
  riskAssessment: z.string().describe('Short summary of current tactical risk.'),
});

export type OracleIntelInput = z.infer<typeof OracleIntelInputSchema>;
export type OracleIntelOutput = z.infer<typeof OracleIntelOutputSchema>;

export async function getOracleIntel(input: OracleIntelInput): Promise<OracleIntelOutput> {
  return oracleIntelFlow(input);
}

const oraclePrompt = ai.definePrompt({
  name: 'oraclePrompt',
  input: { schema: OracleIntelInputSchema },
  output: { schema: OracleIntelOutputSchema },
  prompt: `You are the Oracle AI Intel Node, the strategic intelligence layer for the Sentinel.
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

const oracleIntelFlow = ai.defineFlow(
  {
    name: 'oracleIntelFlow',
    inputSchema: OracleIntelInputSchema,
    outputSchema: OracleIntelOutputSchema,
  },
  async (input) => {
    const { output } = await oraclePrompt(input);
    if (!output) throw new Error('Oracle failed to generate intel.');
    return output;
  }
);
