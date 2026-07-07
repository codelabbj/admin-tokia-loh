/** Déduit le type média à partir de l'URL du fichier. */
export function getMediaFileType(url = "") {
  if (!url) return "file";
  const lower = url.toLowerCase();
  if (/\.(jpg|jpeg|png|gif|webp|svg|avif)/.test(lower)) return "image";
  if (/\.(mp4|webm|ogg|mov|avi|mkv)/.test(lower)) return "video";
  return "file";
}
