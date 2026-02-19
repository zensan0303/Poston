/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f7ff',
          100: '#b3e8ff',
          200: '#80d6ff',
          300: '#4dc4f5',
          400: '#1aaee0',
          500: '#0088bb',  /* 白文字コントラスト ✓ */
          600: '#006f9c',
          700: '#005578',
          800: '#003c56',
          900: '#002233',
        },
      },
      fontSize: {
        'xl-mobile': '1.25rem',
        '2xl-mobile': '1.5rem',
        '3xl-mobile': '1.875rem',
      },
    },
  },
  corePlugins: {
    // 不要なコアプラグインを無効化してビルドサイズを削減
    preflight: true,
  },
  plugins: [],
}

