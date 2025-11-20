import * as z from 'zod';
import { encryptText } from '#app/utils/encryption.ts';

export const apiKeysSchema = z
  .object({
    claudeKey: z.string().trim(),
    openaiKey: z.string().trim(),
    redditClientId: z.string().trim(),
    redditClientSecret: z.string().trim(),
    supabaseProjectUrl: z.union([z.literal(''), z.url()]),
    supabaseApiKey: z.string().trim(),
    osfApiKey: z.string().trim(),
  })
  .refine((data) => data.claudeKey || data.openaiKey, {
    message: 'At least one API key is required',
  });

export type ApiKeys = z.infer<typeof apiKeysSchema>;

export type SaveApiKeysState = {
  errors?: z.core.$ZodFlattenedError<ApiKeys>;
};

export async function saveApiKeys(
  encryptionKey: CryptoKey,
  formData: FormData,
): Promise<SaveApiKeysState | undefined> {
  const rawFormData = Object.fromEntries(formData);
  const parsedResult = apiKeysSchema.safeParse(rawFormData);
  if (!parsedResult.success) {
    return {
      errors: z.flattenError(parsedResult.error),
    };
  }

  try {
    const encrypted = await encryptText(
      JSON.stringify(parsedResult.data),
      encryptionKey,
    );

    localStorage.setItem('apiKeys', JSON.stringify(encrypted));
  } catch (error) {
    return {
      errors: {
        fieldErrors: {},
        formErrors: [
          Error.isError(error)
            ? `${error}`
            : 'An unknown error occurred while saving API keys.',
        ],
      },
    };
  }
}
