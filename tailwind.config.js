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
                "primary": "#FDB927", // Lakers Gold
                "lakers-gold": "#FDB927",
                "lakers-purple": "#552583", // Lakers Purple
                "background-light": "#f7f5f3",
                "background-dark": "#0A0A0A",
                "card-dark": "#1A1A1A",
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
