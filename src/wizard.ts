import { input, confirm, select } from '@inquirer/prompts';
import chalk from 'chalk';
import boxen from 'boxen';

export async function runWizard() {
  console.log(boxen(chalk.cyan('Welcome to Astrolark!\n\nAstrolark helps you generate context for your project so you can easily ask questions about it using an LLM.\n\nThis interactive wizard will guide you through the options and provide a non-interactive shortcut for future use.'), {padding: 1, margin: 1, borderStyle: 'round'}));

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

  const options = {
    command,
    verbose,
    output: output || undefined,
    basePath,
  };

  console.log(chalk.green('\nYou can use the following command to run Astrolark with these options non-interactively:'));
  console.log(chalk.yellow(`npx astrolark ${command} ${verbose ? '--verbose' : ''} ${output ? `--output ${output}` : ''} --base-path "${basePath}" --no-wizard`));

  return options;
}
