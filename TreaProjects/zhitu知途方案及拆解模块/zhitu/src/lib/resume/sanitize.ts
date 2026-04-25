/**
 * Privacy Sanitization for Resume Text
 * Removes sensitive personal information before processing
 */

/**
 * Sanitize resume text by removing sensitive personal information
 * Removes: phone numbers, ID numbers, email addresses
 * @param text - Raw resume text
 * @returns Sanitized text with personal info replaced
 */
export function sanitizeResume(text: string): string {
  let sanitized = text;

  // Remove phone numbers (various formats)
  // Chinese phone: 13812345678, 138-1234-5678, 138 1234 5678
  sanitized = sanitized.replace(/(?:1[3-9]\d[-]?\d{4}[-]?\d{4})/g, '[手机号]');

  // US/International phone formats
  sanitized = sanitized.replace(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[电话]');

  // Remove email addresses
  sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[邮箱]');

  // Remove Chinese ID numbers (18 digits)
  sanitized = sanitized.replace(/\b\d{17}[\dXx]\b/g, '[身份证号]');

  // Remove Chinese resident ID (various formats)
  sanitized = sanitized.replace(/(?:居民身份证|身份证)[:：]?\s*[^\s,，]{15,18}/gi, '[身份证]');

  // Remove passport numbers (general pattern)
  sanitized = sanitized.replace(/(?:护照|passport)[:：]?\s*[A-Za-z0-9]{6,}/gi, '[护照号]');

  // Remove bank card numbers (16-19 digits)
  sanitized = sanitized.replace(/\b\d{16,19}\b/g, '[银行卡号]');

  // Remove detailed addresses (Chinese pattern)
  sanitized = sanitized.replace(/(?:地址|address|住址)[:：]?\s*[^\n]{10,50}/gi, '[地址]');

  return sanitized;
}