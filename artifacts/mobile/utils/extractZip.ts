export function extractZipFromAddress(jobAddress?: string, settingsZip?: string): string | null {
  const addressMatch = (jobAddress || "").match(/\b(\d{5})\b/);
  if (addressMatch) return addressMatch[1];

  const settingsMatch = (settingsZip || "").match(/\b(\d{5})\b/);
  if (settingsMatch) return settingsMatch[1];

  return null;
}
