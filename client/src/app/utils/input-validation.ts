export const VALIDATION_LIMITS = {
  fullName: 80,
  email: 254,
  registrationPassword: 15,
  passwordBytes: 72,
  biography: 160,
  post: 500,
  comment: 500,
} as const;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const utf8ByteLength = (value: string): number => new TextEncoder().encode(value).byteLength;
