const { compilerOptions } = require("./tsconfig");

const { resolve } = require("path");

module.exports = {
  collectCoverageFrom: [
    "src/**/*.{ts,tsx,js,jsx}",
    "!**/node_modules/**",
    "!**/contracts/**",
    "!**/dist/**",
  ],
  moduleNameMapper: {
    "^@contracts/(.*)$": resolve(__dirname, "./src/contracts/$1"),
    "^@data/(.*)$": resolve(__dirname, "./src/data/$1"),
    "^@protocols/(.*)$": resolve(__dirname, "./src/protocols/$1"),
    "^@utils/(.*)$": resolve(__dirname, "./src/utils/$1"),
  },
  moduleDirectories: ["node_modules", "src"],
};
