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

## Dependency and security changes

* Maintainers update dependencies manually, in batches.
* Title dependency PRs, commits, and branches neutrally, e.g. `chore(deps): bump <pkg> to <version>`.
* Keep everything that lands in the repo or on GitHub (PRs, commits, branch names, comments, configs, changelogs, ignore files) free of advisory ids and of descriptions of code as vulnerable, unpatched, or exploitable.
* Do not add comments or ignore/allowlist entries that describe an unfixed issue.
* Raise security concerns with maintainers privately (see `SECURITY.md`), never in public issues, PRs, or discussions.
* Merge or close dependency update PRs promptly rather than leaving them open.

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
