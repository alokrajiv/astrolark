import { input, confirm, select } from '@inquirer/prompts';
import chalk from 'chalk';
import boxen from 'boxen';
import path from 'path';

function removeQuotes(str: string): string {
  return str.replace(/^['"]|['"]$/g, '');
}

export async function runWizard() {
  console.log(boxen(chalk.cyan('Welcome to Astrolark!'), {padding: 1, margin: 1, borderStyle: 'round'}));
  console.log('Astrolark helps you generate context for your project so you can easily ask questions about it using an LLM.\n');
  console.log('This interactive wizard will guide you through the options and provide a non-interactive shortcut for future use.\n');

  const options: any = {};
  let commandString = 'npx astrolark';

  const updateCommandString = () => {
    console.log(chalk.yellow(`Current command: ${commandString}`));
  };

  options.command = await select({
    message: 'Choose a command:',
    choices: [
      { name: 'Read files to compress', value: 'read' },
      { name: 'Edit files based on Astrolark syntax', value: 'edit' },
    ],
  });
  commandString += ` ${options.command}`;
  console.log(chalk.dim(`Command selected: ${options.command}`));
  updateCommandString();

  console.log(chalk.cyan(`\nGreat! Let's configure the ${options.command} command.\n`));

  options.basePath = removeQuotes(await input({
    message: 'Enter the base path for file operations:',
    default: process.cwd(),
    validate: (input) => input.trim() !== '' || 'Base path cannot be empty'
  }));
  commandString += ` --base-path "${options.basePath}"`;
  console.log(chalk.dim(`Base path: ${options.basePath}`));
  updateCommandString();

  if (options.command === 'read') {
    console.log(chalk.cyan('\nNow, let\'s specify which files or directories to include in the overview.\n'));

    options.filter = [];
    let addMorePaths = true;
    while (addMorePaths) {
      const filterPath = await input({
        message: 'Enter a file or directory path to include (leave empty to finish):',
      });
      if (filterPath) {
        const cleanPath = removeQuotes(filterPath);
        const relativePath = path.relative(options.basePath, path.resolve(options.basePath, cleanPath));
        options.filter.push(relativePath);
        commandString += ` --filter "${relativePath}"`;
        console.log(chalk.dim(`Added filter: ${relativePath}`));
        updateCommandString();
      } else {
        addMorePaths = false;
      }
    }
    if (options.filter.length === 0) {
      options.filter = ['.'];
      commandString += ' --filter "."';
      console.log(chalk.dim(`Default filter: .`));
      updateCommandString();
    }

    console.log(chalk.cyan('\nLet\'s configure the output options.\n'));

    options.output = await input({
      message: 'Enter the output file name/path (leave empty to copy to clipboard):',
    });
    if (options.output) {
      commandString += ` --output "${options.output}"`;
      console.log(chalk.dim(`Output: ${options.output}`));
    } else {
      console.log(chalk.dim(`Output: Clipboard`));
    }
    updateCommandString();
  }

  console.log(chalk.cyan('\nAlmost done! Just a few more optional settings.\n'));

  options.verbose = await confirm({
    message: 'Enable verbose output?',
    default: false
  });
  if (options.verbose) {
    commandString += ' --verbose';
    console.log(chalk.dim(`Verbose: Yes`));
  } else {
    console.log(chalk.dim(`Verbose: No`));
  }
  updateCommandString();

  console.log(boxen(
    chalk.green('Wizard complete! You can use the following command to run Astrolark with these options:') +
    '\n\n' + chalk.yellow(commandString),
    {padding: 1, margin: 1, borderStyle: 'round'}
  ));

  console.log(chalk.cyan('\nExecuting the command...\n'));

  return options;
}
