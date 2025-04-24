
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
}

const DEFAULT_TITLE = 'ZPL Easy – Gerador de ZPL em PDF';
const DEFAULT_DESCRIPTION = 'Converta ZPL em PDF, crie etiquetas em lote e integre via API. Teste grátis.';
const DEFAULT_IMAGE = '/og-image.png';
const BASE_URL = 'https://zpleasy.com';

export const SEO: React.FC<SEOProps> = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  type = 'website',
}) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const url = `${BASE_URL}${currentPath}`;
  
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);
    
    // Update canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', url);
    
    // Update Open Graph tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:url', url);
    updateMetaTag('og:image', `${BASE_URL}${image}`);
    updateMetaTag('og:type', type);
    
    // Update Twitter card tags
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', `${BASE_URL}${image}`);
    updateMetaTag('twitter:card', 'summary_large_image');
    
  }, [title, description, image, type, url]);
  
  const updateMetaTag = (name: string, content: string) => {
    let metaTag = document.querySelector(`meta[property="${name}"]`) || 
                  document.querySelector(`meta[name="${name}"]`);
    
    if (!metaTag) {
      metaTag = document.createElement('meta');
      // Twitter uses name attribute, OG uses property attribute
      if (name.startsWith('twitter:')) {
        metaTag.setAttribute('name', name);
      } else {
        metaTag.setAttribute('property', name);
      }
      document.head.appendChild(metaTag);
    }
    
    metaTag.setAttribute('content', content);
  };
  
  return null; // This component doesn't render anything visible
};
