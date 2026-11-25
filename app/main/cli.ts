export type DndAction = boolean | "toggle";

export type CliOptions = {
  dnd?: DndAction;
  focus?: boolean;
  help?: boolean;
  version?: boolean;
};

function parseDndValue(value: string): DndAction | undefined {
  const normalized = value.toLowerCase().trim();
  switch (normalized) {
    case "true":
    case "1":
    case "on":
    case "yes": {
      return true;
    }

    case "false":
    case "0":
    case "off":
    case "no": {
      return false;
    }

    case "toggle": {
      return "toggle";
    }

    default: {
      return undefined;
    }
  }
}

function parseArgument(
  arg: string,
  nextArg: string | undefined,
  options: CliOptions,
): number {
  switch (arg) {
    case "-h":
    case "--help": {
      options.help = true;
      return 0;
    }

    case "-v":
    case "--version": {
      options.version = true;
      return 0;
    }

    case "-d":
    case "--dnd": {
      if (nextArg !== undefined && !nextArg.startsWith("-")) {
        const parsed = parseDndValue(nextArg);
        if (parsed !== undefined) {
          options.dnd = parsed;
          return 1;
        }
      }

      options.dnd = true;
      return 0;
    }

    case "--no-dnd": {
      options.dnd = false;
      return 0;
    }

    case "--toggle-dnd": {
      options.dnd = "toggle";
      return 0;
    }

    case "--focus": {
      options.focus = true;
      return 0;
    }

    case "--no-focus": {
      options.focus = false;
      return 0;
    }

    default: {
      if (arg.startsWith("--dnd=") || arg.startsWith("-d=")) {
        const value = arg.slice(arg.indexOf("=") + 1);
        const parsed = parseDndValue(value);
        if (parsed !== undefined) {
          options.dnd = parsed;
        }
      }

      return 0;
    }
  }
}

export function parseCommandLine(argv: readonly string[]): CliOptions {
  const options: CliOptions = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined || arg === "--") {
      continue;
    }

    i += parseArgument(arg, argv[i + 1], options);
  }

  return options;
}

export function printHelp(): void {
  console.log(`Zulip Desktop

Usage: zulip [options]

Options:
  -d, --dnd[=true|false|toggle]  Set or toggle Do Not Disturb mode
  --no-dnd                       Disable Do Not Disturb mode
  --toggle-dnd                   Toggle Do Not Disturb mode
  --focus                        Bring the application window to front
  --no-focus                     Do not bring the window to front
  -v, --version                  Show version number
  -h, --help                     Show help
`);
}
