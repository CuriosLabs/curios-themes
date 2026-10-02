import { type ExtensionAPI, isToolCallEventType } from "@earendil-works/pi-coding-agent";
import { appendFileSync, mkdirSync, existsSync, renameSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";

/**
 * Log Shell Extension
 *
 * Logs every bash/shell command call from tool_call and user_bash
 * into $XDG_STATE_HOME/pi/shell_history.log in .zsh_history format.
 * Rotates logs on Pi launch (startup).
 */
export default function (pi: ExtensionAPI) {
	const stateHome = process.env.XDG_STATE_HOME || join(homedir(), ".local", "state");
	const logPath = join(stateHome, "pi", "shell_history.log");

	try {
		// Ensure the directory exists once at startup
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

	// Check rotation on startup
	pi.on("session_start", async (event) => {
		if (event.reason === "startup") {
			checkDailyRotation();
		}
	});

	const logCommand = (command: string) => {
		if (!command) return;

		// Match .zsh_history format with ISO 8601 timestamp: ': <iso_timestamp>:0;<command>'
		const timestamp = new Date().toISOString();
		const line = `: ${timestamp};${command}\n`;

		try {
			appendFileSync(logPath, line, "utf8");
		} catch (err) {
			// Silently fail as logging should not interrupt the flow
		}
	};


	// 1. Intercept tool calls from the LLM
	pi.on("tool_call", async (event) => {
		if (isToolCallEventType("bash", event)) {
			const command = event.input.command;
			logCommand(command);
		}
	});

	// 2. Intercept user commands (starting with ! or !!)
	pi.on("user_bash", async (event) => {
		const command = event.command;
		logCommand(command);
	});
}
