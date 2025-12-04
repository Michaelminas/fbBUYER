/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors from design context
        primary: '#2563EB', // Action Blue
        success: '#10B981', // Positive
        accent: '#4F46E5', // Trust/Info
        surface: '#F8FAFC', // Page background
        card: '#FFFFFF', // Containers
        heading: '#0F172A', // Headings
        body: '#334155', // Body text
        border: '#E2E8F0', // Borders/Lines
        danger: '#DC2626', // Errors
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'hero-mobile': ['28px', '1.3'],
        'hero-desktop': ['40px', '1.3'],
        'section-mobile': ['22px', '1.4'],
        'section-desktop': ['28px', '1.4'],
        'card-title': ['18px', '1.4'],
        'body': ['16px', '1.5'],
        'small': ['14px', '1.4'],
      },
      fontWeight: {
        headline: '600',
        button: '500',
        body: '400',
      },
      spacing: {
        '4': '4px',
        '8': '8px',
        '12': '12px',
        '16': '16px',
        '24': '24px',
        '32': '32px',
        '40': '40px',
        '48': '48px',
        '64': '64px',
      },
      borderRadius: {
        'brand': '12px',
        'brand-lg': '16px',
      },
      maxWidth: {
        'container': '1200px',
      },
      fontVariantNumeric: ['tabular-nums'],
    },
  },
  plugins: [],
}