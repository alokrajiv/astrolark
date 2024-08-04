import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { input, confirm, select } from '@inquirer/prompts';
import chalk from 'chalk';

export interface Options {
  copy: boolean;
  output?: string;
  format: 'xml' | 'yaml';
  verbose: boolean;
  wizard: boolean;
}

const defaultOptions: Options = {
  copy: true,
  output: undefined,
  format: 'yaml',
  verbose: false,
  wizard: true
};

export async function getOptions(): Promise<Options> {
  const argv = await yargs(hideBin(process.argv))
    .option('wizard', {
      type: 'boolean',
      default: true,
      description: 'Run the interactive wizard',
    })
    .option('copy', {
      alias: 'c',
      type: 'boolean',
      description: 'Copy the output to clipboard',
    })
    .option('output', {
      alias: 'o',
      type: 'string',
      description: 'Specify the output file name/path',
    })
    .option('format', {
      alias: 'f',
      choices: ['xml', 'yaml'] as const,
      description: 'Output format',
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: 'Enable verbose output',
    })
    .help()
    .alias('help', 'h')
    .parse();

  if (argv.wizard === false) {
    return {
      copy: argv.copy ?? defaultOptions.copy,
      output: argv.output,
      format: (argv.format as 'xml' | 'yaml') ?? defaultOptions.format,
      verbose: argv.verbose ?? defaultOptions.verbose,
      wizard: false
    };
  }

  return promptForOptions();
}

async function promptForOptions(): Promise<Options> {
  console.log(chalk.cyan('Welcome to Astrolark! Please configure your options:'));

  const copy = await confirm({
    message: 'Copy the output to clipboard?',
    default: defaultOptions.copy
  });

  const outputChoice = await select({
    message: 'Choose the output file name/path:',
    choices: [
      { name: 'Default (project_overview.astrolark.[format])', value: 'default' },
      { name: 'Custom', value: 'custom' }
    ]
  });

  let output: string | undefined;
  if (outputChoice === 'custom') {
    output = await input({
      message: 'Enter the custom output file name/path:',
    });
  }

  const format = await select({
    message: 'Choose the output format:',
    choices: [
      { name: 'YAML', value: 'yaml' },
      { name: 'XML', value: 'xml' }
    ],
    default: defaultOptions.format
  }) as 'xml' | 'yaml';

  const verbose = await confirm({
    message: 'Enable verbose output?',
    default: defaultOptions.verbose
  });

  return { copy, output, format, verbose, wizard: true };
}

export function generateShortcutCommand(options: Options): string {
  const flags = Object.entries(options)
    .filter(([key, value]) => key !== 'wizard' && value !== defaultOptions[key as keyof Options])
    .map(([key, value]) => {
      if (typeof value === 'boolean') {
        return value ? `--${key}` : `--no-${key}`;
      }
      return `--${key} ${value}`;
    });

  return `astrolark --no-wizard ${flags.join(' ')}`.trim();
}