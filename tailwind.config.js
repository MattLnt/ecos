/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        // Breakpoint principal de l'app : tout ce qui est <= 880px.
        // Les styles de base visent le desktop, `mobile:` surcharge pour le
        // téléphone et la tablette portrait.
        'mobile': { 'max': '880px' },
        // Téléphone/tablette en paysage : la hauteur devient la contrainte,
        // on repasse alors terrain et pavé côte à côte. Déclaré APRÈS `mobile`
        // pour que ses règles l'emportent dans la feuille générée.
        'short': { 'raw': '(max-height: 520px) and (max-width: 880px)' },
      },
      spacing: {
        'safe-t': 'env(safe-area-inset-top, 0px)',
        'safe-b': 'env(safe-area-inset-bottom, 0px)',
        'safe-l': 'env(safe-area-inset-left, 0px)',
        'safe-r': 'env(safe-area-inset-right, 0px)',
      },
      height: {
        'screen-d': '100dvh',
      },
      minHeight: {
        'screen-d': '100dvh',
      },
      maxHeight: {
        'screen-d': '100dvh',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
