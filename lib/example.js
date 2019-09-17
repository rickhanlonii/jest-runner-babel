const path = require('path');

let rootDir = __dirname;
const testPath = path.join(rootDir, 'qux.js');
let relativeTestPath = path.relative(rootDir, testPath);
const runnerConfig = {
  outDir: 'dist',
  srcDir: 'src'
};
const segments = relativeTestPath.split('/');
const outs = segments.reduce((acc, item, index) => {
  if (isMonorepo() && index < 2) {
    return { ...acc,
      dir: acc.dir.concat(item)
    };
  }

  return { ...acc,
    file: acc.file.concat(item === runnerConfig.srcDir ? null : item).filter(Boolean)
  };
}, {
  file: [],
  dir: []
});
const testFile = path.join(rootDir, ...outs.dir.filter(Boolean), runnerConfig.outDir, ...outs.file.filter(Boolean));
console.log(outs);
console.log(testFile); // [ 'packages', 'foo', 'index.js' ]
// [ 'packages', 'foo', 'src', 'index.js' ]
// [ 'packages', 'foo', 'src', 'some', 'index.js' ]
// so usually need to get the first 2 items
// const hasSourceDir = segments.includes('src');
// const end = hasSourceDir ? 3 : 2;
// console.log('end', end, segments, segments.slice(0, 3));
// rootDir = path.join(rootDir, ...segments.slice(0, end));
// console.log('a', rootDir);
// if (!hasSourceDir) {
//   rootDir = path.dirname(relativeTestPath);
// }
// // common case
// if (rootDir.endsWith('src')) {
//   relativeTestPath = path.relative(rootDir, testPath);
//   rootDir = path.dirname(rootDir);
//   console.log('c1', rootDir);
//   console.log('c2', relativeTestPath);
// }