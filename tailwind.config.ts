import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: ["class"],
	content: ["./src/**/*.{ts,tsx}"],
	prefix: "tss-",
	theme: {
		extend: {
			colors: {
				border: "hsl(var(--tss-border))",
				input: "hsl(var(--tss-input))",
				ring: "hsl(var(--tss-ring))",
				background: "hsl(var(--tss-background))",
				foreground: "hsl(var(--tss-foreground))",
				primary: {
					DEFAULT: "hsl(var(--tss-primary))",
					foreground: "hsl(var(--tss-primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--tss-secondary))",
					foreground: "hsl(var(--tss-secondary-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--tss-destructive))",
					foreground: "hsl(var(--tss-destructive-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--tss-muted))",
					foreground: "hsl(var(--tss-muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--tss-accent))",
					foreground: "hsl(var(--tss-accent-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--tss-popover))",
					foreground: "hsl(var(--tss-popover-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--tss-card))",
					foreground: "hsl(var(--tss-card-foreground))",
				},
			},
			borderRadius: {
				lg: "var(--tss-radius)",
				md: "calc(var(--tss-radius) - 2px)",
				sm: "calc(var(--tss-radius) - 4px)",
			},
		},
	},
	plugins: [],
};

export default config;
