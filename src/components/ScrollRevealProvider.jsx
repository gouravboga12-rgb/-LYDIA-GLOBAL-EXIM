import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Universal Scroll Reveal Component
 * Automatically observes elements marked with .reveal-on-scroll, .animate-section, [data-reveal]
 * and triggers smooth entrance animations as user scrolls down on any page.
 */
export function ScrollRevealProvider({ children }) {
  const location = useLocation();

  useEffect(() => {
    const observerCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.08,
    });

    const initObserver = () => {
      const elements = document.querySelectorAll(
        '.reveal-on-scroll, .reveal-on-scroll-left, .reveal-on-scroll-right, .reveal-on-scroll-scale, .animate-section, [data-reveal]'
      );

      elements.forEach((el) => {
        // If element is already in the upper viewport on mount/page load, reveal it immediately
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('is-revealed');
        } else {
          observer.observe(el);
        }
      });
    };

    // Run after DOM paint
    const timer = setTimeout(initObserver, 80);

    // Mutation observer for dynamically loaded items (like products)
    const mutationObserver = new MutationObserver(() => {
      initObserver();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [location.pathname, location.search]);

  return <>{children}</>;
}
