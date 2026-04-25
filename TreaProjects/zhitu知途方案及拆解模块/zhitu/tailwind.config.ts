import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary
        'near-black': '#141413',
        terracotta: '#c96442',
        coral: '#d97757',

        // Semantic
        'error-crimson': '#b53333',
        'focus-blue': '#3898ec',
        success: '#6b8f5e',
        warning: '#c49a3c',
        info: '#5e8d8d',

        // Surface & Background
        parchment: '#f5f4ed',
        ivory: '#faf9f5',
        'pure-white': '#ffffff',
        'warm-sand': '#e8e6dc',
        'dark-surface': '#30302e',

        // Neutrals & Text
        'charcoal-warm': '#4d4c48',
        'olive-gray': '#5e5d59',
        'stone-gray': '#87867f',
        'dark-warm': '#3d3d3a',
        'warm-silver': '#b0aea5',

        // Border & Ring
        'border-cream': '#f0eee6',
        'border-warm': '#e8e6dc',
        'border-dark': '#30302e',
        'ring-warm': '#d1cfc5',
        'ring-subtle': '#dedc01',
        'ring-deep': '#c2c0b6',
      },

      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'Arial', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },

      fontSize: {
        'display': ['4rem', { lineHeight: '1.10', fontWeight: '500' }],
        'heading-1': ['3.25rem', { lineHeight: '1.20', fontWeight: '500' }],
        'heading-2': ['2.3rem', { lineHeight: '1.30', fontWeight: '500' }],
        'heading-3': ['2rem', { lineHeight: '1.10', fontWeight: '500' }],
        'heading-4': ['1.6rem', { lineHeight: '1.20', fontWeight: '500' }],
        'heading-5': ['1.3rem', { lineHeight: '1.20', fontWeight: '500' }],
        'body-serif': ['1.06rem', { lineHeight: '1.60', fontWeight: '400' }],
        'body-lg': ['1.25rem', { lineHeight: '1.60', fontWeight: '400' }],
        'body': ['1rem', { lineHeight: '1.60', fontWeight: '400' }],
        'body-sm': ['0.94rem', { lineHeight: '1.60', fontWeight: '400' }],
        'caption': ['0.88rem', { lineHeight: '1.43', fontWeight: '400' }],
        'label': ['0.75rem', { lineHeight: '1.60', fontWeight: '500', letterSpacing: '0.12px' }],
        'overline': ['0.63rem', { lineHeight: '1.60', fontWeight: '400', letterSpacing: '0.5px' }],
        'micro': ['0.6rem', { lineHeight: '1.60', fontWeight: '400', letterSpacing: '0.096px' }],
      },

      borderRadius: {
        'sharp': '4px',
        'subtle': '6px',
        'DEFAULT': '8px',
        'comfortable': '8px',
        'generous': '12px',
        'rounded': '16px',
        'highly': '24px',
        'maximum': '32px',
      },

      boxShadow: {
        'contained': '1px solid #f0eee6',
        'contained-dark': '1px solid #30302e',
        'ring': '0px 0px 0px 1px #d1cfc5',
        'ring-warm': '0px 0px 0px 1px #d1cfc5',
        'ring-subtle': '0px 0px 0px 1px #dedc01',
        'ring-deep': '0px 0px 0px 1px #c2c0b6',
        'ring-terracotta': '0px 0px 0px 1px #c96442',
        'ring-dark': '0px 0px 0px 1px #30302e',
        'whisper': 'rgba(0,0,0,0.05) 0px 4px 24px',
        'card': 'rgba(0,0,0,0.05) 0px 4px 24px',
        'inset': 'inset 0px 0px 0px 1px rgba(0,0,0,0.15)',
      },

      spacing: {
        '0.5': '3px',
        '18': '18px',
        '22': '22px',
        '26': '26px',
        '30': '30px',
        '34': '34px',
        '38': '38px',
        '42': '42px',
        '46': '46px',
        '54': '54px',
        '58': '58px',
        '62': '62px',
        '66': '66px',
        '70': '70px',
        '74': '74px',
        '78': '78px',
        '82': '82px',
        '86': '86px',
        '90': '90px',
        '100': '100px',
        '120': '120px',
      },

      screens: {
        'xs': '479px',
        'sm': '640px',
        'md': '768px',
        'lg': '992px',
        'xl': '1200px',
      },

      keyframes: {
        'star-unlock': {
          '0%': { transform: 'scale(0) rotate(-180deg)', opacity: '0' },
          '50%': { transform: 'scale(1.2) rotate(10deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'star-unlock': 'star-unlock 0.6s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'fade-in-up': 'fade-in-up 0.4s ease-out',
      },
    },
  },
  plugins: [],
};
export default config;
