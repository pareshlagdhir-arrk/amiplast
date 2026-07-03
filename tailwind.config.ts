import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-space-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      boxShadow: {
        glass: '0 30px 90px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.24)'
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        pulseGlow: 'pulseGlow 5s ease-in-out infinite'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(0,-22px,0) scale(1.04)' }
        },
        pulseGlow: {
          '0%, 100%': { opacity: '.75', filter: 'blur(0px)' },
          '50%': { opacity: '1', filter: 'blur(1px)' }
        }
      }
    }
  },
  plugins: []
};

export default config;
