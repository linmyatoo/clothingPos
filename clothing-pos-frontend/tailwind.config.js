module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#2463eb",
        "primary-content": "#ffffff",
        "background-light": "#f6f6f8",
        "background-dark": "#111621",
        "surface-light": "#ffffff",
        "surface-dark": "#1f2937",
        "text-main": "#0f172a",
        "text-muted": "#64748b",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"],
        "body": ["Inter", "sans-serif"],
      },
      borderRadius: { "DEFAULT": "0.5rem", "lg": "1rem", "xl": "1.5rem", "full": "9999px" },
      boxShadow: {
        "soft": "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
