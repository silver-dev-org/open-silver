export const sanitizeCompanyName = (name: string): string => {
  // Remove any HTML tags
  const withoutHtml = name.replace(/<[^>]*>/g, "");

  // Remove any potentially dangerous characters
  const sanitized = withoutHtml.replace(/[<>{}[\]\\]/g, "").trim();

  // Ensure the name is not empty and has a reasonable length
  if (!sanitized || sanitized.length < 2) {
    throw new Error("El nombre de la empresa debe tener al menos 2 caracteres");
  }

  if (sanitized.length > 100) {
    throw new Error("El nombre de la empresa debe ser menos de 100 caracteres");
  }

  return sanitized;
};
