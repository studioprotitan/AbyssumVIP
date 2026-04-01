
'use server';
/**
 * @fileOverview GOAP Planner - Determines the next set of adaptive behaviors based on memory and Oracle intel.
 *
 * - adaptiveAICompanionBehavior - The GOAP planner logic.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { 
  AdaptiveAICompanionBehaviorInput,
  Locomotion, 
  Environment, 
  MissionContext, 
  PilotIntent, 
  Personality,
  SurvivalDirective,
  BehaviorAction
} from '@/lib/game/types';

const BehaviorActionSchema = z.object({
  name: z.string(),
  conditions: z.array(z.string()),
  animationRange: z.array(z.number().int()).length(2),
  priority: z.number().int(),
  signalPulseWeight: z.number()
});

const GOAPInputSchema = z.object({
  memory: z.object({
    locomotion: z.nativeEnum(Locomotion),
    environment: z.nativeEnum(Environment),
    missionContext: z.nativeEnum(MissionContext),
    pilotIntent: z.nativeEnum(PilotIntent),
    personality: z.nativeEnum(Personality),
  }),
  oracleIntel: z.object({
    suggestedDirective: z.nativeEnum(SurvivalDirective),
    tacticalWeights: z.record(z.number()),
  }),
  entropyScore: z.number()
});

export type AdaptiveAICompanionBehaviorOutput = z.infer<typeof BehaviorActionSchema>[];

const BehaviorRepo: z.infer<typeof BehaviorActionSchema>[] = [
  { name: 'walk', conditions: ['interior', 'launchPrep'], animationRange: [0, 30], priority: 2, signalPulseWeight: 1 },
  { name: 'sprint', conditions: ['exterior', 'pursuit'], animationRange: [31, 60], priority: 3, signalPulseWeight: 2 },
  { name: 'vault', conditions: ['railcar', 'forward'], animationRange: [61, 90], priority: 3, signalPulseWeight: 2 },
  { name: 'climb', conditions: ['exterior', 'rooftop'], animationRange: [120, 150], priority: 4, signalPulseWeight: 2.5 },
  { name: 'swim', conditions: ['water'], animationRange: [160, 190], priority: 5, signalPulseWeight: 3 },
  { name: 'brace', conditions: ['emergency', 'falling'], animationRange: [200, 210], priority: 10, signalPulseWeight: 5 }
];

const goapPrompt = ai.definePrompt({
  name: 'goapPrompt',
  input: { schema: GOAPInputSchema },
  output: { schema: z.array(BehaviorActionSchema) },
  prompt: `You are the GOAP (Goal-Oriented Action Planner) for the Sentinel.
Based on the Oracle's strategic guidance and the companion's current memory, select and rank the best actions from the repository.

Oracle Directive: {{{oracleIntel.suggestedDirective}}}
Environment: {{{memory.environment}}}
Personality: {{{memory.personality}}}
Entropy Score: {{{entropyScore}}}

Rules:
1. Filter actions that match the current environment or the Oracle's suggested directive.
2. If Entropy is high (>0.7), prioritize high-weight actions for survival.
3. Adjust priorities based on personality: Aggressive companions favor sprints/vaults; Cautious favor braces/walks.
4. Return a sorted list of actions by priority and pulse weight.

Repository:
${JSON.stringify(BehaviorRepo)}
`,
});

const adaptiveAICompanionBehaviorFlow = ai.defineFlow(
  {
    name: 'adaptiveAICompanionBehaviorFlow',
    inputSchema: GOAPInputSchema,
    outputSchema: z.array(BehaviorActionSchema)
  },
  async (input) => {
    const { output } = await goapPrompt(input);
    if (!output) throw new Error('GOAP failed to generate plan.');
    return output;
  }
);

export async function adaptiveAICompanionBehavior(input: any): Promise<AdaptiveAICompanionBehaviorOutput> {
  return adaptiveAICompanionBehaviorFlow(input);
}
