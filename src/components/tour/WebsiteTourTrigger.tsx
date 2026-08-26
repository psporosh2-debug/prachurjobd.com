import React, { useState, useEffect } from 'react';
import { WebsiteTourModal } from './WebsiteTourModal';

const EVENT_NAME = 'prachurjo_start_website_tour';

/**
 * Global helper function to trigger website tour from anywhere
 */
export function startWebsiteTour() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
}

export function WebsiteTourTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  const [autoStarted, setAutoStarted] = useState(false);

  useEffect(() => {
    // 1. Auto launch on first visit
    if (typeof window !== 'undefined') {
      const tourCompleted = localStorage.getItem('prachurjo_tour_completed');
      if (!tourCompleted) {
        const timer = setTimeout(() => {
          setIsOpen(true);
          setAutoStarted(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  useEffect(() => {
    // 2. Listen to manual start events
    const handleStartEvent = () => {
      setIsOpen(true);
      setAutoStarted(false);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(EVENT_NAME, handleStartEvent);
      return () => window.removeEventListener(EVENT_NAME, handleStartEvent);
    }
  }, []);

  return (
    <WebsiteTourModal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      autoStarted={autoStarted}
    />
  );
}
