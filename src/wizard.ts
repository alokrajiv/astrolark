import { input, confirm, select } from '@inquirer/prompts';
import chalk from 'chalk';
import boxen from 'boxen';
import path from 'path';

function clearLine() {
  process.stdout.moveCursor(0, -1);
  process.stdout.clearLine(1);
  process.stdout.cursorTo(0);
}

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
    clearLine();
    console.log(chalk.yellow(`Current command: ${commandString}`));
  };

  options.command = await select({
    message: 'Choose a command:',
    choices: [
      { name: 'Generate project overview', value: 'read' },
      { name: 'Edit files based on Astrolark syntax', value: 'edit' },
    ],
  });
  commandString += ` ${options.command}`;
  updateCommandString();

  console.log(chalk.cyan(`\nGreat! Let's configure the ${options.command} command.\n`));

  options.basePath = removeQuotes(await input({
    message: 'Enter the base path for file operations:',
    default: process.cwd(),
    validate: (input) => input.trim() !== '' || 'Base path cannot be empty'
  }));
  commandString += ` --base-path "${options.basePath}"`;
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
        updateCommandString();
      } else {
        addMorePaths = false;
      }
    }
    if (options.filter.length === 0) {
      options.filter = ['.'];
      commandString += ' --filter "."';
      updateCommandString();
    }

    console.log(chalk.cyan('\nLet\'s configure the output options.\n'));

    options.output = await input({
      message: 'Enter the output file name/path (leave empty to copy to clipboard):',
    });
    if (options.output) {
      commandString += ` --output "${options.output}"`;
      updateCommandString();
    }
  }

  console.log(chalk.cyan('\nAlmost done! Just a few more optional settings.\n'));

  options.verbose = await confirm({
    message: 'Enable verbose output?',
    default: false
  });
  if (options.verbose) {
    commandString += ' --verbose';
    updateCommandString();
  }

  console.log(boxen(
    chalk.green('Wizard complete! You can use the following command to run Astrolark with these options:') +
    '\n\n' + chalk.yellow(commandString),
    {padding: 1, margin: 1, borderStyle: 'round'}
  ));

  return options;
}
