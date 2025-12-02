// Official TypeScript types from https://github.com/microsoft/TypeScript/pull/61696/files#diff-e5ed90aff62aa7276987f4a0a103a6047e0bab29a6b7042a0e99bfb2bb39b971
// TODO: remove this when using TS 6.0+
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
      lastChunkHandling?: 'loose' | 'strict' | 'stop-before-partial' | undefined;
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
      lastChunkHandling?: 'loose' | 'strict' | 'stop-before-partial' | undefined;
    },
  ): Uint8Array<ArrayBuffer>;

  /**
   * Creates a new `Uint8Array` from a base16-encoded string.
   * @returns A new `Uint8Array` instance.
   */
  fromHex(string: string): Uint8Array<ArrayBuffer>;
}
