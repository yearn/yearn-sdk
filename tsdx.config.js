const copyfiles = require("copyfiles");

module.exports = {
  rollup(config) {
    config.plugins.push(copy(["src/**/*.d.ts"], "dist", { up: 1, soft: true }));
    return config;
  },
};

function copy(paths, out, opt = undefined) {
  return {
    name: "copy",
    generateBundle() {
      return new Promise((resolve) => copyfiles([...paths, out], opt, resolve));
    },
  };
}
