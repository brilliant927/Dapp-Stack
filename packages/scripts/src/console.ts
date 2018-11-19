#!/usr/bin/env node

process.on('unhandledRejection', err => {
  throw err;
});

import * as ethereum from '@solon/ethereum';
import { globalError } from './shared/globalError';

async function consoleAsync() {
  try {
    await ethereum.console();
  } catch (error) {
    globalError(error);
  }
}

consoleAsync();