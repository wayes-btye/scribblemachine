import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'oklch(var(--border))',
  			input: 'oklch(var(--input))',
  			ring: 'oklch(var(--ring))',
  			background: 'oklch(var(--background))',
  			foreground: 'oklch(var(--foreground))',
  			primary: {
  				DEFAULT: 'oklch(var(--primary))',
  				foreground: 'oklch(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'oklch(var(--secondary))',
  				foreground: 'oklch(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'oklch(var(--destructive))',
  				foreground: 'oklch(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'oklch(var(--muted))',
  				foreground: 'oklch(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'oklch(var(--accent))',
  				foreground: 'oklch(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'oklch(var(--popover))',
  				foreground: 'oklch(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'oklch(var(--card))',
  				foreground: 'oklch(var(--card-foreground))'
  			},
  			chart: {
  				'1': 'oklch(var(--chart-1))',
  				'2': 'oklch(var(--chart-2))',
  				'3': 'oklch(var(--chart-3))',
  				'4': 'oklch(var(--chart-4))',
  				'5': 'oklch(var(--chart-5))'
  			},
  			// Legacy brand colors (keeping for compatibility)
  			brand: {
  				cream: '#F8F5F0',
  				'warm-blue': '#4A90B8',
  				'warm-orange': '#FF8B5A',
  				'soft-pink': '#FFB6C1',
  				'soft-blue': '#87CEEB',
  				'soft-green': '#98FB98',
  				'soft-yellow': '#FFEB9C',
  				'soft-purple': '#DDA0DD'
  			}
  		},
  		fontFamily: {
  			sans: ['var(--font-sans)', 'Inter', 'sans-serif'],
  			serif: ['var(--font-serif)', 'Architects Daughter', 'cursive'],
  			mono: ['var(--font-mono)', 'DM Sans', 'monospace'],
  			'space-grotesk': ['Space Grotesk', 'sans-serif'],
  			'plus-jakarta': ['Plus Jakarta Sans', 'sans-serif'],
  		},
  		borderRadius: {
  			lg: 'var(--radius-lg)',
  			md: 'var(--radius-md)',
  			sm: 'var(--radius-sm)',
  			xl: 'var(--radius-xl)'
  		},
  		boxShadow: {
  			'2xs': 'var(--shadow-2xs)',
  			'xs': 'var(--shadow-xs)',
  			'sm': 'var(--shadow-sm)',
  			'DEFAULT': 'var(--shadow)',
  			'md': 'var(--shadow-md)',
  			'lg': 'var(--shadow-lg)',
  			'xl': 'var(--shadow-xl)',
  			'2xl': 'var(--shadow-2xl)',
  		},
  		backgroundImage: {
  			'gradient-bg': 'var(--gradient-bg)',
  			'gradient-card': 'var(--gradient-card)',
  			'gradient-hero': 'var(--gradient-hero)',
  			'gradient-accent': 'var(--gradient-accent)',
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'creative-paint-float-1': {
  				'0%': {
  					opacity: '0.26',
  					transform: 'translateY(-16px) translateX(-6px) scale(0.48) rotate(4deg)',
  					borderRadius: '62% 38% 48% 72%',
  					filter: 'blur(2.8px)'
  				},
  				'50%': {
  					opacity: '0.36',
  					transform: 'translateY(32px) translateX(10px) scale(0.68) rotate(15deg)',
  					borderRadius: '48% 52% 62% 38%',
  					filter: 'blur(1.8px)'
  				},
  				'100%': {
  					opacity: '0.26',
  					transform: 'translateY(-16px) translateX(-6px) scale(0.48) rotate(31deg)',
  					borderRadius: '62% 38% 48% 72%',
  					filter: 'blur(2.8px)'
  				}
  			},
  			'fade-in-up': {
  				'0%': { opacity: '0', transform: 'translateY(30px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' }
  			},
  			'scale-in': {
  				'0%': { opacity: '0', transform: 'scale(0.9)' },
  				'100%': { opacity: '1', transform: 'scale(1)' }
  			},
  			'logo-float': {
  				'0%, 100%': { transform: 'translateY(0px) scale(1)' },
  				'50%': { transform: 'translateY(-10px) scale(1.02)' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'creative-paint-float-1': 'creative-paint-float-1 16s ease-in-out infinite',
  			'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
  			'scale-in': 'scale-in 0.8s ease-out forwards',
  			'logo-float': 'logo-float 4s ease-in-out infinite'
  		}
  	}
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;