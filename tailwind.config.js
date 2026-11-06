/** @type {import('tailwindcss').Config} */
/** Tailwind 配置（CommonJS，和项目其余构建脚本保持一致） */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        pond: {
          50: '#f5fbfe',
          100: '#e8f4fb',
          200: '#cfe8f6',
          300: '#a9d6ec',
          400: '#78bcdd',
          500: '#4fa2cc',
          600: '#3a85ae',
          700: '#316b8c',
          800: '#2c5873',
          900: '#274a60'
        },
        fish: {
          300: '#ffd3a1',
          400: '#ffbe7d',
          500: '#f9a55b',
          600: '#e88a3c'
        },
        weed: {
          300: '#a9dfc4',
          500: '#66c39b',
          600: '#4ba882'
        }
      },
      fontFamily: {
        sans: [
          '"PingFang SC"',
          '"Microsoft YaHei"',
          '"Hiragino Sans GB"',
          '"Source Han Sans SC"',
          'system-ui',
          '-apple-system',
          'sans-serif'
        ]
      },
      boxShadow: {
        soft: '0 2px 10px rgba(79, 162, 204, 0.08)',
        card: '0 4px 20px rgba(79, 162, 204, 0.10)'
      },
      borderRadius: {
        xl2: '18px'
      }
    }
  },
  plugins: []
}
