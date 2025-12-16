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

// https://github.com/denoland/deno/issues/21450#issuecomment-3471583944
declare namespace Intl {
  type DurationTimeFormatLocaleMatcher = 'best fit' | 'lookup';

  /**
   * Value of the `unit` property in duration objects
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/format#duration).
   */
  type DurationTimeFormatUnit =
    | 'days'
    | 'hours'
    | 'microseconds'
    | 'milliseconds'
    | 'minutes'
    | 'months'
    | 'nanoseconds'
    | 'seconds'
    | 'weeks'
    | 'years';

  /**
   * The style of the formatted duration.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/DurationFormat#style).
   */
  type DurationFormatStyle = 'digital' | 'long' | 'narrow' | 'short';

  type DurationFormatUnitSingular =
    | 'day'
    | 'hour'
    | 'minute'
    | 'month'
    | 'quarter'
    | 'second'
    | 'week'
    | 'year';

  /**
   * An object representing the relative time format in parts
   * that can be used for custom locale-aware formatting.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/formatToParts#examples).
   */
  type DurationFormatPart =
    | {
        type: 'literal';
        value: string;
      }
    | {
        type: Exclude<NumberFormatPartTypes, 'literal'>;
        unit: DurationFormatUnitSingular;
        value: string;
      };

  type DurationFormatOption = '2-digit' | 'long' | 'narrow' | 'numeric' | 'short';

  type DurationFormatDisplayOption = 'always' | 'auto';

  /**
   * Number of how many fractional second digits to display in the output.
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/DurationFormat#fractionaldigits).
   */
  type FractionalDigitsOption = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

  interface ResolvedDurationFormatOptions {
    days?: Exclude<DurationFormatOption, '2-digit' | 'numeric'>;
    daysDisplay?: DurationFormatDisplayOption;
    fractionalDigits?: FractionalDigitsOption;
    hours?: DurationFormatOptions;
    hoursDisplay?: DurationFormatDisplayOption;
    locale?: UnicodeBCP47LocaleIdentifier;
    microseconds?: DurationFormatOptions;
    microsecondsDisplay?: DurationFormatDisplayOption;
    milliseconds?: DurationFormatOptions;
    millisecondsDisplay?: DurationFormatDisplayOption;
    minutes?: DurationFormatOptions;
    minutesDisplay?: DurationFormatDisplayOption;
    months?: Exclude<DurationFormatOption, '2-digit' | 'numeric'>;
    monthsDisplay?: DurationFormatDisplayOption;
    nanosecond?: DurationFormatOptions;
    nanosecondDisplay?: DurationFormatDisplayOption;
    numberingSystem?: DateTimeFormatOptions['numberingSystem'];
    seconds?: DurationFormatOptions;
    secondsDisplay?: DurationFormatDisplayOption;
    style?: DurationFormatStyle;
    weeks?: Exclude<DurationFormatOption, '2-digit' | 'numeric'>;
    weeksDisplay?: DurationFormatDisplayOption;
    years?: Exclude<DurationFormatOption, '2-digit' | 'numeric'>;
    yearsDisplay?: DurationFormatDisplayOption;
  }

  interface DurationFormatOptions {
    days?: Exclude<DurationFormatOption, '2-digit' | 'numeric'>;
    daysDisplay?: DurationFormatDisplayOption;
    fractionalDigits?: FractionalDigitsOption;
    hours?: DurationFormatOption;
    hoursDisplay?: DurationFormatDisplayOption;
    localeMatcher?: DurationTimeFormatLocaleMatcher;
    microseconds?: DurationFormatOption;
    microsecondsDisplay?: DurationFormatDisplayOption;
    milliseconds?: DurationFormatOption;
    millisecondsDisplay?: DurationFormatDisplayOption;
    minutes?: DurationFormatOption;
    minutesDisplay?: DurationFormatDisplayOption;
    months?: Exclude<DurationFormatOption, '2-digit' | 'numeric'>;
    monthsDisplay?: DurationFormatDisplayOption;
    nanosecond?: DurationFormatOption;
    nanosecondDisplay?: DurationFormatDisplayOption;
    numberingSystem?: DateTimeFormatOptions['numberingSystem'];
    seconds?: DurationFormatOption;
    secondsDisplay?: DurationFormatDisplayOption;
    style?: DurationFormatStyle;
    weeks?: Exclude<DurationFormatOption, '2-digit' | 'numeric'>;
    weeksDisplay?: DurationFormatDisplayOption;
    years?: Exclude<DurationFormatOption, '2-digit' | 'numeric'>;
    yearsDisplay?: DurationFormatDisplayOption;
  }

  /**
   * The duration object to be formatted
   *
   * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/format#duration).
   */
  type DurationType = Partial<Record<DurationTimeFormatUnit, number>>;

  interface DurationFormat {
    /**
     * @param duration The duration object to be formatted. It should include some or all of the following properties: months, weeks, days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds.
     *
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/format).
     */
    format(duration: DurationType): string;

    /**
     * @param duration The duration object to be formatted. It should include some or all of the following properties: months, weeks, days, hours, minutes, seconds, milliseconds, microseconds, nanoseconds.
     *
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/formatToParts).
     */
    formatToParts(duration: DurationType): DurationFormatPart[];

    /**
     * [MDN](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/resolvedOptions).
     */
    resolvedOptions(): ResolvedDurationFormatOptions;
  }

  const DurationFormat: {
    prototype: DurationFormat;

    /**
     * @param locales A string with a BCP 47 language tag, or an array of such strings.
     *   For the general form and interpretation of the `locales` argument, see the [Intl](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl#locale_identification_and_negotiation)
     *   page.
     *
     * @param options An object for setting up a duration format.
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/DurationFormat).
     */
    new (locales?: LocalesArgument, options?: DurationFormatOptions): DurationFormat;

    /**
     * Returns an array containing those of the provided locales that are supported in display names without having to fall back to the runtime's default locale.
     *
     * @param locales A string with a BCP 47 language tag, or an array of such strings.
     *   For the general form and interpretation of the `locales` argument, see the [Intl](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl#locale_identification_and_negotiation)
     *   page.
     *
     * @param options An object with a locale matcher.
     * @returns An array of strings representing a subset of the given locale tags that are supported in display names without having to fall back to the runtime's default locale.
     *
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/supportedLocalesOf).
     */
    supportedLocalesOf(
      locales?: LocalesArgument,
      options?: { localeMatcher?: DurationTimeFormatLocaleMatcher },
    ): UnicodeBCP47LocaleIdentifier[];
  };
}
