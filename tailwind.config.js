/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#daa749",
                "background-light": "#f7f5f3",
                "background-dark": "#121212",
                "card-dark": "#1e1e1e",
                "accent-muted": "#605239",
                "lakers-purple": "#552583",
                "lakers-gold": "#FDB927",
            },
            fontFamily: {
                "display": ["Epilogue", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.5rem",
                "lg": "1rem",
                "xl": "1.5rem",
                "2xl": "2rem",
                "full": "9999px"
            },
        },
    },
    plugins: [],
}
