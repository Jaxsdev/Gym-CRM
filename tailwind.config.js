/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Gumloop-inspired ultra-clean canvas & neutral scale
        arena: {
          50: '#FFFFFF',
          100: '#F9FAFB', // App background (ultra clean modern gray-50)
          200: '#F3F4F6',
          300: '#E5E7EB',
          400: '#D1D5DB',
        },
        stone: {
          border: '#E5E7EB',
          subtle: '#F9FAFB',
        },
        carbon: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          text: '#F8FAFC',
          muted: '#94A3B8',
        },
        // Gumloop Primary Action: High-formality dark slate/black button
        terracota: {
          DEFAULT: '#18181B', // Dark charcoal/black pill like Gumloop
          hover: '#09090B',
          light: '#F4F4F5',
          50: '#FAFAFA',
          100: '#F4F4F5',
          500: '#18181B',
          600: '#09090B',
          700: '#000000',
        },
        whatsapp: {
          DEFAULT: '#166534', // Corporate forest green
          hover: '#14532D',
          light: '#DCFCE7',
        },
        semantic: {
          activeBg: '#DCFCE7',
          activeText: '#166534',
          warningBg: '#FEF3C7',
          warningText: '#92400E',
          urgentBg: '#FEE2E2',
          urgentText: '#991B1B',
          frozenBg: '#F1F5F9',
          frozenText: '#334155',
        }
      },
      fontFamily: {
        sans: ['"Inter"', '"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Inter"', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        card: '0 2px 6px 0 rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}

