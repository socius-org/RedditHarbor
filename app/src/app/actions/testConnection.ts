'use server';

import * as z from 'zod';

type TestConnectionResult = {
  success: boolean;
  message: string;
};

const testConnectionSchema = z.discriminatedUnion('service', [
  z.object({
    service: z.literal('claude'),
    claudeKey: z.string().trim().min(1),
  }),
  z.object({
    service: z.literal('openai'),
    openaiKey: z.string().trim().min(1),
  }),
  z.object({
    service: z.literal('reddit'),
    redditClientId: z.string().trim().min(1),
    redditClientSecret: z.string().trim().min(1),
  }),
  z.object({
    service: z.literal('supabase'),
    supabaseProjectUrl: z.url(),
    supabaseApiKey: z.string().trim().min(1),
  }),
  z.object({
    service: z.literal('osf'),
    osfApiKey: z.string().trim().min(1),
  }),
]);

export type TestConnectionService = z.infer<
  typeof testConnectionSchema
>['service'];

export async function testConnection(
  _prevState: TestConnectionResult | undefined,
  formData: FormData,
): Promise<TestConnectionResult | undefined> {
  const rawData = Object.fromEntries(formData);
  const parsed = testConnectionSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      message: 'Invalid request',
    };
  }

  const { data } = parsed;

  try {
    switch (data.service) {
      case 'claude': {
        // Test connection by listing available models
        // https://platform.claude.com/docs/en/api/models/list
        const response = await fetch('https://api.anthropic.com/v1/models', {
          headers: {
            'X-Api-Key': data.claudeKey,
            'anthropic-version': '2023-06-01',
          },
        });

        if (response.ok) {
          return {
            success: true,
            message: 'Claude API connection successful',
          };
        } else {
          return {
            success: false,
            message: 'Connection failed. Please check your API key.',
          };
        }
      }

      case 'openai': {
        // Test connection by listing available models
        // https://platform.openai.com/docs/api-reference/models/list
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            Authorization: `Bearer ${data.openaiKey}`,
          },
        });

        if (response.ok) {
          return {
            success: true,
            message: 'OpenAI API connection successful',
          };
        } else {
          return {
            success: false,
            message: 'Connection failed. Please check your API key.',
          };
        }
      }

      case 'reddit': {
        if (typeof Uint8Array.prototype.toBase64 !== 'function') {
          // @ts-expect-error `core-js` doesn't seem to provide TS definitions.
          await import('core-js/proposals/array-buffer-base64');
        }

        // Test connection using OAuth2 application-only auth
        // https://github.com/reddit-archive/reddit/wiki/OAuth2#application-only-oauth
        const auth = new TextEncoder()
          .encode(`${data.redditClientId}:${data.redditClientSecret}`)
          .toBase64();
        const response = await fetch(
          'https://www.reddit.com/api/v1/access_token',
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
          },
        );

        if (response.ok) {
          return {
            success: true,
            message: 'Reddit API connection successful',
          };
        } else {
          return {
            success: false,
            message: 'Connection failed. Please check your credentials.',
          };
        }
      }

      case 'supabase': {
        // Test connection by accessing the REST API root
        // https://supabase.com/docs/guides/api#rest-api-overview
        const url = new URL('/rest/v1/', data.supabaseProjectUrl);
        const response = await fetch(url, {
          headers: {
            apikey: data.supabaseApiKey,
            Authorization: `Bearer ${data.supabaseApiKey}`,
          },
        });

        if (response.ok) {
          return {
            success: true,
            message: 'Supabase API connection successful',
          };
        } else {
          return {
            success: false,
            message: 'Connection failed. Please check your credentials.',
          };
        }
      }

      case 'osf': {
        // Test connection by fetching current user
        // https://developer.osf.io/#tag/Users/operation/users_read
        const response = await fetch('https://api.osf.io/v2/users/me/', {
          headers: {
            Authorization: `Bearer ${data.osfApiKey}`,
          },
        });

        if (response.ok) {
          return {
            success: true,
            message: 'OSF API connection successful',
          };
        } else {
          return {
            success: false,
            message: 'Connection failed. Please check your API key.',
          };
        }
      }
    }
  } catch {
    return {
      success: false,
      message: 'Connection failed. Please try again.',
    };
  }
}
