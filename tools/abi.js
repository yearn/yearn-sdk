#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const process = require("process");
const parser = require("@solidity-parser/parser");

const exec = path.relative(process.cwd(), process.argv[1]);
const [file] = process.argv.splice(2);

function visit(ast, callbackMap) {
  function _visit(node, parent, key, index) {
    if (!node) return;
    const nodeType = node.type;
    if (nodeType in callbackMap) {
      callbackMap[nodeType](node, parent, key, index);
    }
    for (const key of Object.keys(node)) {
      const child = node[key];
      if (Array.isArray(child)) {
        for (let j = 0; j < child.length; j++) {
          _visit(child[j], node, key, j);
        }
      } else if (child && child.type) {
        _visit(child, node, key);
      }
    }
  }
  _visit(ast, null);
}

if (!file) {
  console.error(`[!] usage: ${exec} <file>`);
  process.exit(1);
} else if (!fs.existsSync(file)) {
  console.error(`[!] ${file} does not exist.`);
  process.exit(1);
} else if (!fs.lstatSync(file).isFile()) {
  console.error(`[!] ${file} is not a file.`);
  process.exit(1);
}

const source = fs.readFileSync(file, "utf-8");

try {
  const ast = parser.parse(source, { loc: true });
  visit(ast, {
    FunctionDefinition: node => {
      if (!node.body) return;
      if (node.isConstructor) return;
      const loc = node.loc;
      const end = source
        .split("\n")
        .splice(loc.start.line - 1, loc.end.line - loc.start.line - 1)
        .join("\n")
        .trim();
      const name = end
        .slice(0, end.indexOf("{"))
        .replace(/\n/g, " ")
        .replace(/\s\s+/g, " ")
        .trim();
      console.log(name);
    }
  });
} catch (e) {
  if (e instanceof parser.ParserError) {
    console.error(e.errors);
  } else {
    console.error(e);
  }
}
