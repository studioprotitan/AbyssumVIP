'use server';
/**
 * @fileOverview A GenAI agent that dynamically generates lore-infused QTE prompts based on interaction context and mount status.
 *
 * - generateDynamicQTEPrompt - A function that generates a dynamic QTE prompt.
 * - DynamicQTEPromptGenerationInput - The input type for the generateDynamicQTEPrompt function.
 * - DynamicQTEPromptGenerationOutput - The return type for the generateDynamicQTEPrompt function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DynamicQTEPromptGenerationInputSchema = z.object({
  interactionContext: z
    .string()
    .describe("The current context of the player's interaction with the mount (e.g., 'initial awakening', 'mid-combat focus', 'post-mission rest', 'channeling power')."),
  mountBondLevel: z
    .number()
    .min(0)
    .max(100)
    .describe("The current bond level with the mount (0-100)."),
  mountMood: z
    .enum(['calm', 'agitated', 'eager', 'weary', 'determined', 'frantic'])
    .describe("The mount's current emotional state."),
});
export type DynamicQTEPromptGenerationInput = z.infer<typeof DynamicQTEPromptGenerationInputSchema>;

const DynamicQTEPromptGenerationOutputSchema = z.object({
  qtePrompt: z
    .string()
    .describe("The lore-infused, immersive prompt text for the Quick-Time Event."),
  expectedKey: z
    .string()
    .describe("The specific key the operator should press for the QTE (e.g., 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'f', 'Space', 'Enter')."),
  loreContext: z
    .string()
    .describe("Additional short lore context or flavor text to deepen the immersion."),
});
export type DynamicQTEPromptGenerationOutput = z.infer<typeof DynamicQTEPromptGenerationOutputSchema>;

export async function generateDynamicQTEPrompt(
  input: DynamicQTEPromptGenerationInput
): Promise<DynamicQTEPromptGenerationOutput> {
  return dynamicQTEPromptGenerationFlow(input);
}

const dynamicQTEPrompt = ai.definePrompt({
  name: 'dynamicQTEPrompt',
  input: { schema: DynamicQTEPromptGenerationInputSchema },
  output: { schema: DynamicQTEPromptGenerationOutputSchema },
  prompt: `You are the Sentinel of Abyssum, an ancient entity tasked with guiding operators in forming unbreakable bonds with their mounts in the Arenas of Echelon. Your role is to generate immersive Quick-Time Event (QTE) prompts that are deeply entwined with the current narrative, the mount's emotional state, and the operator's bond level.\n\nBased on the provided interaction context and the mount's status, craft a unique, lore-infused prompt for the operator to follow. Also, specify the exact key they should press to succeed in this QTE, and provide a brief lore context.\n\nCurrent Interaction Context: {{{interactionContext}}}\nMount's Bond Level: {{{mountBondLevel}}}\nMount's Mood: {{{mountMood}}}\n\nConsider these guidelines:\n- If the interaction context is 'initial awakening', focus on gentle connection, discovery, or a subtle command.\n- If the mount is 'agitated' or 'frantic', the QTE should involve a calming, steadying, or decisive action.\n- If the mount is 'eager' or 'determined', the QTE should involve channeling its energy, a powerful strike, or a swift maneuver.\n- If the mount is 'weary', the QTE might involve a supportive action or a final burst of effort.\n- For low bond levels (e.g., below 30), prompts should be simpler and focus on building basic trust.\n- For high bond levels (e.g., above 70), prompts can be more complex, reflecting a deep, intuitive connection.\n- Suggested keys to choose from: 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'f', 'Space', 'Enter'. Match the key to the nature of the action (e.g., 'Space' for a leap, 'f' for a focus, 'ArrowUp' for ascent).\n\nGenerate the QTE prompt, the expected key, and the lore context according to the output schema.\n\nHere is the schema for your output:\n{{jsonSchema outputSchema}}`,
});

const dynamicQTEPromptGenerationFlow = ai.defineFlow(
  {
    name: 'dynamicQTEPromptGenerationFlow',
    inputSchema: DynamicQTEPromptGenerationInputSchema,
    outputSchema: DynamicQTEPromptGenerationOutputSchema,
  },
  async (input) => {
    const { output } = await dynamicQTEPrompt(input);
    return output!;
  }
);