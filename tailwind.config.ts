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
        // Ancestry-like calm scale
        'hero': ['2.5rem', { lineHeight: '1.15', letterSpacing: '-0.01em' }],   // 40px
        'h1':   ['2rem',   { lineHeight: '1.2',  letterSpacing: '-0.006em' }],  // 32px
        'h2':   ['1.5rem', { lineHeight: '1.25'}],                              // 24px
        'h3':   ['1.25rem',{ lineHeight: '1.3' }],                              // 20px
        'body': ['1rem',   { lineHeight: '1.6' }],                              // 16px
        'fine': ['0.875rem',{lineHeight:'1.5'}],                                // 14px
        'display': ['2.75rem', { lineHeight: '1.1', letterSpacing: '-0.015em' }], // Large display text
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
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "0.9rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 8px 24px rgba(0,0,0,0.06)",
        focus: "0 0 0 2px rgba(34,26,23,0.35)",
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
