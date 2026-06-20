const ALLOWED_ATTACHMENT_HOSTS = new Set([
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
]);

export function sanitizePlainText(input: string, maxLength = 2000): string {
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

export function sanitizeEmail(input: string): string {
  return sanitizePlainText(input, 254).toLowerCase();
}

export function sanitizePhone(input: string): string {
  return sanitizePlainText(input, 30).replace(/[^0-9+\-()\s]/g, '');
}

export function sanitizeFileName(input: string): string {
  const noPath = input.replace(/[\\/]/g, '_');
  return noPath.replace(/[^\p{L}\p{N}._-]/gu, '_').slice(0, 120);
}

export function isSafeAttachmentUrl(input: string): boolean {
  try {
    const url = new URL(input);
    if (url.protocol !== 'https:') return false;
    return ALLOWED_ATTACHMENT_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}
