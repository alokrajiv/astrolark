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
    verbose: rawOptions.verbose || false
  };
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
      const { content, ignoredFiles } = generateOverview(projectPath, options.filterRules);

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

      const gitignoreSkipped = [...ignoredFiles.entries()].filter(([_, reasons]) => reasons.includes('ignored by .gitignore'));
      const filterSkipped = [...ignoredFiles.entries()].filter(([_, reasons]) => reasons.includes('excluded by filter rules'));

      if (gitignoreSkipped.length > 0) {
        console.log(chalk.yellow(`ℹ ${gitignoreSkipped.length} files skipped due to .gitignore rules`));
      }

      if (filterSkipped.length > 0) {
        console.log(chalk.yellow(`ℹ ${filterSkipped.length} files skipped due to filter rules`));
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
