export type EncryptedData = {
  /** Base64-encoded encrypted data */
  ciphertext: string;
  /** Base64-encoded initialisation vector */
  iv: string;
};

/**
 * Encrypts text using AES-256-GCM.
 *
 * @param text - Plain text to encrypt
 * @param key - CryptoKey for AES-GCM encryption
 * @returns Encrypted data with ciphertext and IV (both Base64-encoded)
 */
export async function encryptText(
  text: string,
  key: CryptoKey,
): Promise<EncryptedData> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded,
  );
  return {
    ciphertext: new Uint8Array(encrypted).toBase64(),
    iv: iv.toBase64(),
  };
}

/**
 * Decrypts text using AES-256-GCM.
 *
 * @param encrypted - Encrypted data with ciphertext and IV (both Base64-encoded)
 * @param key - CryptoKey for AES-GCM decryption
 * @returns Decrypted plain text
 */
export async function decryptText(
  encrypted: EncryptedData,
  key: CryptoKey,
): Promise<string> {
  const iv = Uint8Array.fromBase64(encrypted.iv);
  const ciphertext = Uint8Array.fromBase64(encrypted.ciphertext);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  );
  return new TextDecoder().decode(decrypted);
}
