import * as z from 'zod';

export const apiKeysSchema = z
  .object({
    claudeKey: z.string().trim(),
    openaiKey: z.string().trim(),
  })
  .refine((data) => data.claudeKey || data.openaiKey, {
    message: 'At least one API key is required',
  });

export type SaveApiKeysState = {
  errors?: z.core.$ZodFlattenedError<z.infer<typeof apiKeysSchema>>;
};

export async function saveApiKeys(
  _prevState: SaveApiKeysState | undefined,
  formData: FormData,
): Promise<SaveApiKeysState | undefined> {
  const rawFormData = Object.fromEntries(formData);
  const parsedResult = apiKeysSchema.safeParse(rawFormData);
  if (!parsedResult.success) {
    return {
      errors: z.flattenError(parsedResult.error),
    };
  }

  // TODO: store API keys
  console.log('Validated API Keys:', parsedResult.data);
  await new Promise((resolve) => setTimeout(resolve, 2500));
}
