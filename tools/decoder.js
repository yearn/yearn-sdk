const decoder = require("abi-decoder");
const path = require("path");
const fs = require("fs");

const [exe, file, ...rest] = process.argv;

if (rest.length !== 1) {
  console.log("[!] please provide data");
  process.exit(1);
}

const data = rest[0];

const abidir = "abifull";

function loadAbis(dir) {
  fs.readdirSync(dir).forEach((file) => {
    const fullpath = path.join(dir, file);
    const lstat = fs.lstatSync(fullpath);
    if (lstat.isFile()) {
      try {
        const contents = fs.readFileSync(fullpath, "utf-8");
        decoder.addABI(JSON.parse(contents));
      } catch (error) {
        console.error(`Skipping ${fullpath}: ${error}`);
      }
    } else if (lstat.isDirectory()) {
      loadAbis(fullpath);
    }
  });
}

loadAbis(abidir);

console.log(decoder.decodeMethod(data));
