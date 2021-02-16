module.exports = {
  collectCoverageFrom: [
    "src/**/*.{ts,tsx,js,jsx}",
    "!**/node_modules/**",
    "!**/contracts/**",
    "!**/dist/**",
  ],
  moduleDirectories: ["node_modules", "src"],
};
