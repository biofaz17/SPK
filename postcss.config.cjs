module.exports = {
  plugins: [
    require('tailwindcss')({
      content: ['./index.html', './App.tsx', './components/**/*.tsx', './screens/**/*.tsx', './*.ts'],
    }),
  ],
};
