#!/usr/bin/env node
import chalk from 'chalk';
import boxen from 'boxen';
import clipboardy from 'clipboardy';
import { getOptions, generateShortcutCommand } from './wizard.js';
import { generateOverview } from './overviewGenerator.js';

async function main() {
  const options = await getOptions();
  const projectPath = process.cwd();
  const { content, ignoredFiles } = generateOverview(projectPath, options.format);
  
  if (options.copy) {
    try {
      await clipboardy.write(content);
      console.log(chalk.green('✔ Project overview copied to clipboard'));
    } catch (err) {
      console.error(chalk.red('✘ Error copying to clipboard:', err instanceof Error ? err.message : 'Unknown error'));
    }
  }
  
  const outputPath = options.output || `project_overview.astrolark.${options.format}`;
  console.log(chalk.blue(`✔ Project overview generated as ${chalk.bold(outputPath)}`));

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

  // Show the shortcut command only in wizard mode
  if (options.wizard !== false) {
    const shortcutCommand = generateShortcutCommand(options);
    console.log(chalk.magenta('\nNext time, use this command to skip the wizard:'));
    console.log(boxen(chalk.bold(shortcutCommand), {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'magenta'
    }));
  }
}

main().catch(error => console.error(chalk.red('✘ Error:', error instanceof Error ? error.message : 'Unknown error')));