export function SeoContentText() {
  return (
    <section
      className="mt-12 pt-10 border-t space-y-10 text-sm leading-relaxed"
      aria-labelledby="text-guide-heading"
    >
      <article>
        <h2
          id="text-guide-heading"
          className="text-xl font-bold tracking-tight mb-4 text-foreground"
        >
          How to Use the Text Case Converter — Complete Guide
        </h2>
        <p className="text-muted-foreground mb-4">
          Prachurjo's Text Case Converter is a professional-grade text
          transformation tool built for developers, copywriters, content
          managers, and students. Convert any text between 9 different formats
          instantly — no formatting lost, no character limits, and no data
          sent to servers.
        </p>

        <h3 className="font-semibold text-foreground mb-2">
          Step-by-Step Instructions
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-muted-foreground pl-2">
          <li>
            Type or paste your text into the large input area. Live statistics
            update in real time — word count, character count, characters
            without spaces, sentence count, and paragraph count.
          </li>
          <li>
            Click any transformation button in the toolbar to instantly convert
            the text. The transformation is applied directly to your content.
          </li>
          <li>
            Made a mistake? Click the{" "}
            <strong className="text-foreground">Undo</strong> button (or press
            the undo icon) to revert to any of the last 50 states.
          </li>
          <li>
            When satisfied, click{" "}
            <strong className="text-foreground">Copy Text</strong> to copy the
            full result to your clipboard. A visual confirmation confirms the
            copy was successful.
          </li>
        </ol>

        <h3 className="font-semibold text-foreground mt-6 mb-2">
          All Available Text Transformations
        </h3>
        <ul className="space-y-3 text-muted-foreground pl-2">
          {[
            { label: "UPPERCASE", desc: "Converts every letter to capitals. Ideal for headings, labels, and emphasis text.", example: "hello world → HELLO WORLD" },
            { label: "lowercase", desc: "Converts every letter to lower case. Great for normalizing data and fixing accidental caps lock.", example: "HELLO WORLD → hello world" },
            { label: "Title Case", desc: "Capitalizes the first letter of every word. Perfect for blog post titles, product names, and headings.", example: "the quick fox → The Quick Fox" },
            { label: "Sentence case", desc: "Capitalizes only the first word of each sentence. Standard for body text and paragraphs.", example: "hello. world. → Hello. World." },
            { label: "camelCase", desc: "Removes spaces and capitalizes each word after the first. The standard naming convention in JavaScript and Java.", example: "hello world → helloWorld" },
            { label: "snake_case", desc: "Joins words with underscores in all lowercase. Standard in Python, database column names, and file naming.", example: "Hello World → hello_world" },
            { label: "kebab-case", desc: "Joins words with hyphens in all lowercase. Used in CSS classes, HTML attributes, and URL slugs.", example: "Hello World → hello-world" },
            { label: "Clean Spaces", desc: "Collapses multiple consecutive spaces, tabs, and line breaks into a single space.", example: "hello   world → hello world" },
            { label: "Reverse Text", desc: "Reverses the order of every character in the text. Useful for encoding, creative effects, and testing.", example: "hello → olleh" },
          ].map(({ label, desc, example }) => (
            <li key={label} className="flex flex-col gap-0.5">
              <span className="font-semibold text-foreground font-mono text-xs">{label}</span>
              <span>{desc}</span>
              <span className="font-mono text-xs text-primary/70">{example}</span>
            </li>
          ))}
        </ul>

        <h3 className="font-semibold text-foreground mt-6 mb-2">
          Common Use Cases
        </h3>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-2">
          <li>
            <strong className="text-foreground">Developers:</strong> Quickly
            convert variable names or API field names between camelCase,
            snake_case, and kebab-case when switching languages or frameworks.
          </li>
          <li>
            <strong className="text-foreground">Copywriters &amp; editors:</strong>{" "}
            Fix mixed-case pasted text from PDFs, presentations, or emails in
            one click.
          </li>
          <li>
            <strong className="text-foreground">SEO specialists:</strong>{" "}
            Count characters and words to ensure meta titles stay under 60
            characters and meta descriptions stay under 160 characters.
          </li>
          <li>
            <strong className="text-foreground">Students:</strong> Quickly
            reformat essay headings, clean up lecture notes, or normalize data
            for reports.
          </li>
          <li>
            <strong className="text-foreground">Data analysts:</strong>{" "}
            Normalize column headers and field names for consistency across
            datasets.
          </li>
        </ul>
      </article>
    </section>
  );
}
