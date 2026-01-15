# Instructions

## Project Overview

OpenSilver is a monorepo containing several independent tools.

## Guidelines

* Use App Router, not Pages Router.
* Name files and directories in kebab-case.
* Use colors from `@src/app/globals.css`, not default Tailwind colors.
* Combine classNames using the `cn` utility, not string interpolation.
* If any of the guidelines above aren't followed in existing code, that's because it's old code; don't write yours based on it.

## Browser Automation

Use `agent-browser` for web automation. Run `agent-browser --help` for all commands.

Core workflow:
1. `agent-browser open <url>` - Navigate to page
2. `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
3. `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
4. Re-snapshot after page changes
