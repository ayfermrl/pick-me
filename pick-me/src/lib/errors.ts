export function friendlyError(error: unknown, fallback = "İşlem tamamlanamadı. Lütfen tekrar dene.") {
  const message = error instanceof Error ? error.message : "";
  const lower = message.toLocaleLowerCase("tr-TR");

  if (!message) return fallback;
  if (lower.includes("failed to fetch") || lower.includes("network")) return "Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.";
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) return "E-posta veya şifre hatalı görünüyor.";
  if (lower.includes("already registered") || lower.includes("already exists")) return "Bu e-posta ile daha önce hesap oluşturulmuş.";
  if (lower.includes("row-level security") || lower.includes("permission")) return "Bu işlem için yetkin yok.";
  if (message.length > 140) return fallback;

  return message;
}
