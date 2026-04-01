'use server';
/**
 * @fileOverview This file implements a Genkit flow for the AI companion's adaptive behavior system.
 *
 * - adaptiveAICompanionBehavior - A function that orchestrates the AI companion's behavior based on pseudo-memory and personality.
 * - AdaptiveAICompanionBehaviorInput - The input type for the adaptiveAICompanionBehavior function, representing the companion's current state.
 * - AdaptiveAICompanionBehaviorOutput - The return type for the adaptiveAICompanionBehavior function, representing a sorted list of recommended behavior actions.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { 
  Locomotion, 
  Environment, 
  MissionContext, 
  PilotIntent, 
  Personality,
  AdaptiveAICompanionBehaviorInput
} from '@/lib/game/types';

// 1. Zod Schemas for input and output
const LocomotionSchema = z.nativeEnum(Locomotion);
const EnvironmentSchema = z.nativeEnum(Environment);
const MissionContextSchema = z.nativeEnum(MissionContext);
const PilotIntentSchema = z.nativeEnum(PilotIntent);
const PersonalitySchema = z.nativeEnum(Personality);

const PseudoMemorySnapshotSchema = z.object({
  locomotion: LocomotionSchema.describe('Current locomotion state of the companion.'),
  environment: EnvironmentSchema.describe('Current environmental context.'),
  missionContext: MissionContextSchema.describe('Current mission context.'),
  pilotIntent: PilotIntentSchema.describe('The strategic intent of the pilot.'),
  personality: PersonalitySchema.describe('The AI companion\'s personality.'),
  timestamp: z.number().describe('Timestamp of the snapshot.')
}).describe('Current and historical state snapshot of the AI companion.');

const BehaviorActionSchema = z.object({
  name: z.string().describe('Name of the behavior action (e.g., "walk", "vault").'),
  conditions: z.array(z.string()).describe('List of conditions (environment, mission context, personality constraints) for this action.'),
  animationRange: z.array(z.number().int()).length(2).describe('Start and end frame range for the GLB skeleton animation.'),
  priority: z.number().int().describe('Base priority of the action.'),
  signalPulseWeight: z.number().describe('Dendritic weighting for this action, can be float.')
}).describe('A possible behavior action for the AI companion.');

export type AdaptiveAICompanionBehaviorOutput = z.infer<typeof BehaviorActionSchema>[];

// 2. Behavior Repository (internal to the flow)
const BehaviorRepo: z.infer<typeof BehaviorActionSchema>[] = [
  { name: 'walk', conditions: ['interior', 'launchPrep'], animationRange: [0, 30], priority: 2, signalPulseWeight: 1 },
  { name: 'sprint', conditions: ['exterior', 'pursuit'], animationRange: [31, 60], priority: 3, signalPulseWeight: 2 },
  { name: 'vault', conditions: ['railcar', 'forward'], animationRange: [61, 90], priority: 3, signalPulseWeight: 2 },
  { name: 'look-to-next', conditions: ['postCombat'], animationRange: [91, 110], priority: 5, signalPulseWeight: 3 }
];

// 3. Prompt Definition
const adaptiveAICompanionPrompt = ai.definePrompt({
  name: 'adaptiveAICompanionPrompt',
  input: { schema: PseudoMemorySnapshotSchema },
  output: { schema: z.array(BehaviorActionSchema) },
  prompt: `You are an intelligent agent responsible for determining the next set of adaptive behaviors for an AI companion based on its current state and a repository of possible actions.\n\nGiven the current pseudo-memory snapshot of the AI companion and a list of available behavior actions, you must determine the most suitable next actions.\n\nHere's the process you need to follow:\n1.  **Filter Actions**: From the Behavior Repository, select only those actions where:\n    -   The action's 'conditions' array includes the companion's current 'environment'.\n    -   AND the action's 'conditions' array includes either the companion's current 'missionContext' OR the specific condition 'postCombat'.\n\n2.  **Apply Personality Weights**: For each of the filtered actions, adjust its 'signalPulseWeight' based on the companion's 'personality' from the current pseudo-memory:\n    -   If the companion's personality is 'cautious' AND the action's 'name' is 'vault', reduce its 'signalPulseWeight' by 50% (multiply by 0.5).\n    -   If the companion's personality is 'efficient' AND the action's 'name' is 'walk', increase its 'signalPulseWeight' by 50% (multiply by 1.5).\n    -   If the companion's personality is 'aggressive' AND the action's 'name' is 'sprint', increase its 'signalPulseWeight' by 50% (multiply by 1.5).\n    -   For all other cases, the 'signalPulseWeight' remains unchanged.\n\n3.  **Sort Actions**: Sort the adjusted actions in descending order based on the sum of their 'priority' and their (potentially adjusted) 'signalPulseWeight'. The action with the highest sum should be first.\n\n4.  **Return Sorted Actions**: Provide the full sorted list of \`BehaviorAction\` objects in JSON format.\n\nCurrent Pseudo-Memory Snapshot:\n\`\`\`json\n{{{JSON.stringify input}}}\n\`\`\`\n\nBehavior Repository (available actions):\n\`\`\`json\n${JSON.stringify(BehaviorRepo, null, 2)}\n\`\`\`\n`
});

// 4. Flow Definition
const adaptiveAICompanionBehaviorFlow = ai.defineFlow(
  {
    name: 'adaptiveAICompanionBehaviorFlow',
    inputSchema: PseudoMemorySnapshotSchema,
    outputSchema: z.array(BehaviorActionSchema)
  },
  async (input) => {
    const { output } = await adaptiveAICompanionPrompt(input);
    if (!output) {
      throw new Error('Failed to generate adaptive AI companion behavior.');
    }
    return output;
  }
);

// 5. Exported wrapper function
export async function adaptiveAICompanionBehavior(
  input: AdaptiveAICompanionBehaviorInput
): Promise<AdaptiveAICompanionBehaviorOutput> {
  return adaptiveAICompanionBehaviorFlow(input);
}
