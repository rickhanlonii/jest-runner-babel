const path = require('path');
const fs = require('fs');
const { pass } = require('create-jest-runner');
const babel = require('babel-core');
const cosmiconfig = require('cosmiconfig');
const explorer = cosmiconfig('jest-runner-babel');
const mkdirp = require('mkdirp');

module.exports = ({ testPath, config }) => {
  const start = new Date();
  return explorer
    .load(config.rootDir)
    .then(explorer => {
      const runnerConfig = explorer.config;

      let result = null;

      try {
        result = transformFileSync(testPath, runnerConfig);
      } catch (err) {
        return fail({
          start,
          end: new Date(),
          test: { path: testPath, title: 'Babel', errorMessage: err.message },
        });
      }

      // Classics in the genre! Yes, it's possible, sometimes.
      // Old habit for ensurance
      if (!result) {
        return fail({
          start,
          end: new Date(),
          test: {
            path: testPath,
            title: 'Babel',
            errorMessage: 'Babel failing to transform...',
          },
        });
      }

      runnerConfig.outDir = runnerConfig.outDir || runnerConfig.outdir;

      if (typeof runnerConfig.outDir !== 'string') {
        runnerConfig.outDir = 'dist';
      }

      let { rootDir } = config;
      let relativeTestPath = path.relative(rootDir, testPath);

      // console.log(testPath);
      // we are in monorepo environment,
      // so make dist folder in each package root
      if (isMonorepo(config.cwd)) {
        if (isWin32 && !relativeTestPath.includes('/')) {
          relativeTestPath = relativeTestPath.replace(/\\/g, '/');
        }

        const segments = relativeTestPath.split('/');
        while (segments.length > 3) segments.pop();

        rootDir = path.join(rootDir, ...segments);

        // common case
        if (rootDir.endsWith('src')) {
          relativeTestPath = path.relative(rootDir, testPath);
          rootDir = path.dirname(rootDir);
        }
        // ! important: the `rootDir` may be package's directory
        // ! like <monorepo root>/<workspace name>/<package dir> so we can append the dist
      }

      // common case
      if (relativeTestPath.startsWith('src')) {
        relativeTestPath = path.relative(path.join(rootDir, 'src'), testPath);
      }

      let outDir = path.resolve(rootDir, runnerConfig.outDir);
      let outFile = path.join(outDir, relativeTestPath);

      // the new dir of the new file (may include some path from the testPath)
      outDir = path.dirname(outFile);

      const testFile = path.basename(outFile, path.extname(outFile));

      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, `${testFile}.js`), result.code);

      return pass({
        start,
        end: new Date(),
        test: { path: outFile },
      });
    })
    .catch(parsingError => {
      console.log('Error parsing config', parsingError);
    });
};
