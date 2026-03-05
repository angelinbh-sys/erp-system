export function formatCurrencyBRL(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const number = parseInt(digits, 10) / 100;
  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function parseCurrencyBRL(formatted: string): string {
  return formatted.replace(/\D/g, "");
}
