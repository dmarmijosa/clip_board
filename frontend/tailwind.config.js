/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
      colors: {
        midnight: '#0f172a',
        slateglass: 'rgba(15, 23, 42, 0.65)',
      },
      boxShadow: {
        glow: '0 20px 45px rgba(15, 23, 42, 0.45)',
      },
      backgroundImage: {
        dashboard:
          'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #111827 100%)',
        primary:
          'linear-gradient(135deg, rgba(99,102,241,1) 0%, rgba(139,92,246,1) 100%)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

