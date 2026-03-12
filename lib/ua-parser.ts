export type ParsedUA = {
  device: "mobile" | "tablet" | "desktop";
  browser: string;
  os: string;
};

/**
 * Lightweight User-Agent parser — no external dependency.
 * Covers the vast majority of real-world traffic.
 */
export function parseUA(ua: string): ParsedUA {
  const device =
    /mobile|iphone|ipod|windows phone|android.*mobile/i.test(ua)
      ? "mobile"
      : /tablet|ipad|android(?!.*mobile)/i.test(ua)
      ? "tablet"
      : "desktop";

  const browser =
    /edg\//i.test(ua)
      ? "Edge"
      : /opr\/|opera/i.test(ua)
      ? "Opera"
      : /chrome|crios/i.test(ua)
      ? "Chrome"
      : /firefox|fxios/i.test(ua)
      ? "Firefox"
      : /safari/i.test(ua)
      ? "Safari"
      : "Other";

  const os =
    /windows nt/i.test(ua)
      ? "Windows"
      : /iphone|ipad|ipod/i.test(ua)
      ? "iOS"
      : /android/i.test(ua)
      ? "Android"
      : /macintosh|mac os x/i.test(ua)
      ? "macOS"
      : /linux/i.test(ua)
      ? "Linux"
      : "Other";

  return { device, browser, os };
}
