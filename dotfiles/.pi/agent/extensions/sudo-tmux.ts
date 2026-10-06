import {
    type ExtensionAPI,
    isToolCallEventType,
    type UserBashEvent,
    type UserBashEventResult,
    createLocalBashOperations
} from "@earendil-works/pi-coding-agent";
import { writeFileSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";

/**
 * sudo-tmux extension
 *
 * Intercepts 'bash' tool calls starting with 'sudo' and runs them in a
 * tmux split-window if Pi is running inside a tmux session.
 *
 * This allows the user to interactively enter their password in the
 * split pane, while still capturing the output and exit code back
 * into Pi's bash tool.
 */
export default function (pi: ExtensionAPI) {
    // 1. Intercept tool calls from the LLM
    pi.on("tool_call", async (event, ctx) => {
        if (!isToolCallEventType("bash", event)) return;

        const command = event.input.command.trim();
        if (shouldIntercept(command)) {
            const rewritten = setupInterception(command, ctx);
            if (rewritten) {
                event.input.command = rewritten;
                // Disable timeout to allow for user interaction and long-running commands
                event.input.timeout = 0;
            }
        }
    });

    // 2. Intercept user commands (starting with ! or !!)
    pi.on("user_bash", async (event: UserBashEvent, ctx): Promise<UserBashEventResult | void> => {
        const command = event.command.trim();
        if (shouldIntercept(command)) {
            const rewritten = setupInterception(command, ctx);
            if (rewritten) {
                // For user_bash, we provide custom operations that execute the
                // rewritten command instead of the original one.
                const localOps = createLocalBashOperations();
                return {
                    operations: {
                        exec: (cmd, cwd, options) => {
                            // Ignore the original 'cmd' and use our 'rewritten' one
                            return localOps.exec(rewritten, cwd, options);
                        }
                    }
                };
            }
        }
    });
}

function shouldIntercept(command: string): boolean {
    return !!(command.startsWith("sudo ") && process.env.TMUX);
}

function setupInterception(command: string, ctx: any): string | undefined {
    const id = randomBytes(4).toString("hex");
    const scriptPath = join(tmpdir(), `pi-sudo-${id}.sh`);
    const outPath = join(tmpdir(), `pi-sudo-${id}.out`);
    const exitPath = join(tmpdir(), `pi-sudo-${id}.exit`);

    // Create a temporary script that runs the sudo command
    // and captures its output and exit status.
    const scriptContent = `#!/bin/sh
${command} > "${outPath}" 2>&1
echo $? > "${exitPath}"
`;

    try {
        writeFileSync(scriptPath, scriptContent);
        chmodSync(scriptPath, 0o700);

        if (ctx.hasUI) {
            ctx.ui.notify("sudo command detected, opening tmux pane for interaction...", "info");
        }

        // Rewritten command for pi's bash tool:
        // 1. Split the tmux window and run our helper script.
        // 2. Wait until the exit status file is written (meaning the command finished).
        // 3. Cat the output and exit with the correct status.
        // 4. Clean up temporary files.
        return `tmux split-window -h "sh ${scriptPath}" && ` +
            `while [ ! -s "${exitPath}" ]; do sleep 0.1; done && ` +
            `cat "${outPath}" ; ` +
            `RET=$(cat "${exitPath}") ; ` +
            `rm -f "${scriptPath}" "${outPath}" "${exitPath}" ; ` +
            `exit $RET`;

    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (ctx.hasUI) {
            ctx.ui.notify(`Failed to set up sudo-tmux interception: ${message}`, "error");
        }
        return undefined;
    }
}
