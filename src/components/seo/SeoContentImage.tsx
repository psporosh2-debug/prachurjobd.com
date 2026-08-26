export function SeoContentImage() {
  return (
    <section
      className="mt-12 pt-10 border-t space-y-10 text-sm leading-relaxed"
      aria-labelledby="img-guide-heading"
    >
      {/* How to Use */}
      <article>
        <h2
          id="img-guide-heading"
          className="text-xl font-bold tracking-tight mb-4 text-foreground"
        >
          How to Compress &amp; Convert Images Online — Step-by-Step Guide
        </h2>
        <p className="text-muted-foreground mb-4">
          Prachurjo's Image Converter &amp; Compressor lets you reduce image file
          size and convert formats directly in your browser — no software to
          install, no files uploaded to servers, and no quality compromise.
        </p>

        <h3 className="font-semibold text-foreground mb-2">
          Step-by-Step Instructions
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground pl-2">
          <li>
            Drag and drop your image onto the upload area, or click{" "}
            <strong className="text-foreground">Browse</strong> to select a
            file. Supported formats: JPG, PNG, WebP, GIF.
          </li>
          <li>
            Choose your{" "}
            <strong className="text-foreground">output format</strong>: WebP
            (recommended for web), JPG (universal compatibility), or PNG
            (lossless with transparency).
          </li>
          <li>
            Adjust the{" "}
            <strong className="text-foreground">Quality slider</strong>{" "}
            (10–100%). A value of 75–85% provides the best balance of file size
            and visual quality for most images. Quality is disabled for PNG
            since PNG compression is lossless.
          </li>
          <li>
            Click{" "}
            <strong className="text-foreground">Convert Image</strong>. The
            browser processes the image using the HTML5 Canvas API — typically
            under one second for most photos.
          </li>
          <li>
            Review the before/after comparison showing original size, compressed
            size, and percentage reduction. Click{" "}
            <strong className="text-foreground">Download</strong> to save the
            result.
          </li>
        </ol>

        <h3 className="font-semibold text-foreground mt-6 mb-2">
          Tips for Best Results
        </h3>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-2">
          <li>
            For website images, convert to{" "}
            <strong className="text-foreground">WebP at 80% quality</strong> —
            typically 30–50% smaller than the original JPEG.
          </li>
          <li>
            For logos and graphics with transparency, choose{" "}
            <strong className="text-foreground">PNG or WebP</strong> to
            preserve transparent areas.
          </li>
          <li>
            For photography on social media, use{" "}
            <strong className="text-foreground">JPG at 85%</strong> for
            broad compatibility.
          </li>
          <li>
            If the compressed file is larger than the original, try a lower
            quality setting — some images (especially already-compressed JPEGs)
            benefit from values below 70%.
          </li>
        </ul>
      </article>

      {/* Deep Dive — WebP SEO */}
      <article>
        <h2 className="text-xl font-bold tracking-tight mb-4 text-foreground">
          Why WebP is Better for SEO &amp; Website Speed
        </h2>
        <p className="text-muted-foreground mb-4">
          Google's PageSpeed Insights and Core Web Vitals directly penalise
          websites that serve oversized images. Converting to WebP is one of
          the highest-impact, lowest-effort SEO improvements any website owner
          can make.
        </p>

        <h3 className="font-semibold text-foreground mb-2">
          WebP vs. JPEG vs. PNG — The Numbers
        </h3>
        <div className="overflow-x-auto rounded-lg border border-border mb-4">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left px-4 py-2.5 text-foreground font-semibold">Format</th>
                <th className="text-left px-4 py-2.5 text-foreground font-semibold">Avg Size</th>
                <th className="text-left px-4 py-2.5 text-foreground font-semibold">Transparency</th>
                <th className="text-left px-4 py-2.5 text-foreground font-semibold">Browser Support</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-border/50">
                <td className="px-4 py-2.5 text-emerald-500 font-semibold">WebP</td>
                <td className="px-4 py-2.5">Smallest</td>
                <td className="px-4 py-2.5">Yes</td>
                <td className="px-4 py-2.5">97%+ (Chrome, Safari 14+, Firefox, Edge)</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="px-4 py-2.5">JPEG</td>
                <td className="px-4 py-2.5">Medium</td>
                <td className="px-4 py-2.5">No</td>
                <td className="px-4 py-2.5">100% (Universal)</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5">PNG</td>
                <td className="px-4 py-2.5">Largest</td>
                <td className="px-4 py-2.5">Yes</td>
                <td className="px-4 py-2.5">100% (Universal)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="font-semibold text-foreground mb-2">
          How WebP Improves Your Google Rankings
        </h3>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-2">
          <li>
            <strong className="text-foreground">Faster LCP (Largest Contentful Paint):</strong>{" "}
            Hero images and blog thumbnails load faster, directly improving
            your Core Web Vitals score — a confirmed Google ranking factor.
          </li>
          <li>
            <strong className="text-foreground">Lower Cumulative Layout Shift (CLS):</strong>{" "}
            Smaller files load and render faster, reducing the time during
            which layout shifts can occur.
          </li>
          <li>
            <strong className="text-foreground">Reduced bandwidth costs:</strong>{" "}
            Smaller images mean lower hosting bandwidth consumption — critical
            for high-traffic sites.
          </li>
          <li>
            <strong className="text-foreground">Better mobile experience:</strong>{" "}
            Google's mobile-first indexing rewards pages that load fast on
            3G/4G connections, where image size is the primary bottleneck.
          </li>
          <li>
            <strong className="text-foreground">PageSpeed Insights compliance:</strong>{" "}
            Google's PageSpeed tool explicitly recommends "Serve images in
            next-gen formats" — switching to WebP directly resolves this
            recommendation.
          </li>
        </ul>
      </article>
    </section>
  );
}
