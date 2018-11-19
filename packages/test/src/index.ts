import { Structure } from '@solon/environment';
import * as deployer from '@solon/deployer';
import * as spawn from 'cross-spawn';
import * as path from 'path';
import * as ethers from 'ethers';

const mochaPath = path.resolve(__dirname, '..', '..', 'node_modules', '.bin', 'mocha');

export const setup = async (migrate: (deployer: any) => {}) => {
  await deployer.run(migrate);
};

export const setupCoverage = () => {
  // coverage.prepare();
  // coverage.instrument();
};

export const run = () => {
  spawn.sync('node', [mochaPath, `${Structure.contracts.test}**/*Test.js`, '--reporter', 'spec'], {
    stdio: [process.stdin, process.stdout, process.stderr],
  });
};

export const finishCoverage = () => {
  // coverage.report();
};

export const cleanCoverage = () => {
  // coverage.clean();
};