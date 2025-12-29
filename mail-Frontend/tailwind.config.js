/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        navy: "#0E2A47",
        darkBlue: "#1A3E5C",
        neon: "#18E2D5",
        tealSoft: "#356B9A"
      },
      fontFamily: {
        futuristic: ["Orbitron", "sans-serif"]
      },
      boxShadow: {
        neon: "0 0 25px rgba(24, 226, 213, 0.8)"
      }
    },
  },
  plugins: [],
}
