import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { input, confirm, select } from '@inquirer/prompts';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the version from package.json
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
const version = packageJson.version;

export interface Options {
  copy: boolean;
  output?: string;
  format: 'xml' | 'yaml';
  verbose: boolean;
  wizard: boolean;
  edit: boolean;
}

const defaultOptions: Options = {
  copy: true,
  output: undefined,
  format: 'yaml',
  verbose: false,
  wizard: true,
  edit: false
};

export async function getOptions(): Promise<Options> {
  const argv = await yargs(hideBin(process.argv))
    .version(version)
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
    .option('edit', {
      alias: 'x',
      type: 'boolean',
      description: 'Edit files based on Astrolark syntax in clipboard',
    })
    .help()
    .alias('help', 'h')
    .parse();

  if (argv.edit) {
    return { ...defaultOptions, edit: true, wizard: false };
  }

  if (argv.wizard === false) {
    return {
      copy: argv.copy ?? defaultOptions.copy,
      output: argv.output,
      format: (argv.format as 'xml' | 'yaml') ?? defaultOptions.format,
      verbose: argv.verbose ?? defaultOptions.verbose,
      wizard: false,
      edit: false
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

  return { copy, output, format, verbose, wizard: true, edit: false };
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