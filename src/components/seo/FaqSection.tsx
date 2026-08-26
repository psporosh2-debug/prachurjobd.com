import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const faqs = [
  {
    question: "Is Prachurjo Tools completely free to use?",
    answer:
      "Yes — 100% free, forever. No subscription, no sign-up, no hidden fees. All three tools (YouTube Thumbnail Downloader, Image Converter, and Text Case Converter) run entirely in your browser at zero cost.",
  },
  {
    question: "How do I download a 1080p YouTube thumbnail?",
    answer:
      "Paste any YouTube video URL into the Thumbnail Downloader. Prachurjo instantly extracts the video ID and shows all available resolutions — including Max Resolution (up to 1280×720). Click Download on the resolution you want. The image downloads directly to your device from YouTube's CDN — no server involved.",
  },
  {
    question: "Does compressing images reduce quality?",
    answer:
      "At 70–85% quality, compression is visually imperceptible for most images. Prachurjo lets you choose your own quality level (10–100%). Converting to WebP typically produces files 25–35% smaller than JPEG at the same perceived quality — making it the best format for web performance.",
  },
  {
    question: "Does Prachurjo upload my images to a server?",
    answer:
      "Never. All image processing happens inside your browser using the HTML5 Canvas API. Your files never leave your device. This means your images stay completely private and the tool works even offline once the page is loaded.",
  },
  {
    question: "Why should I convert images to WebP format?",
    answer:
      "WebP is Google's next-generation image format — it delivers 25–35% smaller files than JPEG and up to 50% smaller than PNG at comparable quality. Smaller images mean faster page load times, better Core Web Vitals (LCP) scores, lower bandwidth costs, and higher Google rankings. WebP also supports transparency and animation, making it suitable for every web use case.",
  },
  {
    question: "What YouTube URL formats are supported?",
    answer:
      "All major formats are supported: standard URLs (youtube.com/watch?v=ID), short URLs (youtu.be/ID), YouTube Shorts (youtube.com/shorts/ID), and embed URLs (youtube.com/embed/ID). Just paste any format and thumbnails appear instantly.",
  },
  {
    question: "Can I instantly convert UPPERCASE text to lowercase?",
    answer:
      "Yes! The Text Case Converter supports instant one-click conversions between UPPERCASE, lowercase, Title Case, Sentence case, camelCase, snake_case, and kebab-case. Paste your text, click any transformation button, and the result is immediate. Undo up to 50 steps and copy to clipboard with one click.",
  },
];

function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
  index,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
  key?: React.Key;
}) {
  return (
    <div
      className="border border-border rounded-lg overflow-hidden"
      itemScope
      itemType="https://schema.org/Question"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left bg-card hover:bg-muted/30 transition-colors gap-4"
        aria-expanded={isOpen}
        data-testid={`faq-question-${index}`}
      >
        <h3
          className="font-semibold text-foreground text-sm md:text-base"
          itemProp="name"
        >
          {question}
        </h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-muted-foreground"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            itemScope
            itemType="https://schema.org/Answer"
            itemProp="acceptedAnswer"
          >
            <div className="px-5 pb-5 pt-0 bg-card/50">
              <p
                className="text-muted-foreground text-sm leading-relaxed"
                itemProp="text"
              >
                {answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      className="mt-12 pt-10 border-t"
      aria-labelledby="faq-heading"
      itemScope
      itemType="https://schema.org/FAQPage"
    >
      <div className="mb-6">
        <h2
          id="faq-heading"
          className="text-2xl font-bold tracking-tight"
        >
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Everything you need to know about Prachurjo Tools.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => (
          <FaqItem
            key={idx}
            index={idx}
            question={faq.question}
            answer={faq.answer}
            isOpen={openIndex === idx}
            onToggle={() => setOpenIndex(openIndex === idx ? null : idx)}
          />
        ))}
      </div>
    </section>
  );
}
