import { type Plugin } from "@opencode-ai/plugin";
import { appendFileSync, mkdirSync, existsSync, renameSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";

/**
 * Log Shell Plugin for Opencode
 *
 * Logs every bash command call from tool_call and user commands
 * into $XDG_STATE_HOME/opencode/shell_history.log in .zsh_history format.
 * Rotates logs on startup.
 */
const LogShellPlugin: Plugin = async ({ directory }) => {
  const stateHome = process.env.XDG_STATE_HOME || join(homedir(), ".local", "state");
  const logPath = join(stateHome, "opencode", "shell_history.log");

  try {
    // Ensure the directory exists
    mkdirSync(dirname(logPath), { recursive: true });
  } catch (err) {
    // Silently fail
  }

  const checkDailyRotation = (maxFiles = 5) => {
    try {
      if (!existsSync(logPath)) return;
      const stats = statSync(logPath);
      if (stats.size === 0) return; // Don't rotate empty logs

      const lastModified = stats.mtime;
      const today = new Date();

      // If the log was last modified on a different day, rotate
      if (lastModified.toDateString() !== today.toDateString()) {
        // Shift existing rotated logs
        for (let i = maxFiles - 1; i >= 1; i--) {
          const oldPath = `${logPath}.${i}`;
          const nextPath = `${logPath}.${i + 1}`;
          if (existsSync(oldPath)) {
            renameSync(oldPath, nextPath);
          }
        }

        // Move current log to .1
        renameSync(logPath, `${logPath}.1`);
      }
    } catch (err) {
      // Silently fail as rotation should not interrupt the flow
    }
  };

  const logCommand = (command: string, description?: string) => {
    if (!command) return;

    // Match .zsh_history format: ': <iso_timestamp>;<command>'
    // If description is present, prepend it as a comment
    const timestamp = new Date().toISOString();
    let line = `: ${timestamp};${command}\n`;
    if (description) {
      line = `# ${description}\n${line}`;
    }

    try {
      appendFileSync(logPath, line, "utf8");
    } catch (err) {
      // Silently fail as logging should not interrupt the flow
    }
  };

  return {
    // 0. Check rotation when a session is created
    "session.created": async () => {
      checkDailyRotation();
    },

    // 1. Intercept tool calls from the LLM
    "tool.execute.before": async (
      input: { tool: string },
      output: { args?: { command?: string; description?: string } }
    ) => {
      if (input.tool === "bash") {
        const command = output.args?.command;
        const description = output.args?.description;
        if (command) logCommand(command, description);
      }
    },

    // 2. Intercept user commands from the TUI
    "tui.command.execute": async (input: { command: string }) => {
      logCommand(input.command);
    }
  };
};

export default LogShellPlugin;
