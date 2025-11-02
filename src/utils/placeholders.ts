export type PlaceholderMap = { index: number; code: string }[];

/**
 * Very small interpolation helper to replace {{0}}, {{1}} with provided values.
 * If value is undefined, leaves the token as is.
 */
export function interpolate(template: string, values: Record<string, any>): string {
  return template.replace(/\{\{(\d+)\}\}/g, (_m, p1) => {
    const key = `p${p1}`;
    const val = values[key];
    return val == null ? `{{${p1}}}` : String(val);
  });
}

/**
 * Convert an array of string and placeholder React nodes back into a string by simple join.
 * For now we return string; a richer version could return React nodes array to avoid HTML issues.
 */
export function format(template: string, values: Record<string, any>): string {
  return interpolate(template, values);
}

