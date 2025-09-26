import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'Helvetica Neue', 'Arial', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', '"Times New Roman"', 'serif'],
      },
      fontSize: {
        // Semantic Typography Scale - 4/8px baseline rhythm
        'display': ['3rem', { lineHeight: '3.5rem' }],     // 48px/56px
        'h1': ['2.5rem', { lineHeight: '3rem' }],          // 40px/48px  
        'h2': ['2rem', { lineHeight: '2.5rem' }],          // 32px/40px
        'h3': ['1.5rem', { lineHeight: '2rem' }],          // 24px/32px
        'h4': ['1.25rem', { lineHeight: '1.75rem' }],      // 20px/28px
        'h5': ['1.125rem', { lineHeight: '1.5rem' }],      // 18px/24px
        'h6': ['1rem', { lineHeight: '1.5rem' }],          // 16px/24px
        'body': ['1rem', { lineHeight: '1.5rem' }],        // 16px/24px
        'body-sm': ['0.875rem', { lineHeight: '1.25rem' }], // 14px/20px
        'meta': ['0.75rem', { lineHeight: '1rem' }],       // 12px/16px
        'caption': ['0.625rem', { lineHeight: '0.75rem' }], // 10px/12px
      },
      spacing: {
        '1': 'var(--space-1)',   // 4px
        '2': 'var(--space-2)',   // 8px
        '3': 'var(--space-3)',   // 12px
        '4': 'var(--space-4)',   // 16px
        '5': 'var(--space-5)',   // 20px
        '6': 'var(--space-6)',   // 24px
        '8': 'var(--space-8)',   // 32px
        '10': 'var(--space-10)', // 40px
        '12': 'var(--space-12)', // 48px
        '16': 'var(--space-16)', // 64px
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Sea-Glass + Coral brand palette
        brand: {
          700: "hsl(var(--brand-700))",
          600: "hsl(var(--brand-600))", 
          primary: "hsl(var(--brand-primary))",
          "primary-foreground": "hsl(var(--brand-primary-foreground))",
          secondary: "hsl(var(--brand-secondary))",
          "secondary-foreground": "hsl(var(--brand-secondary-foreground))",
          muted: "hsl(var(--brand-muted))",
          accent: "hsl(var(--brand-accent))",
          green: "hsl(var(--brand-green))",
          "green-foreground": "hsl(var(--brand-green-foreground))",
        },
        // Accent colors
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          500: "hsl(var(--accent-500))",
        },
        // Semantic text colors
        ink: {
          DEFAULT: "hsl(var(--ink))",
          muted: "hsl(var(--ink-muted))",
        },
        // Layout neutrals - warm peach palette
        neutral: {
          canvas: "hsl(var(--neutral-canvas))",
          section: "hsl(var(--neutral-section))",
          card: "hsl(var(--neutral-card))",
        },
        // State colors
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        error: "hsl(var(--error))",
        info: "hsl(var(--info))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        'xs': 'var(--radius-xs)',     // 4px
        'sm': 'var(--radius-sm)',     // 8px 
        'md': 'var(--radius-md)',     // 12px
        'lg': 'var(--radius-lg)',     // 16px
        'xl': 'var(--radius-xl)',     // 24px
        '2xl': 'var(--radius-2xl)',   // 32px
        'full': 'var(--radius-full)', // 9999px
      },
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
      },
      zIndex: {
        '1': 'var(--z-1)',   // 10
        '2': 'var(--z-2)',   // 20
        '3': 'var(--z-3)',   // 30
        '4': 'var(--z-4)',   // 40
        '5': 'var(--z-5)',   // 50
      },
      transitionDuration: {
        'fast': 'var(--transition-fast)',   // 150ms
        'base': 'var(--transition-base)',   // 250ms
        'slow': 'var(--transition-slow)',   // 350ms
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
