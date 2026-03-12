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

/**
 * Capitalizes each word in a name: first letter uppercase, rest lowercase.
 * Example: "JOÃO DA SILVA" → "João Da Silva"
 */
export function capitalizeName(name: string): string {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
