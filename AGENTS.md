# Open Silver

## Overview

OpenSilver is a monorepo containing several independent tools.

## Guidelines

* If you see the Pages Router in use, that's because it's a legacy feature. Use App Router, not Pages Router.
* Use `bun`, not `npm` or `node`.
* Name files and directories in kebab-case.
* Define types, constants, and utils in the corresponding `types.ts`, `constants.ts`, and `utils.ts` file based on the tool you're developing.
* Use colors from `@src/app/globals.css`, not default Tailwind colors.
* Combine classNames using `cn` from `@src/lib/utils.ts`, not string interpolation.
* Comments are code smell, as the code should be self-explanatory. Try to avoid them unless necessary.
* If any of the guidelines above aren't followed in existing code, that's because it's old code; don't write yours based on it.

## Development Workflow

1. Run `bun tsc` after making changes and fix the errors, if any.
2. Use **Browser Automation** to test your changes as a real user and ensure they work as expected.
3. Done.

### Browser Automation

Use `agent-browser` for web automation. Run `agent-browser --help` for all commands.

Core workflow:
1. `agent-browser open <url>` - Navigate to page
2. `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
3. `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
4. Re-snapshot after page changes
