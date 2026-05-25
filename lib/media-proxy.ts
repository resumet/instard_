export function proxiedMediaUrl(url?: string | null) {
  if (!url) return null;
  const normalized = url.replaceAll("&amp;", "&");
  if (!/^https?:\/\//i.test(normalized)) return null;
  return `/api/media/proxy?url=${encodeURIComponent(normalized)}`;
}
