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

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .command('edit', 'Edit files based on Astrolark syntax in clipboard')
    .command('read', 'Generate project overview')
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
    .parse();

  let options = {
    verbose: argv.verbose,
    output: argv.output,
    basePath: argv['base-path'],
    filter: argv.filter as string[]
  };

  let command = argv._[0] as string | undefined;

  if (!command) {
    const wizardOptions = await runWizard();
    command = wizardOptions.command;
    options = { ...options, ...wizardOptions };
  }

  if (command === 'edit') {
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

  if (command === 'read') {
    try {
      const projectPath = options.basePath;
      const { content, ignoredFiles } = generateOverview(projectPath, options.filter);

      if (options.output) {
        const outputPath = path.isAbsolute(options.output) ? options.output : path.join(projectPath, options.output);
        await fs.writeFile(outputPath, content);
        console.log(chalk.blue(`✔ Project overview generated as ${chalk.bold(outputPath)}`));
      } else {
        try {
          await clipboardy.write(content);
          console.log(chalk.green('✔ Project overview copied to clipboard'));
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
