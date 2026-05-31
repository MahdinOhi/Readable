import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const fetchArticleHtml = createServerFn({ method: "POST" })
  .inputValidator(z.object({ url: z.string().url() }))
  .handler(async ({ data }) => {
    const { url } = data;
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const text = await response.text();
      if (!text || text.length < 200) {
        throw new Error("Empty or invalid HTML response received from target site.");
      }

      return { html: text };
    } catch (error: any) {
      console.error(`Direct server fetch failed for ${url}:`, error);

      // Fallback to proxy
      try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const fallbackRes = await fetch(proxyUrl);
        if (!fallbackRes.ok) throw new Error(`Proxy fallback failed with status ${fallbackRes.status}`);
        const fallbackText = await fallbackRes.text();
        if (fallbackText && fallbackText.length > 200) {
          return { html: fallbackText };
        }
      } catch (proxyErr) {
        console.error(`Fallback proxy fetch also failed for ${url}:`, proxyErr);
      }
      throw new Error(`Failed to fetch article content: ${error.message || "Unknown error"}`);
    }
  });
