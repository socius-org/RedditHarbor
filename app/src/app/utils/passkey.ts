import * as z from 'zod';
import { deriveKey } from './encryption';

const RELYING_PARTY_NAME = 'RedditHarbor';

export const passkeySchema = z.object({
  id: z.string(),
  prfSalt: z.string(),
});

export type Passkey = z.infer<typeof passkeySchema>;

/**
 * Creates a new passkey for the user using WebAuthn with PRF extension.
 *
 * @param userId - Clerk user ID
 * @param email - User's email address
 * @param displayName - User's display name
 * @returns Passkey metadata (credential ID and PRF salt in base64 format)
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

  const id = new Uint8Array(credential.rawId).toBase64();
  const prfSalt = crypto.getRandomValues(new Uint8Array(32)).toBase64();

  return { id, prfSalt };
}

/**
 * Authenticates using a passkey and derives an encryption key from the PRF output.
 *
 * @param passkey - Passkey metadata containing credential ID and PRF salt
 * @returns CryptoKey for AES-GCM encryption/decryption
 * @throws Error if authentication fails, is cancelled, or PRF output is not available
 */
export async function authenticateAndDeriveKey(
  passkey: Passkey,
): Promise<CryptoKey> {
  const prfSalt = Uint8Array.fromBase64(passkey.prfSalt);

  const credential = await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rpId: window.location.hostname,
      allowCredentials: [
        { type: 'public-key', id: Uint8Array.fromBase64(passkey.id) },
      ],
      userVerification: 'required',
      extensions: { prf: { eval: { first: prfSalt } } },
    },
  });

  if (!(credential instanceof PublicKeyCredential)) {
    throw new Error('Expected credential type to be `PublicKeyCredential`');
  }

  const prfOutput = credential.getClientExtensionResults().prf?.results?.first;
  if (!prfOutput) {
    throw new Error('PRF output not available');
  }
  return await deriveKey(prfOutput);
}
