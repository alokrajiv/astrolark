import { input, confirm } from '@inquirer/prompts';
import chalk from 'chalk';

export async function runWizard() {
  console.log(chalk.cyan('Welcome to Astrolark! Please choose an option:'));

  const command = await input({
    message: 'Enter command (edit/read):',
    validate: (value) => ['edit', 'read'].includes(value) ? true : 'Please enter either "edit" or "read"'
  });

  const verbose = await confirm({
    message: 'Enable verbose output?',
    default: false
  });

  let output;
  if (command === 'read') {
    output = await input({
      message: 'Enter the output file name/path (leave empty to copy to clipboard):',
    });
  }

  const basePath = await input({
    message: 'Enter base path for file operations (leave empty for current directory):',
    default: process.cwd()
  });

  return { command, verbose, output: output || undefined, basePath };
}