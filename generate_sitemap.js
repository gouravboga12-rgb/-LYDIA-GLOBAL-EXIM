import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://lydiaglobalexim.com';
const TODAY = new Date().toISOString().split('T')[0];

const staticRoutes = [
  { url: '/', changefreq: 'daily', priority: '1.0' },
  { url: '/sale', changefreq: 'daily', priority: '0.9' },
  { url: '/offers', changefreq: 'daily', priority: '0.9' },
  { url: '/about', changefreq: 'monthly', priority: '0.8' },
  { url: '/contact', changefreq: 'monthly', priority: '0.8' },
  { url: '/jewelry-care', changefreq: 'monthly', priority: '0.7' },
  { url: '/shipping-policy', changefreq: 'monthly', priority: '0.6' },
  { url: '/returns-policy', changefreq: 'monthly', priority: '0.6' },
  { url: '/privacy-policy', changefreq: 'monthly', priority: '0.5' },
  { url: '/terms-of-service', changefreq: 'monthly', priority: '0.5' },
  { url: '/pickup', changefreq: 'weekly', priority: '0.7' },
];

function generateSitemap() {
  const categoriesPath = path.join(__dirname, 'src', 'data', 'categories.json');
  const productsPath = path.join(__dirname, 'src', 'data', 'products.json');

  let categories = [];
  let products = [];

  if (fs.existsSync(categoriesPath)) {
    try {
      categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
    } catch (e) {
      console.error('Failed to parse categories.json:', e);
    }
  }

  if (fs.existsSync(productsPath)) {
    try {
      products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    } catch (e) {
      console.error('Failed to parse products.json:', e);
    }
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  // Static routes
  for (const page of staticRoutes) {
    xml += `  <url>\n`;
    xml += `    <loc>${BASE_URL}${page.url}</loc>\n`;
    xml += `    <lastmod>${TODAY}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  // Category routes
  for (const cat of categories) {
    if (cat.id) {
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}/category/${cat.id}</loc>\n`;
      xml += `    <lastmod>${TODAY}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }
  }

  // Product routes
  for (const prod of products) {
    if (prod.id && prod.is_active !== false) {
      const prodDate = prod.created_at ? prod.created_at.split('T')[0] : TODAY;
      const primaryImage = prod.variants?.[0]?.images?.[0] || prod.image_url;
      xml += `  <url>\n`;
      xml += `    <loc>${BASE_URL}/product/${prod.id}</loc>\n`;
      xml += `    <lastmod>${prodDate}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      if (primaryImage && primaryImage.startsWith('http')) {
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${primaryImage.replace(/&/g, '&amp;')}</image:loc>\n`;
        xml += `      <image:title>${(prod.name || 'Jewelry Product').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</image:title>\n`;
        xml += `    </image:image>\n`;
      }
      xml += `  </url>\n`;
    }
  }

  xml += `</urlset>\n`;

  const outputPath = path.join(__dirname, 'public', 'sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf8');
  console.log(`Generated sitemap with ${staticRoutes.length + categories.length + products.length} URLs at ${outputPath}`);
}

generateSitemap();
