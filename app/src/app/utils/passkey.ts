// Type declarations for ArrayBuffer base64/hex methods (Stage 4 TC39 proposal)

import * as z from 'zod';

// Official TypeScript types from https://github.com/microsoft/TypeScript/pull/61696/files#diff-e5ed90aff62aa7276987f4a0a103a6047e0bab29a6b7042a0e99bfb2bb39b971
declare global {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Uint8Array<TArrayBuffer extends ArrayBufferLike> {
    /**
     * Converts the `Uint8Array` to a base64-encoded string.
     * @param options If provided, sets the alphabet and padding behavior used.
     * @returns A base64-encoded string.
     */
    toBase64(options?: {
      alphabet?: 'base64' | 'base64url' | undefined;
      omitPadding?: boolean | undefined;
    }): string;

    /**
     * Sets the `Uint8Array` from a base64-encoded string.
     * @param string The base64-encoded string.
     * @param options If provided, specifies the alphabet and handling of the last chunk.
     * @returns An object containing the number of bytes read and written.
     * @throws {SyntaxError} If the input string contains characters outside the specified alphabet, or if the last
     * chunk is inconsistent with the `lastChunkHandling` option.
     */
    setFromBase64(
      string: string,
      options?: {
        alphabet?: 'base64' | 'base64url' | undefined;
        lastChunkHandling?:
          | 'loose'
          | 'strict'
          | 'stop-before-partial'
          | undefined;
      },
    ): {
      read: number;
      written: number;
    };

    /**
     * Converts the `Uint8Array` to a base16-encoded string.
     * @returns A base16-encoded string.
     */
    toHex(): string;

    /**
     * Sets the `Uint8Array` from a base16-encoded string.
     * @param string The base16-encoded string.
     * @returns An object containing the number of bytes read and written.
     */
    setFromHex(string: string): {
      read: number;
      written: number;
    };
  }

  interface Uint8ArrayConstructor {
    /**
     * Creates a new `Uint8Array` from a base64-encoded string.
     * @param string The base64-encoded string.
     * @param options If provided, specifies the alphabet and handling of the last chunk.
     * @returns A new `Uint8Array` instance.
     * @throws {SyntaxError} If the input string contains characters outside the specified alphabet, or if the last
     * chunk is inconsistent with the `lastChunkHandling` option.
     */
    fromBase64(
      string: string,
      options?: {
        alphabet?: 'base64' | 'base64url' | undefined;
        lastChunkHandling?:
          | 'loose'
          | 'strict'
          | 'stop-before-partial'
          | undefined;
      },
    ): Uint8Array<ArrayBuffer>;

    /**
     * Creates a new `Uint8Array` from a base16-encoded string.
     * @returns A new `Uint8Array` instance.
     */
    fromHex(string: string): Uint8Array<ArrayBuffer>;
  }
}

const RELYING_PARTY_NAME = 'RedditHarbor';

export const passkeySchema = z.object({
  id: z.string(),
  publicKey: z.string(),
  prfSalt: z.string(),
});

export type Passkey = z.infer<typeof passkeySchema>;

/**
 * Creates a new passkey for the user using WebAuthn with PRF extension.
 *
 * @param userId - Clerk user ID
 * @param email - User's email address
 * @param displayName - User's display name
 * @returns Passkey metadata (credential ID, public key, and PRF salt in base64 format)
 * @throws Error if passkey creation fails or is cancelled
 */
export async function addPasskey(
  userId: string,
  email: string,
  displayName: string,
): Promise<Passkey> {
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { id: window.location.hostname, name: RELYING_PARTY_NAME },
      user: {
        id: new TextEncoder().encode(userId),
        name: email,
        displayName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },
        { alg: -257, type: 'public-key' },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
      },
      extensions: { prf: {} },
    },
  });

  if (!credential) {
    throw new Error('Failed to create passkey');
  }
  if (!(credential instanceof PublicKeyCredential)) {
    throw new Error('Expected credential type to be `PublicKeyCredential`');
  }
  if (!(credential.response instanceof AuthenticatorAttestationResponse)) {
    throw new Error(
      'Expected credential response type to be `AuthenticatorAttestationResponse`',
    );
  }

  const clientExtensionResults = credential.getClientExtensionResults();
  const prfEnabled = clientExtensionResults.prf?.enabled;
  if (!prfEnabled) {
    throw new Error('Expected PRF extension to be enabled');
  }

  const publicKeyBytes = credential.response.getPublicKey();
  if (!publicKeyBytes) {
    throw new Error('Credential public key not available');
  }

  const id = new Uint8Array(credential.rawId).toBase64();
  const publicKey = new Uint8Array(publicKeyBytes).toBase64();
  const prfSalt = crypto.getRandomValues(new Uint8Array(32)).toBase64();

  return { id, publicKey, prfSalt };
}
