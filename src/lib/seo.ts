// SEO optimization utilities and structured data generation
import { Metadata } from 'next';

export interface BusinessInfo {
  name: string;
  description: string;
  url: string;
  logo: string;
  telephone: string;
  email: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo: {
    latitude: number;
    longitude: number;
  };
  openingHours: string[];
  priceRange: string;
  paymentAccepted: string[];
  serviceArea: string[];
}

export const BUSINESS_INFO: BusinessInfo = {
  name: "Cash For Phones Today - Sydney",
  description: "Sydney's trusted iPhone buyer. Get instant quotes, free pickup, and cash on the spot for your iPhone. 7-day quote validity, same-day service available.",
  url: "https://sellphones.sydney",
  logo: "https://sellphones.sydney/logo.png",
  telephone: "+61415957027",
  email: "support@sellphones.sydney",
  address: {
    streetAddress: "Penrith",
    addressLocality: "Penrith", 
    addressRegion: "NSW",
    postalCode: "2750",
    addressCountry: "AU"
  },
  geo: {
    latitude: -33.7518,
    longitude: 150.3005
  },
  openingHours: [
    "Mo-Su 12:00-20:00"
  ],
  priceRange: "$50-$1500",
  paymentAccepted: ["Cash", "Bank Transfer"],
  serviceArea: [
    "Sydney",
    "Penrith", 
    "Blacktown",
    "Parramatta",
    "Liverpool",
    "Campbelltown",
    "Blue Mountains",
    "Camden"
  ]
};

// Generate LocalBusiness structured data
export function generateLocalBusinessSchema(business: BusinessInfo = BUSINESS_INFO) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": business.url,
    "name": business.name,
    "description": business.description,
    "url": business.url,
    "logo": business.logo,
    "image": [business.logo],
    "telephone": business.telephone,
    "email": business.email,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": business.address.streetAddress,
      "addressLocality": business.address.addressLocality,
      "addressRegion": business.address.addressRegion,
      "postalCode": business.address.postalCode,
      "addressCountry": business.address.addressCountry
    },
    "geo": {
      "@type": "GeoCoordinates", 
      "latitude": business.geo.latitude,
      "longitude": business.geo.longitude
    },
    "openingHours": business.openingHours,
    "priceRange": business.priceRange,
    "paymentAccepted": business.paymentAccepted,
    "areaServed": business.serviceArea.map(area => ({
      "@type": "City",
      "name": area
    })),
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "iPhone Buying Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "iPhone Buying Service",
            "description": "We buy your iPhone for cash with instant quotes and free pickup"
          }
        }
      ]
    },
    "potentialAction": {
      "@type": "TradeAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": business.url,
        "inLanguage": "en-AU"
      },
      "result": {
        "@type": "MonetaryAmount",
        "currency": "AUD",
        "minValue": 50,
        "maxValue": 1500
      }
    }
  };
}

// Generate FAQ structured data
export function generateFAQSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much can I get for my iPhone?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "iPhone values range from $50 to $1,500+ depending on model, storage, condition, and damage. Get an instant quote on our website for your specific device."
        }
      },
      {
        "@type": "Question", 
        "name": "How long is my quote valid?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "All quotes are valid for 7 days from creation. This gives you time to consider the offer and arrange pickup or drop-off."
        }
      },
      {
        "@type": "Question",
        "name": "Do you offer pickup service?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! We offer free pickup within 20km of Penrith. For longer distances, pickup fees range from $30-$50 depending on location."
        }
      },
      {
        "@type": "Question",
        "name": "What areas do you service?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We service all of Sydney including Penrith, Blacktown, Parramatta, Liverpool, Campbelltown, Blue Mountains, and Camden areas."
        }
      },
      {
        "@type": "Question",
        "name": "When do I get paid?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Payment is made immediately upon inspection and acceptance of your device. We pay cash on the spot or via instant bank transfer."
        }
      }
    ]
  };
}

// Generate BreadcrumbList structured data
export function generateBreadcrumbSchema(breadcrumbs: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };
}

// Generate Product schema for iPhone models
export function generateProductSchema(model: string, price: { min: number; max: number }) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `Sell ${model}`,
    "description": `Get cash for your ${model}. Instant quotes, free pickup, and immediate payment.`,
    "brand": {
      "@type": "Brand",
      "name": "Apple"
    },
    "category": "Electronics > Mobile Phones > Smartphones",
    "offers": {
      "@type": "Offer",
      "price": price.max,
      "lowPrice": price.min,
      "highPrice": price.max,
      "priceCurrency": "AUD",
      "priceValidUntil": new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": BUSINESS_INFO.name
      }
    }
  };
}

// Generate default page metadata
export function generatePageMetadata({
  title,
  description,
  keywords,
  canonical,
  image,
  noIndex = false
}: {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const fullTitle = title.includes(BUSINESS_INFO.name) ? title : `${title} | ${BUSINESS_INFO.name}`;
  const url = canonical || BUSINESS_INFO.url;
  const imageUrl = image || BUSINESS_INFO.logo;

  return {
    title: fullTitle,
    description,
    keywords: keywords?.join(', '),
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-snippet': 200,
        'max-image-preview': 'large',
        'max-video-preview': 30
      }
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: BUSINESS_INFO.name,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title
        }
      ],
      locale: 'en_AU',
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [imageUrl],
      creator: '@sellphones_syd'
    },
    alternates: {
      canonical: url
    },
    other: {
      'geo.region': 'AU-NSW',
      'geo.placename': 'Sydney',
      'geo.position': `${BUSINESS_INFO.geo.latitude},${BUSINESS_INFO.geo.longitude}`,
      'ICBM': `${BUSINESS_INFO.geo.latitude},${BUSINESS_INFO.geo.longitude}`
    }
  };
}

// Common SEO keywords for iPhone buying
export const SEO_KEYWORDS = {
  primary: [
    'sell iPhone Sydney',
    'cash for iPhone',
    'iPhone buyer Sydney',
    'sell phone Sydney',
    'iPhone pickup Sydney'
  ],
  secondary: [
    'instant iPhone quote',
    'free iPhone pickup',
    'cash for phones',
    'Sydney phone buyer',
    'sell mobile phone',
    'iPhone buying service',
    'same day phone pickup',
    'iPhone cash buyer'
  ],
  locations: [
    'Penrith iPhone buyer',
    'Blacktown sell iPhone', 
    'Parramatta phone buyer',
    'Liverpool iPhone pickup',
    'Campbelltown sell phone',
    'Blue Mountains phone buyer',
    'Camden iPhone buyer'
  ],
  models: [
    'sell iPhone 15',
    'sell iPhone 14',
    'sell iPhone 13',
    'sell iPhone 12',
    'sell iPhone 11',
    'sell iPhone Pro',
    'sell iPhone Pro Max'
  ]
};

// Generate sitemap data
export function generateSitemapData() {
  const baseUrl = BUSINESS_INFO.url;
  const now = new Date().toISOString();
  
  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 1.0
    },
    {
      url: `${baseUrl}/verify`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8
    },
    {
      url: `${baseUrl}/admin`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.3
    }
  ];
}

// Generate robots.txt content
export function generateRobotsTxt() {
  const baseUrl = BUSINESS_INFO.url;
  
  return `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /verify/
Disallow: /_next/

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1`;
}