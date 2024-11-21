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
import simpleGit from 'simple-git';
import os from 'os';
import { encode as encodeTokens } from "gpt-tokenizer";

interface FilterRule {
  type: 'include' | 'exclude';
  path: string;
}

interface AstrolarkOptions {
  command?: string;
  basePath: string;
  filterRules: FilterRule[];
  output: string;
  verbose: boolean;
  githubUrl?: string;
}

function removeQuotes(str: string): string {
  return str.replace(/^['"]|['"]$/g, '');
}

function processOptions(rawOptions: Partial<AstrolarkOptions> & { include?: string[], exclude?: string[] }): AstrolarkOptions {
  const basePath = removeQuotes(rawOptions.basePath || process.cwd());

  const filterRules: FilterRule[] = [];
  if (rawOptions.include || rawOptions.exclude) {
    const includeFlags = rawOptions.include || [];
    const excludeFlags = rawOptions.exclude || [];
    const maxLength = Math.max(includeFlags.length, excludeFlags.length);

    for (let i = 0; i < maxLength; i++) {
      if (i < includeFlags.length) {
        filterRules.push({ type: 'include', path: includeFlags[i] });
      }
      if (i < excludeFlags.length) {
        filterRules.push({ type: 'exclude', path: excludeFlags[i] });
      }
    }
  } else if (!rawOptions.filterRules || rawOptions.filterRules.length === 0) {
    // If no include/exclude specified and no filterRules, include everything
    filterRules.push({ type: 'include', path: '.' });
  } else {
    filterRules.push(...rawOptions.filterRules);
  }

  return {
    command: rawOptions.command || 'read',
    basePath: basePath,
    filterRules: filterRules,
    output: rawOptions.output || '',
    verbose: rawOptions.verbose || false,
    githubUrl: rawOptions.githubUrl
  };
}

async function cloneAndProcess(url: string, options: AstrolarkOptions): Promise<void> {
  const tempDir = path.join(os.tmpdir(), 'astrolark-clone-' + Date.now());
  console.log(chalk.cyan(`Cloning repository to temporary directory: ${tempDir}`));

  try {
    await simpleGit().clone(url, tempDir);
    console.log(chalk.green('✔ Repository cloned successfully'));

    // Update the base path to the cloned repository
    options.basePath = tempDir;

    // Process the cloned repository
    if (options.command === 'read') {
      await processReadCommand(options);
    } else if (options.command === 'edit') {
      await processEditCommand(options);
    }

  } catch (error) {
    console.error(chalk.red('✘ Error cloning repository:', error instanceof Error ? error.message : 'Unknown error'));
  } finally {
    // Clean up: remove the temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log(chalk.cyan('Temporary directory cleaned up'));
    } catch (cleanupError) {
      console.error(chalk.yellow('Warning: Failed to clean up temporary directory:', cleanupError instanceof Error ? cleanupError.message : 'Unknown error'));
    }
  }
}

async function processReadCommand(options: AstrolarkOptions): Promise<void> {
  const { content, ignoredFiles } = generateOverview(options.basePath, options.filterRules);

  const tokenCount = encodeTokens(content).length;

  if (options.output) {
    const outputPath = path.isAbsolute(options.output) ? options.output : path.join(options.basePath, options.output);
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

  const gitignoreSkipped = [...ignoredFiles.entries()].filter(([_, reasons]) => reasons.includes('ignored by .gitignore'));
  const filterSkipped = [...ignoredFiles.entries()].filter(([_, reasons]) => reasons.includes('excluded by filter rules'));

  if (gitignoreSkipped.length > 0) {
    console.log(chalk.yellow(`ℹ ${gitignoreSkipped.length} files skipped due to .gitignore rules`));
  }

  if (filterSkipped.length > 0) {
    console.log(chalk.yellow(`ℹ ${filterSkipped.length} files skipped due to filter rules`));
  }

  console.log(chalk.yellowBright(`Token count: ${tokenCount}`));

  if (options.verbose) {
    console.log(chalk.cyan('\nVerbose output:'));
    console.log(chalk.dim(JSON.stringify(options, null, 2)));
  }
}

async function processEditCommand(options: AstrolarkOptions): Promise<void> {
  try {
    const clipboardContent = await clipboardy.read();
    const context = { rootDir: options.basePath, verbose: options.verbose };

    await applyEdits(clipboardContent, context);

    console.log(chalk.green('✔ Edits applied successfully'));
  } catch (err) {
    console.error(chalk.red('✘ Error applying edits:', err instanceof Error ? err.message : 'Unknown error'));
  }
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .command('edit', 'Edit files based on Astrolark syntax in clipboard')
    .command('read', 'Read files to compress')
    .option('wizard', {
      alias: 'w',
      type: 'boolean',
      description: 'Run the interactive wizard',
      default: false
    })
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
    .option('include', {
      alias: 'i',
      type: 'array',
      description: 'Specify paths to include (applied in order)',
      default: []
    })
    .option('exclude', {
      alias: 'e',
      type: 'array',
      description: 'Specify paths to exclude (applied in order)',
      default: []
    })
    .option('github-url', {
      alias: 'g',
      type: 'string',
      description: 'GitHub repository URL to clone and process',
    })
    .help()
    .alias('help', 'h')
    .parse() as unknown as Partial<AstrolarkOptions> & { include?: string[], exclude?: string[], wizard?: boolean };

  let options: AstrolarkOptions;

  if (argv.wizard || (!argv.command && process.argv.length <= 2)) {
    // Run the wizard if explicitly requested or if no arguments were provided
    const wizardOptions = await runWizard();
    options = processOptions(wizardOptions);
  } else {
    options = processOptions(argv);
  }

  console.log(chalk.cyan('Command execution starting...\n'));
  if (options.verbose) {
    console.log('Verbose mode enabled. Dumping options object:', options);
  }

  if (options.githubUrl) {
    await cloneAndProcess(options.githubUrl, options);
  } else {
    if (options.command === 'edit') {
      await processEditCommand(options);
    } else if (options.command === 'read') {
      await processReadCommand(options);
    } else {
      console.log(chalk.red('Invalid command. Use --help to see available commands.'));
    }
  }
}

main().catch(error => console.error(chalk.red('✘ Error:', error instanceof Error ? error.message : 'Unknown error')));
