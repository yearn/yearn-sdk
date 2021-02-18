const copyfiles = require("copyfiles");
const ttypescript = require("ttypescript");
const typescript = require("rollup-plugin-typescript2");

module.exports = {
  rollup(config, options) {
    const rpt2Plugin = config.plugins.find((p) => p.name === "rpt2");
    const rpt2PluginIndex = config.plugins.indexOf(rpt2Plugin);

    const path = options.tsconfig || "tsconfig.json";

    const tsconfig = ttypescript.readConfigFile(path, ttypescript.sys.readFile)
      .config;

    const tsCompiler = ttypescript.parseJsonConfigFileContent(
      tsconfig,
      ttypescript.sys,
      "./"
    ).options;

    const customRPT2Plugin = typescript({
      typescript: ttypescript,
      tsconfig: options.tsconfig,
      tsconfigDefaults: {
        exclude: [
          "**/*.spec.ts",
          "**/*.test.ts",
          "node_modules",
          "bower_components",
          "jspm_packages",
          "dist",
        ],
        compilerOptions: {
          sourceMap: true,
          declaration: true,
        },
      },
      tsconfigOverride: {
        compilerOptions: {
          target: "esnext",
          ...(!options.writeMeta
            ? { declaration: false, declarationMap: false }
            : {}),
        },
      },
      check: !options.transpileOnly && options.writeMeta,
      useTsconfigDeclarationDir: Boolean(tsCompiler && tsCompiler.declarationDir),
    });

    config.plugins.splice(rpt2PluginIndex, 1, customRPT2Plugin);
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
