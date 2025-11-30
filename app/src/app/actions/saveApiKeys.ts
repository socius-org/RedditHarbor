import * as z from 'zod';
import {
  decryptText,
  encryptedDataSchema,
  encryptText,
  type EncryptedData,
} from '#app/utils/encryption.ts';

const apiKeysSchema = z
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

export const encryptedApiKeysSchema = z.object({
  claudeKey: encryptedDataSchema.nullable(),
  openaiKey: encryptedDataSchema.nullable(),
  redditClientId: encryptedDataSchema.nullable(),
  redditClientSecret: encryptedDataSchema.nullable(),
  supabaseProjectUrl: encryptedDataSchema.nullable(),
  supabaseApiKey: encryptedDataSchema.nullable(),
  osfApiKey: encryptedDataSchema.nullable(),
} satisfies Record<keyof ApiKeys, z.ZodNullable<typeof encryptedDataSchema>>);

export type EncryptedApiKeys = z.infer<typeof encryptedApiKeysSchema>;

export type SaveApiKeysState = {
  errors: z.core.$ZodFlattenedError<ApiKeys>;
  formData: FormData;
};

async function encryptApiKeys(
  apiKeys: ApiKeys,
  encryptionKey: CryptoKey,
): Promise<EncryptedApiKeys> {
  async function encryptField(value: string): Promise<EncryptedData | null> {
    return value ? encryptText(value, encryptionKey) : null;
  }

  const [
    claudeKey,
    openaiKey,
    redditClientId,
    redditClientSecret,
    supabaseProjectUrl,
    supabaseApiKey,
    osfApiKey,
  ] = await Promise.all([
    encryptField(apiKeys.claudeKey),
    encryptField(apiKeys.openaiKey),
    encryptField(apiKeys.redditClientId),
    encryptField(apiKeys.redditClientSecret),
    encryptField(apiKeys.supabaseProjectUrl),
    encryptField(apiKeys.supabaseApiKey),
    encryptField(apiKeys.osfApiKey),
  ]);

  return {
    claudeKey,
    openaiKey,
    redditClientId,
    redditClientSecret,
    supabaseProjectUrl,
    supabaseApiKey,
    osfApiKey,
  };
}

export async function decryptApiKeys(
  storedApiKeys: EncryptedApiKeys | null,
  encryptionKey: CryptoKey,
): Promise<ApiKeys> {
  if (!storedApiKeys) {
    return {
      claudeKey: '',
      openaiKey: '',
      redditClientId: '',
      redditClientSecret: '',
      supabaseProjectUrl: '',
      supabaseApiKey: '',
      osfApiKey: '',
    };
  }

  async function decryptField(
    encrypted: EncryptedData | null,
  ): Promise<string> {
    return encrypted ? decryptText(encrypted, encryptionKey) : '';
  }

  const [
    claudeKey,
    openaiKey,
    redditClientId,
    redditClientSecret,
    supabaseProjectUrl,
    supabaseApiKey,
    osfApiKey,
  ] = await Promise.all([
    decryptField(storedApiKeys.claudeKey),
    decryptField(storedApiKeys.openaiKey),
    decryptField(storedApiKeys.redditClientId),
    decryptField(storedApiKeys.redditClientSecret),
    decryptField(storedApiKeys.supabaseProjectUrl),
    decryptField(storedApiKeys.supabaseApiKey),
    decryptField(storedApiKeys.osfApiKey),
  ]);

  return {
    claudeKey,
    openaiKey,
    redditClientId,
    redditClientSecret,
    supabaseProjectUrl,
    supabaseApiKey,
    osfApiKey,
  };
}

export async function saveApiKeys(
  encryptionKey: CryptoKey,
  setApiKeys: (value: EncryptedApiKeys) => void,
  invalidateApiKeys: (encrypted: EncryptedApiKeys, newApiKeys: ApiKeys) => void,
  formData: FormData,
): Promise<SaveApiKeysState | undefined> {
  const rawFormData = Object.fromEntries(formData);
  const parsedResult = apiKeysSchema.safeParse(rawFormData);
  if (!parsedResult.success) {
    return {
      errors: z.flattenError(parsedResult.error),
      formData,
    };
  }

  let encrypted;

  try {
    encrypted = await encryptApiKeys(parsedResult.data, encryptionKey);

    setApiKeys(encrypted);
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
      formData,
    };
  }
  invalidateApiKeys(encrypted, parsedResult.data);
}
