module.exports = {
  plugins: [
    [
      "module-resolver",
      {
        extensions: [".ts", ".tsx"],
        root: "./",
        alias: {
          "@contracts": "./src/contracts",
          "@data": "./src/data",
          "@protocols": "./src/protocols",
          "@utils": "./src/utils",
        },
      },
    ],
  ],
};
