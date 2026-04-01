'use server';
/**
 * @fileOverview A Genkit flow for generating 3D GLB models based on natural language descriptions.
 *
 * - generate3DAsset - A function that handles the 3D asset generation process.
 * - OnDemand3DAssetGenerationInput - The input type for the generate3DAsset function.
 * - OnDemand3DAssetGenerationOutput - The return type for the generate3DAsset function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const OnDemand3DAssetGenerationInputSchema = z.object({
  description: z.string().describe('A natural language description of the desired 3D GLB model, including its components or aesthetic modifications.'),
});
export type OnDemand3DAssetGenerationInput = z.infer<typeof OnDemand3DAssetGenerationInputSchema>;

const OnDemand3DAssetGenerationOutputSchema = z.object({
  modelUrl: z.string().url().describe('A simulated URL to the generated 3D GLB model.'),
  textSummary: z.string().describe('A text summary of the generated 3D asset, based on the input description.'),
});
export type OnDemand3DAssetGenerationOutput = z.infer<typeof OnDemand3DAssetGenerationOutputSchema>;

export async function generate3DAsset(input: OnDemand3DAssetGenerationInput): Promise<OnDemand3DAssetGenerationOutput> {
  return onDemand3DAssetGenerationFlow(input);
}

const assetGenerationPrompt = ai.definePrompt({
  name: 'assetGenerationPrompt',
  input: { schema: OnDemand3DAssetGenerationInputSchema },
  output: { schema: OnDemand3DAssetGenerationOutputSchema },
  prompt: `You are an advanced Tripo3D API simulator for generating 3D GLB models.

Based on the following natural language description, provide a text summary of the envisioned 3D model and generate a placeholder URL for the GLB model.

Description: {{{description}}}

The response should describe the visual features in detail.`,
});

const onDemand3DAssetGenerationFlow = ai.defineFlow(
  {
    name: 'onDemand3DAssetGenerationFlow',
    inputSchema: OnDemand3DAssetGenerationInputSchema,
    outputSchema: OnDemand3DAssetGenerationOutputSchema,
  },
  async (input) => {
    const { output } = await assetGenerationPrompt(input);

    if (!output) {
      throw new Error('Failed to generate 3D asset summary.');
    }

    const sanitizedDescription = input.description
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-'); // Replace spaces with hyphens

    const modelUrl = `https://tripo3d.com/models/${sanitizedDescription}.glb`;

    return {
      modelUrl,
      textSummary: output.textSummary,
    };
  }
);
