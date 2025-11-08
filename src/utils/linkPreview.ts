/**
 * Link Preview Utility
 * 
 * Detects URLs in text and fetches metadata (title, description, image, etc.)
 */

export interface LinkPreviewData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
}

/**
 * Extract URLs from text
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches || [];
}

/**
 * Check if text contains URLs
 */
export function hasUrls(text: string): boolean {
  return extractUrls(text).length > 0;
}

/**
 * Get the first URL from text
 */
export function getFirstUrl(text: string): string | null {
  const urls = extractUrls(text);
  return urls.length > 0 ? urls[0] : null;
}

/**
 * Fetch link preview data from URL
 * Note: In production, this should use a backend API or service like
 * LinkPreview.io, Microlink.io, or similar for better CORS handling
 */
export async function fetchLinkPreview(url: string): Promise<LinkPreviewData | null> {
  try {
    // In a real implementation, this would call a backend API
    // For now, return basic data structure
    return {
      url,
      title: new URL(url).hostname,
      description: undefined,
      image: undefined,
      siteName: new URL(url).hostname,
      favicon: `https://${new URL(url).hostname}/favicon.ico`,
    };
  } catch (error) {
    console.error('Error fetching link preview:', error);
    return null;
  }
}

/**
 * Parse message text and extract link previews
 */
export async function parseMessageForLinks(text: string): Promise<LinkPreviewData[]> {
  const urls = extractUrls(text);
  const previews: LinkPreviewData[] = [];

  for (const url of urls) {
    try {
      const preview = await fetchLinkPreview(url);
      if (preview) {
        previews.push(preview);
      }
    } catch (error) {
      console.error(`Error fetching preview for ${url}:`, error);
    }
  }

  return previews;
}







