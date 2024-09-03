#!/usr/bin/env node

import chalk from 'chalk';
import clipboardy from 'clipboardy';
import fs from 'fs/promises';
import { generateOverview } from './overviewGenerator.js';
import { applyEdits } from './editor/index.js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import path from 'path';
import { runWizard } from './wizard.js';

interface AstrolarkOptions {
  command?: string;
  basePath: string;
  filter: string[];
  output: string;
  verbose: boolean;
}

function removeQuotes(str: string): string {
  return str.replace(/^['"]|['"]$/g, '');
}

function processOptions(rawOptions: Partial<AstrolarkOptions>): AstrolarkOptions {
  const basePath = removeQuotes(rawOptions.basePath || process.cwd());

  return {
    command: rawOptions.command || 'read',
    basePath: basePath,
    filter: (rawOptions.filter || ['.']).map((f: string) => {
      const cleanPath = removeQuotes(f);
      return path.relative(basePath, path.resolve(basePath, cleanPath));
    }),
    output: rawOptions.output || '',
    verbose: rawOptions.verbose || false
  };
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .command('edit', 'Edit files based on Astrolark syntax in clipboard')
    .command('read', 'Read files to compress')
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: 'Run with verbose logging',
      default: false
    })
    .option('output', {
      alias: 'o',
      type: 'string',
      description: 'Specify output file (only for read command)',
      default: ''
    })
    .option('base-path', {
      alias: 'b',
      type: 'string',
      description: 'Specify base path for file operations',
      default: process.cwd()
    })
    .option('filter', {
      alias: 'f',
      type: 'array',
      description: 'Specify files or directories to include',
      default: ['.']
    })
    .help()
    .alias('help', 'h')
    .parse() as unknown as Partial<AstrolarkOptions>;

  let options = processOptions(argv);

  if (!options.command) {
    const wizardOptions = await runWizard();
    options = processOptions(wizardOptions);
  }

  console.log(chalk.cyan('Command execution starting...\n'));

  if (options.command === 'edit') {
    try {
      const clipboardContent = await clipboardy.read();
      const context = { rootDir: options.basePath, verbose: options.verbose };

      await applyEdits(clipboardContent, context);

      console.log(chalk.green('✔ Edits applied successfully'));
    } catch (err) {
      console.error(chalk.red('✘ Error applying edits:', err instanceof Error ? err.message : 'Unknown error'));
    }
    return;
  }

  if (options.command === 'read') {
    try {
      const projectPath = options.basePath;
      const { content, ignoredFiles } = generateOverview(projectPath, options.filter);

      if (options.output) {
        const outputPath = path.isAbsolute(options.output) ? options.output : path.join(projectPath, options.output);
        await fs.writeFile(outputPath, content);
        console.log(chalk.green(`✔ Compressed code saved to ${chalk.bold(outputPath)}`));
        console.log(chalk.cyan('Next step: Upload this file to your AI chat interface to start analyzing your code.'));
      } else {
        try {
          await clipboardy.write(content);
          console.log(chalk.green('✔ Compressed code copied to clipboard'));
          console.log(chalk.cyan('Next step: Paste the clipboard content into your AI chat interface to start analyzing your code.'));
        } catch (err) {
          console.error(chalk.red('✘ Error copying to clipboard:', err instanceof Error ? err.message : 'Unknown error'));
        }
      }

      const gitignoreSkipped = [...ignoredFiles.entries()].filter(([_, reasons]) => reasons.includes('ignored'));
      const filterSkipped = [...ignoredFiles.entries()].filter(([_, reasons]) => reasons.includes('not in filter list'));

      if (gitignoreSkipped.length > 0) {
        console.log(chalk.yellow(`ℹ ${gitignoreSkipped.length} files skipped due to .gitignore or always ignore rules`));
      }

      if (filterSkipped.length > 0) {
        console.log(chalk.yellow(`ℹ ${filterSkipped.length} files skipped due to filter`));
      }

      if (options.verbose) {
        console.log(chalk.cyan('\nVerbose output:'));
        console.log(chalk.dim(JSON.stringify(options, null, 2)));
      }
    } catch (err) {
      console.error(chalk.red('✘ Error generating overview:', err instanceof Error ? err.message : 'Unknown error'));
    }
    return;
  }

  console.log(chalk.red('Invalid command. Use --help to see available commands.'));
}

main().catch(error => console.error(chalk.red('✘ Error:', error instanceof Error ? error.message : 'Unknown error')));
