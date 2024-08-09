# 🚀 Astrolark

## TL;DR

Astrolark is a command-line tool that snapshots your project's structure and contents. Run `npx astrolark` in your project folder to start the interactive wizard, or use the non-interactive mode with command-line options. It automatically copies the overview to your clipboard or saves it to a file. Then, simply open your preferred AI assistant (like ChatGPT or Claude) in a web browser, paste the content, and start asking questions about your code. It's an effortless way to get AI insights on your project.

## Beam Up Your Code, Captain! 🖖

Astrolark is your trusty command-line companion for exploring and extracting the essence of your code base. Like the probes from sci-fi classics, it dives deep into your project, retrieves valuable information, and prepares it for your next mission - whether that's collaborating with AI or sharing with your crew.

### 🌟 Features

- **Warp-speed Scanning**: Beam up your entire project structure and file contents faster than you can say "Engage!"
- **AI-Ready Output**: Prepare your code for seamless integration with LLMs like Claude, ChatGPT, or Gemini
- **Mootta-Compatible**: Fits perfectly into your toolkit for Project Mootta workflows
- **Format Options**: Choose between YAML and XML output formats
- **Clipboard Integration**: Automatically copy the generated overview to your clipboard
- **Gitignore Respect**: Excludes files and directories based on your .gitignore rules
- **Binary File Detection**: Automatically skips binary files to keep your overview clean
- **Interactive Wizard**: Easy configuration with a user-friendly command-line interface
- **Non-Interactive Mode**: Use command-line options for quick scans without the wizard

### 🛸 Quick Start

Run Astrolark in your project directory:

```bash
npx astrolark
```

This will start the interactive wizard to guide you through the configuration options.

### 💫 Advanced Usage

Skip the wizard and use command-line options for quick scans:

```bash
npx astrolark read --verbose --output project_overview.astrolark.yaml --base-path "/path/to/project" --no-wizard
```

Available options:
- `read` or `edit`: Specify the command (required)
- `--no-wizard`: Skip the interactive wizard
- `--verbose`: Enable verbose output for debugging
- `--output <filename>`: Set a custom output filename (for 'read' command)
- `--base-path <path>`: Specify the base path for file operations

### 🌠 Why Astrolark?

In the vast universe of development tools, Astrolark stands out as your reliable probe, designed to:

1. Simplify code sharing and analysis
2. Boost productivity in AI-assisted workflows
3. Enhance collaboration across galaxies (or just teams)
4. Provide a quick, comprehensive view of your project

### 👽 Join the Crew

Found a glitch in the matrix? Have ideas for new features? We welcome all species to contribute!

- 🐛 [Report bugs](https://github.com/alokrajiv/astrolark/issues)
- 🚀 [Suggest improvements](https://github.com/alokrajiv/astrolark/pulls)
- 🌠 Star the repo if you find it useful!

### 📡 Stay in Orbit

- Follow the captain: [@AlokRajiv](https://x.com/AlokRajiv)
- Check our flight logs: [GitHub](https://github.com/alokrajiv)

### 📜 License

Astrolark is released under the MIT License. See the LICENSE file for more details.

Remember, in space, no one can hear you code... but with Astrolark, everyone can see it! 🌠