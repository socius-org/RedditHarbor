// Type declarations for ArrayBuffer base64/hex methods (Stage 4 TC39 proposal)

import * as z from 'zod';

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
