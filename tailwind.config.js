/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
    "./utils/**/*.{js,jsx,ts,tsx}",
    "./constants/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Soft Modern — Warm & Professional
        brand: {
          primary: '#1E1209',    // Main accent (dark cocoa) — buttons, headings, active icons
          accent: '#F77051',     // Accent orange — CTA, progress, nav bar, main cards
          accentSoft: '#FFE0D6',
          accentPressed: '#E25A3C',
        },
        // Surface Colors — antique white + cream
        surface: {
          primary: '#FAEBD7',    // App background (antique white)
          secondary: '#FFFFFF',  // White cards
          tertiary: '#F5E3CB',   // Deep cream chips
          elevated: '#FFFFFF',
          cream: '#FDF3E3',
        },
        // Semantic Colors
        semantic: {
          success: '#10B981',    // Green — done, paid, approved
          warning: '#E8963C',
          error: '#E5484D',      // Soft red — alerts, logout, delete, cancel
          info: '#3D7BD9',
        },
        // Text Colors — warm family
        text: {
          primary: '#1E1209',
          secondary: '#6B5443',
          muted: '#A08A77',
          inverse: '#FFFFFF',
          accent: '#F77051',
        },
        // Border Colors
        border: {
          light: '#F0E1CC',
          medium: '#E3CCA9',
        },
        overlay: 'rgba(30, 18, 9, 0.45)',
      },
      fontFamily: {
        sans: ['Poppins_400Regular', 'Poppins_500Medium', 'Poppins_600SemiBold', 'Poppins_700Bold'],
        heading: ['PlayfairDisplay_700Bold', 'PlayfairDisplay_600SemiBold'],
        body: ['Inter_400Regular', 'Inter_500Medium'],
      },
      borderRadius: {
        'none': '0px',
        'sm': '12px',
        'md': '18px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '40px',
        '3xl': '48px',
        'full': '9999px',
      },
      boxShadow: {
        'card': '0 10px 30px 0 rgba(30, 18, 9, 0.08)',
        'elevated': '0 14px 34px 0 rgba(30, 18, 9, 0.12)',
        'button': '0 8px 18px 0 rgba(30, 18, 9, 0.22)',
        'button-orange': '0 10px 22px 0 rgba(247, 112, 81, 0.35)',
        'floating': '0 16px 36px 0 rgba(30, 18, 9, 0.16)',
      },
    },
  },
  plugins: [],
}
