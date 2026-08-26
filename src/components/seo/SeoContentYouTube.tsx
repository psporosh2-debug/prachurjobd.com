export function SeoContentYouTube() {
  return (
    <section
      className="mt-12 pt-10 border-t space-y-10 text-sm leading-relaxed"
      aria-labelledby="yt-guide-heading"
    >
      {/* How to Use */}
      <article>
        <h2
          id="yt-guide-heading"
          className="text-xl font-bold tracking-tight mb-4 text-foreground"
        >
          How to Download YouTube Thumbnails — Complete Guide
        </h2>
        <p className="text-muted-foreground mb-4">
          Prachurjo's YouTube Thumbnail Downloader is the fastest way to save any
          YouTube video's cover image in the highest possible quality — no
          browser extension, no account, and no limits.
        </p>

        <h3 className="font-semibold text-foreground mb-2">
          Step-by-Step Instructions
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground pl-2">
          <li>
            Open YouTube and navigate to the video whose thumbnail you want to
            download.
          </li>
          <li>
            Copy the URL from your browser's address bar (or use the Share
            button and copy the short link).
          </li>
          <li>
            Paste the URL into the input field on this page. The tool
            automatically detects the video ID using pattern matching — no
            manual ID extraction needed.
          </li>
          <li>
            Four thumbnail cards will appear instantly:{" "}
            <strong className="text-foreground">Max Resolution</strong> (1280×720),{" "}
            <strong className="text-foreground">High Quality</strong> (480×360),{" "}
            <strong className="text-foreground">Medium Quality</strong> (320×180), and{" "}
            <strong className="text-foreground">Standard Quality</strong>{" "}
            (640×480).
          </li>
          <li>
            Click{" "}
            <strong className="text-foreground">Download Image</strong> on
            the resolution you need. The image is saved directly to your
            device as a .jpg file.
          </li>
        </ol>

        <h3 className="font-semibold text-foreground mt-6 mb-2">
          Supported YouTube URL Formats
        </h3>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground pl-2 font-mono text-xs">
          <li>https://www.youtube.com/watch?v=VIDEO_ID</li>
          <li>https://youtu.be/VIDEO_ID</li>
          <li>https://www.youtube.com/shorts/VIDEO_ID</li>
          <li>https://www.youtube.com/embed/VIDEO_ID</li>
        </ul>
      </article>

      {/* Deep Dive */}
      <article>
        <h2 className="text-xl font-bold tracking-tight mb-4 text-foreground">
          Why Downloading HD YouTube Thumbnails Matters for Creators
        </h2>
        <p className="text-muted-foreground mb-4">
          A YouTube thumbnail is the single most important factor in a video's
          click-through rate (CTR). Studies show that custom thumbnails can
          increase CTR by up to 30% compared to auto-generated frames.
          Understanding how to work with thumbnail assets directly impacts your
          channel growth.
        </p>

        <h3 className="font-semibold text-foreground mb-2">
          Key Use Cases for Thumbnail Downloads
        </h3>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-2">
          <li>
            <strong className="text-foreground">A/B testing inspiration:</strong>{" "}
            Research top-performing thumbnails in your niche to understand what
            drives clicks — color palettes, text placement, face expressions.
          </li>
          <li>
            <strong className="text-foreground">Content repurposing:</strong>{" "}
            Use your own video thumbnails in blog posts, email newsletters,
            Twitter cards, and LinkedIn updates to drive traffic back to your
            YouTube content.
          </li>
          <li>
            <strong className="text-foreground">Backup &amp; archiving:</strong>{" "}
            Download your own thumbnails as backups before channel migrations or
            re-uploads.
          </li>
          <li>
            <strong className="text-foreground">Cross-promotion:</strong>{" "}
            Feature partner or collaborator video thumbnails in your own
            community posts and promotional material.
          </li>
          <li>
            <strong className="text-foreground">Template reference:</strong>{" "}
            Use high-resolution thumbnails as reference images when designing
            new thumbnails in Canva, Photoshop, or Figma.
          </li>
        </ul>

        <h3 className="font-semibold text-foreground mt-6 mb-2">
          What is the Maximum YouTube Thumbnail Resolution?
        </h3>
        <p className="text-muted-foreground">
          YouTube's highest available thumbnail resolution is{" "}
          <strong className="text-foreground">1280×720 pixels</strong> (HD,
          16:9 aspect ratio), stored as the <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">maxresdefault.jpg</code>{" "}
          file on YouTube's image CDN. Not all videos have this resolution
          available — older or lower-quality videos may fall back to{" "}
          <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">hqdefault.jpg</code>{" "}
          (480×360). Prachurjo handles this automatically, gracefully falling back
          to the best available quality when the max resolution image doesn't
          exist.
        </p>
      </article>
    </section>
  );
}
