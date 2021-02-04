module.exports.tab = function tab(...args) {
  console.log(...args.reduce((r, a) => r.concat(a, "\t"), []));
};
