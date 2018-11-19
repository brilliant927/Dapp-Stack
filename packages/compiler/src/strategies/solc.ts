import { Compile, Structure } from '@solon/environment';
import * as fs from 'fs-extra';
import { forEach } from 'lodash';
import * as path from 'path';
import { Signale } from 'signale';
import * as solc from 'solc';

import { ICompileStrategy } from '../types';

type CompilationOutput = {
  errors?: [
    {
      severity: string;
    }
  ];
  contracts: {
    [contractName: string]: {
      [contract: string]: {
        evm: {
          bytecode: string;
        };
        abi: string;
      };
    };
  };
};

export class Solc implements ICompileStrategy {
  private readonly contracts: string[];
  private readonly config: Compile;
  private readonly signale: Signale;

  constructor(contracts: string[], config: Compile, signale: Signale) {
    this.contracts = contracts;
    this.config = config;
    this.signale = signale;
  }

  input = (): string => {
    const sources = this.contracts.reduce((acc: { [contractName: string]: { content: string } }, contractName) => {
      acc[contractName] = {
        content: fs.readFileSync(path.join(Structure.contracts.src, contractName), 'utf-8').toString(),
      };
      return acc;
    }, {});

    return JSON.stringify({
      language: 'Solidity',
      sources,
      settings: {
        outputSelection: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          '*': {
            '*': [
              'abi',
              'ast',
              'devdoc',
              'userdoc',
              'metadata',
              'evm.gasEstimates',
              'evm.assembly',
              'evm.bytecode.object',
              'evm.bytecode.sourceMap',
            ],
          },
        },
      },
    });
  };

  findImports(filename: string) {
    if (fs.existsSync(filename)) {
      return { contents: fs.readFileSync(filename).toString() };
    }

    if (fs.existsSync(path.join('./node_modules/', filename))) {
      return { contents: fs.readFileSync(path.join('./node_modules/', filename)).toString() };
    }
    if (fs.existsSync(path.join(Structure.contracts.src, filename))) {
      return { contents: fs.readFileSync(path.join(Structure.contracts.src, filename)).toString() };
    }
    return { error: 'File not found' };
  }

  compile = () => {
    this.signale.await('Starting to compile the contracts');
    return new Promise<boolean>((resolve, reject) => {
      const output: CompilationOutput = JSON.parse(solc.compileStandardWrapper(this.input(), this.findImports));
      if (output.errors && output.errors.filter(error => error.severity === 'Warning').length > 0) {
        this.signale.error('Compilation failed ', output.errors);
        return reject();
      }

      forEach(output.contracts, (compilationResult, contractFile) => {
        fs.ensureDirSync(path.join(Structure.contracts.build, contractFile));
        forEach(compilationResult, (result, contract) => {
          fs.writeFileSync(
            path.join(Structure.contracts.build, contractFile, `${contract}.json`),
            JSON.stringify(result),
            'utf-8',
          );
        });
      });
      this.signale.success('Contracts compiled');
      resolve(true);
    });
  };
}