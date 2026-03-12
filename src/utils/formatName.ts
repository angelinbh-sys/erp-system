/**
 * Formats a full name to show only first and last name.
 * Example: "Felipe Augusto da Silva Angelin" → "Felipe Angelin"
 */
export function formatFirstLastName(fullName: string | null | undefined): string {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 2) return fullName.trim();
  return `${parts[0]} ${parts[parts.length - 1]}`;
}
