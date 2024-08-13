import { input, confirm, select } from '@inquirer/prompts';
import chalk from 'chalk';
import path from 'path';

export async function runWizard() {
  console.log(chalk.cyan('Welcome to Astrolark!\n'));
  console.log('Astrolark helps you generate context for your project so you can easily ask questions about it using an LLM.\n');
  console.log('This interactive wizard will guide you through the options and provide a non-interactive shortcut for future use.\n');

  const command = await select({
    message: 'Choose a command:',
    choices: [
      { name: 'Generate project overview', value: 'read' },
      { name: 'Edit files based on Astrolark syntax', value: 'edit' },
    ],
  });

  const verbose = await confirm({
    message: 'Enable verbose output?',
    default: false
  });

  let output = '';
  let filter: string[] = [];

  if (command === 'read') {
    output = await input({
      message: 'Enter the output file name/path (leave empty to copy to clipboard):',
    });

    let addMorePaths = true;
    while (addMorePaths) {
      const filterPath = await input({
        message: 'Enter a file or directory path to include (leave empty to finish):',
      });
      if (filterPath) {
        filter.push(filterPath);
      } else {
        addMorePaths = false;
      }
    }
    if (filter.length === 0) {
      filter = ['.'];
    }
  }

  const basePath = await input({
    message: 'Enter base path for file operations (leave empty for current directory):',
    default: process.cwd()
  });

  const options = {
    command,
    verbose,
    output,
    basePath,
    filter
  };

  console.log(chalk.green('\nYou can use the following command to run Astrolark with these options non-interactively:'));
  console.log(chalk.yellow(`npx astrolark ${command} ${verbose ? '--verbose' : ''} ${output ? `--output ${output}` : ''} --base-path "${basePath}" ${filter.map(f => `--filter "${f}"`).join(' ')}`));

  return options;
}
