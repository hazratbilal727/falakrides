export function isCloudinaryImage(value: string) {
  return value.length <= 2000 && !value.includes("..") && /^https:\/\/res\.cloudinary\.com\/[a-zA-Z0-9_-]+\/image\/upload\/(?:[a-zA-Z0-9_./,!-]|%[0-9a-fA-F]{2})+$/.test(value);
}
