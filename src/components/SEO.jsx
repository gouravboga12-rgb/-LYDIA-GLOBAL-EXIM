import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_TITLE = 'LYDIA GLOBAL EXIM | Premium Handcrafted Indian Jewelry & Global Export';
const DEFAULT_DESC = 'Explore our exquisite collection of premium handcrafted jewelry, bridal kundan, anti-tarnish gold pieces, necklaces, bangles, and accessories at Lydia Global Exim. Worldwide shipping with trusted quality.';
const DEFAULT_KEYWORDS = 'Lydia Global Exim, indian jewelry export, handcrafted jewelry, bridal kundan jewelry, anti tarnish jewelry, gold plated necklaces, rings, bangles, earrings, imitation jewelry online, luxury jewelry India, worldwide jewelry shipping';
const SITE_URL = 'https://lydiaglobalexim.com';
const DEFAULT_IMAGE = 'https://lydiaglobalexim.com/image.png';

export function SEO({
  title,
  description = DEFAULT_DESC,
  keywords = DEFAULT_KEYWORDS,
  image = DEFAULT_IMAGE,
  type = 'website',
  canonicalUrl,
  schema,
  noIndex = false,
}) {
  const location = useLocation();

  useEffect(() => {
    // 1. Title
    const formattedTitle = title 
      ? (title.includes('Lydia Global Exim') ? title : `${title} | Lydia Global Exim`)
      : DEFAULT_TITLE;
    document.title = formattedTitle;

    // Helper to update or create meta tag
    const setMetaTag = (attrName, attrValue, content) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content || '');
    };

    // 2. Standard Meta Tags
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywords);
    setMetaTag('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

    // 3. Canonical Link
    const currentCanonical = canonicalUrl || `${SITE_URL}${location.pathname}`;
    let canonicalElement = document.querySelector('link[rel="canonical"]');
    if (!canonicalElement) {
      canonicalElement = document.createElement('link');
      canonicalElement.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalElement);
    }
    canonicalElement.setAttribute('href', currentCanonical);

    // 4. Open Graph Tags
    const fullImageUrl = image.startsWith('http') ? image : `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`;
    setMetaTag('property', 'og:title', formattedTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:image', fullImageUrl);
    setMetaTag('property', 'og:url', currentCanonical);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:site_name', 'Lydia Global Exim');
    setMetaTag('property', 'og:locale', 'en_US');

    // 5. Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', formattedTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', fullImageUrl);

    // 6. JSON-LD Structured Data
    let schemaScript = document.getElementById('seo-json-ld');
    if (schema) {
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.id = 'seo-json-ld';
        schemaScript.type = 'application/ld+json';
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(schema);
    } else if (schemaScript) {
      schemaScript.remove();
    }

    return () => {
      // Clean up dynamic schema when unmounting page
      const currentSchema = document.getElementById('seo-json-ld');
      if (currentSchema) {
        currentSchema.remove();
      }
    };
  }, [title, description, keywords, image, type, canonicalUrl, schema, noIndex, location.pathname]);

  return null;
}
