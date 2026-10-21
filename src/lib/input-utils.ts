/**
 * High-performance numeric input sanitization utilities.
 * Solves the classic React controlled number input leading-zero bug (e.g. typing 20 into a 0 input resulting in '020').
 */

export interface NumericSanitizeOptions {
  min?: number;
  max?: number;
  allowDecimals?: boolean;
  defaultValue?: number;
}

/**
 * Strips accidental leading zeroes (e.g. '020' -> '20', '005' -> '5')
 * while preserving valid single zero '0' or decimals '0.5'.
 * Also clamps to min/max boundaries if specified.
 */
export function sanitizeNumericInput(
  rawInput: string,
  options?: NumericSanitizeOptions
): { cleanedString: string; stringValue: string; numericValue: number } {
  let cleaned = rawInput.trim();

  // Strip leading zeroes before digits: "020" -> "20", "005" -> "5"
  if (/^0+[0-9]/.test(cleaned)) {
    cleaned = cleaned.replace(/^0+(?=\d)/, '');
  }

  // Handle multiple zeroes: "00" -> "0"
  if (/^0+$/.test(cleaned)) {
    cleaned = '0';
  }

  const parsed = options?.allowDecimals ? parseFloat(cleaned) : parseFloat(cleaned);
  let num = isNaN(parsed) ? (options?.defaultValue ?? 0) : parsed;

  if (options?.min !== undefined && num < options.min) {
    num = options.min;
    cleaned = String(options.min);
  }
  if (options?.max !== undefined && num > options.max) {
    num = options.max;
    cleaned = String(options.max);
  }

  return {
    cleanedString: cleaned,
    stringValue: cleaned,
    numericValue: num,
  };
}

/**
 * Standard focus handler that automatically selects all text in a number input.
 * Allows instant replacement without appending after '0' or having to manual backspace.
 */
export function handleNumberInputFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.target.select();
}
