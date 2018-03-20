const path = require('path');
const fs = require('fs');
const { pass } = require("create-jest-runner");
const babel = require("babel-core");
const cosmiconfig = require("cosmiconfig");
const explorer = cosmiconfig("jest-runner-babel");
const mkdirp = require('mkdirp');

module.exports = ({ testPath, config }) => {
  const start = new Date();
  return explorer
    .load(config.rootDir)
    .then(explorer => {
      const runnerConfig = explorer.config;
      const result = babel.transformFileSync(testPath, runnerConfig.babel || {});

      if (runnerConfig.outDir) {
        // LMAO do this smarter
        const testDir = path.dirname(testPath);
        const outFile = testPath.replace(config.rootDir, runnerConfig.outDir);
        const outPath = testDir.replace(config.rootDir, runnerConfig.outDir);

        mkdirp.sync(outPath);
        fs.writeFileSync(outFile, result.code);

      }

      return pass({
        start,
        end: new Date(),
        test: { path: testPath }
      });
    })
    .catch(parsingError => {
      console.log('Error parsing config', parsingError);
    });
};
