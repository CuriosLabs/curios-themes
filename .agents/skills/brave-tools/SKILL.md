---
name: brave-tools
description:
 Brave browser automation CLI for AI agents. Use when the user needs to interact
 with websites, including navigating pages, filling forms, clicking buttons, taking
 screenshots, extracting data, testing web apps, or automating any browser task.
 Triggers include requests to "open a website", "fill out a form", "click a button",
 "take a screenshot", "scrape data from a page", "test this web app",
 "login to a site", "automate browser actions", or any task requiring programmatic
 web interaction.
metadata:
  author: CuriosLabs
  version: "1.1.0"
---

# Brave browser Tools Skill

This skill provides a set of tools to interact with an existing Brave browser
instance running with remote debugging enabled.

## Commands and Usage

The `brave-tool` command is a wrapper for several browser automation tasks:

1. **List Tabs**: Show all open tabs with their indices, titles, and URLs.

   ```bash
   ./scripts/brave-tool list-tabs
   ```

2. **Open URL**: Open a URL in a new tab.

   ```bash
   ./scripts/brave-tool open-url <url>
   ```

3. **Navigate**: Navigate the current tab to a URL.

   ```bash
   ./scripts/brave-tool navigate <url>
   ```

4. **Reload/Back/Forward**: Control browser history.

   ```bash
   ./scripts/brave-tool reload
   ./scripts/brave-tool back
   ./scripts/brave-tool forward
   ```

5. **Click**: Click an element by its CSS selector.

   ```bash
   ./scripts/brave-tool click <selector>
   ```

6. **Click Text**: Click a button or link containing specific text.

   ```bash
   ./scripts/brave-tool click-text "Login"
   ```

7. **Hover**: Hover over an element by its CSS selector.

   ```bash
   ./scripts/brave-tool hover <selector>
   ```

8. **Fill**: Type text into an input field (appends to existing text).

   ```bash
   ./scripts/brave-tool fill <selector> <value>
   ```

9. **Clear**: Clear an input field.

   ```bash
   ./scripts/brave-tool clear <selector>
   ```

10. **Press Key**: Press a specific keyboard key (e.g., Enter, Tab, Escape).

    ```bash
    ./scripts/brave-tool press-key "Enter"
    ```

11. **Scroll**: Scroll the page by a specific amount (default 500px).

    ```bash
    ./scripts/brave-tool scroll [amount]
    ```

12. **Extract**: Get the inner text of an element.

    ```bash
    ./scripts/brave-tool extract <selector>
    ```

13. **Get HTML**: Get the outer HTML of an element or the whole page.

    ```bash
    ./scripts/brave-tool get-html [selector]
    ```

14. **Screenshot**: Take a screenshot of the current page.

    ```bash
    ./scripts/brave-tool screenshot <filename.png>
    ```

15. **Accessibility Snapshot**: Get a semantic tree of the page (great for AI).

    ```bash
    ./scripts/brave-tool accessibility-snapshot
    ```

16. **Eval**: Execute custom JavaScript in the browser context.

    ```bash
    ./scripts/brave-tool eval "window.location.href"
    ```

17. **Switch Tab**: Bring a specific tab to the front by its index.

    ```bash
    ./scripts/brave-tool switch-tab <index>
    ```

18. **Close Tab**: Close the current tab.

    ```bash
    ./scripts/brave-tool close-tab
    ```

## Targeting Specific Tabs

By default, commands target the **first tab (index 0)**.
To target a different tab, use the `BROWSER_TAB_INDEX` environment variable:

```bash
BROWSER_TAB_INDEX=2 ./scripts/brave-tool click "#my-button"
```

Use `list-tabs` to find the correct index.

## When to use me

- When you need to interact with a website (e.g., search for something).
- When you need to fill forms or automate repetitive web tasks.
- When you need to extract specific data from a web page.
- When you need visual confirmation of a web page state (screenshot).
- When you need to understand the semantic structure of a page (accessibility-snapshot).

## Important Notes

- **Automatic Launch**: The `brave-tool` script will automatically try to start
  Brave with remote debugging on port 9222 if it's not already running.
- **Dependency Management**: The script will also check for `puppeteer-core` and
  install it globally if it's missing.
- The tools use `puppeteer-core` to connect to the browser.
- Commands are executed from the skill root using the `./scripts/brave-tool`
  wrapper.
