#!/usr/bin/env node

import chalk from 'chalk';
import clipboardy from 'clipboardy';
import fs from 'fs/promises';
import { generateOverview } from './overviewGenerator.js';
import { applyEdits } from './editor/index.js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { input, confirm, select } from '@inquirer/prompts';

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .command('edit', 'Edit files based on Astrolark syntax in clipboard')
    .command('read', 'Generate project overview')
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: 'Run with verbose logging'
    })
    .option('output', {
      alias: 'o',
      type: 'string',
      description: 'Specify output file (only for read command)'
    })
    .option('base-path', {
      type: 'string',
      description: 'Specify base path for file operations'
    })
    .help()
    .alias('help', 'h')
    .parse();

  let options = {
    verbose: argv.verbose,
    output: argv.output,
    basePath: argv['base-path'] || process.cwd(),
  };

  let command = argv._[0] as string | undefined;

  if (!command) {
    // Implement runWizard functionality inline
    console.log(chalk.cyan('Welcome to Astrolark!\n'));
    console.log('Astrolark helps you generate context for your project so you can easily ask questions about it using an LLM.\n');
    console.log('This interactive wizard will guide you through the options and provide a non-interactive shortcut for future use.\n');

    command = await select({
      message: 'Choose a command:',
      choices: [
        { name: 'Generate project overview', value: 'read' },
        { name: 'Edit files based on Astrolark syntax', value: 'edit' },
      ],
    });

    options.verbose = await confirm({
      message: 'Enable verbose output?',
      default: false
    });

    if (command === 'read') {
      options.output = await input({
        message: 'Enter the output file name/path (leave empty to copy to clipboard):',
      });
    }

    options.basePath = await input({
      message: 'Enter base path for file operations (leave empty for current directory):',
      default: process.cwd()
    });

    console.log(chalk.green('\nYou can use the following command to run Astrolark with these options non-interactively:'));
    console.log(chalk.yellow(`npx astrolark ${command} ${options.verbose ? '--verbose' : ''} ${options.output ? `--output ${options.output}` : ''} --base-path "${options.basePath}"`));
  }

  if (command === 'edit') {
    try {
      const clipboardContent = await clipboardy.read();
      const context = { rootDir: options.basePath };

      await applyEdits(clipboardContent, context);

      console.log(chalk.green('✔ Edits applied successfully'));
    } catch (err) {
      console.error(chalk.red('✘ Error applying edits:', err instanceof Error ? err.message : 'Unknown error'));
    }
    return;
  }

  if (command === 'read') {
    const projectPath = options.basePath;
    const { content, ignoredFiles } = generateOverview(projectPath);

    if (options.output) {
      await fs.writeFile(options.output, content);
      console.log(chalk.blue(`✔ Project overview generated as ${chalk.bold(options.output)}`));
    } else {
      try {
        await clipboardy.write(content);
        console.log(chalk.green('✔ Project overview copied to clipboard'));
      } catch (err) {
        console.error(chalk.red('✘ Error copying to clipboard:', err instanceof Error ? err.message : 'Unknown error'));
      }
    }

    const gitignoreSkipped = [...ignoredFiles.entries()].filter(([_, reasons]) => reasons.includes('gitignore'));
    const otherSkipped = [...ignoredFiles.entries()].filter(([_, reasons]) => !reasons.includes('gitignore'));

    if (gitignoreSkipped.length > 0) {
      console.log(chalk.yellow(`ℹ ${gitignoreSkipped.length} files skipped due to .gitignore`));
    }

    if (otherSkipped.length > 0) {
      console.log(chalk.yellow('ℹ Other files skipped:'));
      otherSkipped.forEach(([file, reasons]) => {
        console.log(chalk.dim(`  ${file}: ${reasons.join(', ')}`));
      });
    }

    if (options.verbose) {
      console.log(chalk.cyan('\nVerbose output:'));
      console.log(chalk.dim(JSON.stringify(options, null, 2)));
    }
    return;
  }

  console.log(chalk.red('Invalid command. Use --help to see available commands.'));
}

main().catch(error => console.error(chalk.red('✘ Error:', error instanceof Error ? error.message : 'Unknown error')));