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
    const revealAll = () => {
      const elements = document.querySelectorAll(
        '.reveal-on-scroll, .reveal-on-scroll-left, .reveal-on-scroll-right, .reveal-on-scroll-scale, .animate-section, [data-reveal]'
      );
      elements.forEach((el) => el.classList.add('is-revealed'));
    };

    // Immediately reveal on route change
    revealAll();
    const t1 = setTimeout(revealAll, 50);
    const t2 = setTimeout(revealAll, 200);

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
      rootMargin: '50px 0px 50px 0px',
      threshold: 0.01,
    });

    const initObserver = () => {
      const elements = document.querySelectorAll(
        '.reveal-on-scroll, .reveal-on-scroll-left, .reveal-on-scroll-right, .reveal-on-scroll-scale, .animate-section, [data-reveal]'
      );

      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 100 && rect.bottom > -100) {
          el.classList.add('is-revealed');
        } else {
          observer.observe(el);
        }
      });
    };

    initObserver();

    // Mutation observer for dynamically loaded items (like products)
    const mutationObserver = new MutationObserver(() => {
      initObserver();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [location.pathname, location.search]);

  return <>{children}</>;
}
