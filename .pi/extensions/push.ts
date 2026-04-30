import type { ExecResult, ExtensionAPI } from "@mariozechner/pi-coding-agent";

const USER_MESSAGE = "Please push this worktree.";
const STATUS_COMMAND = "git status --short --branch";
const BRANCH_COMMAND = "git branch --show-current";
const UPSTREAM_COMMAND = "git rev-parse --abbrev-ref --symbolic-full-name @{u}";
const TIMEOUT_MS = 120_000;

function block(label: string, value: string): string {
	return [`${label}:`, "```", value.trimEnd(), "```"].join("\n");
}

function shellQuote(value: string): string {
	return "'" + value.replace(/'/g, "'\\''") + "'";
}

function commandFailureMessage(command: string, result: ExecResult): string {
	return [
		"The deterministic `/push` command failed. Diagnose and handle the failure.",
		"",
		`Command: \`${command}\``,
		`Exit code: ${result.code}${result.killed ? " (killed)" : ""}`,
		"",
		block("stdout", result.stdout || "<empty>"),
		"",
		block("stderr", result.stderr || "<empty>"),
	].join("\n");
}

function dirtyWorktreeMessage(status: string): string {
	return [
		"The user asked to push this worktree, but the worktree has uncommitted changes.",
		"",
		"Do not run the push yet. Explain to the user that `git push` only pushes committed history, not local working-tree changes. Give concise next-step suggestions, such as reviewing the diff, committing the changes, stashing them, or discarding them if unwanted.",
		"",
		block(STATUS_COMMAND, status || "<empty>"),
	].join("\n");
}

function detachedHeadMessage(status: string): string {
	return [
		"The user asked to push this worktree, but Git is currently in detached HEAD state.",
		"",
		"Do not run a deterministic push. Explain the situation and suggest creating or switching to a branch before pushing, unless the user explicitly provides a target ref.",
		"",
		block(STATUS_COMMAND, status || "<empty>"),
	].join("\n");
}

function buildPushCommand(branch: string, upstream: string): { command: string; target: string } {
	const trimmedUpstream = upstream.trim();
	if (trimmedUpstream) {
		const slash = trimmedUpstream.indexOf("/");
		if (slash > 0) {
			const remote = trimmedUpstream.slice(0, slash);
			const remoteBranch = trimmedUpstream.slice(slash + 1);
			return {
				command: `GIT_TERMINAL_PROMPT=0 git push ${shellQuote(remote)} HEAD:${shellQuote(remoteBranch)}`,
				target: trimmedUpstream,
			};
		}

		return { command: "GIT_TERMINAL_PROMPT=0 git push", target: trimmedUpstream };
	}

	return {
		command: `GIT_TERMINAL_PROMPT=0 git push -u origin HEAD:${shellQuote(branch)}`,
		target: `origin/${branch}`,
	};
}

export default function pushExtension(pi: ExtensionAPI) {
	pi.registerCommand("push", {
		description: "Push the current branch to its upstream, or create origin/<branch> upstream",
		handler: async (_args, ctx) => {
			await ctx.waitForIdle();

			// Persist the request without asking the LLM what command to run.
			pi.sendMessage({
				customType: "push",
				content: USER_MESSAGE,
				display: true,
				details: { kind: "request" },
			});

			ctx.ui.setStatus("push", "checking worktree");
			let currentCommand = STATUS_COMMAND;
			try {
				const status = await pi.exec("bash", ["-lc", currentCommand], {
					cwd: ctx.cwd,
					timeout: 10_000,
				});

				if (status.code !== 0) {
					pi.sendMessage(
						{
							customType: "push",
							content: commandFailureMessage(currentCommand, status),
							display: true,
							details: { kind: "preflight-failure", command: currentCommand, result: status },
						},
						{ triggerTurn: true },
					);
					return;
				}

				const changedLines = status.stdout
					.split("\n")
					.map((line) => line.trimEnd())
					.filter((line) => line && !line.startsWith("##"));

				if (changedLines.length > 0) {
					pi.sendMessage(
						{
							customType: "push",
							content: dirtyWorktreeMessage(status.stdout),
							display: true,
							details: { kind: "dirty-worktree", command: STATUS_COMMAND, status: status.stdout },
						},
						{ triggerTurn: true },
					);
					return;
				}

				currentCommand = BRANCH_COMMAND;
				const branch = await pi.exec("bash", ["-lc", currentCommand], {
					cwd: ctx.cwd,
					timeout: 10_000,
				});

				if (branch.code !== 0) {
					pi.sendMessage(
						{
							customType: "push",
							content: commandFailureMessage(currentCommand, branch),
							display: true,
							details: { kind: "branch-failure", command: currentCommand, result: branch },
						},
						{ triggerTurn: true },
					);
					return;
				}

				const branchName = branch.stdout.trim();
				if (!branchName) {
					pi.sendMessage(
						{
							customType: "push",
							content: detachedHeadMessage(status.stdout),
							display: true,
							details: { kind: "detached-head", status: status.stdout },
						},
						{ triggerTurn: true },
					);
					return;
				}

				currentCommand = UPSTREAM_COMMAND;
				const upstream = await pi.exec("bash", ["-lc", currentCommand], {
					cwd: ctx.cwd,
					timeout: 10_000,
				});

				const push = buildPushCommand(branchName, upstream.code === 0 ? upstream.stdout : "");
				currentCommand = push.command;
				ctx.ui.setStatus("push", `pushing → ${push.target}`);
				const result = await pi.exec("bash", ["-lc", currentCommand], {
					cwd: ctx.cwd,
					timeout: TIMEOUT_MS,
				});

				if (result.code === 0) {
					pi.sendMessage({
						customType: "push",
						content: `Pushed current branch \`${branchName}\` to \`${push.target}\`.`,
						display: true,
						details: { kind: "success", command: currentCommand, target: push.target, result },
					});
					ctx.ui.notify(`Pushed ${branchName} to ${push.target}.`, "info");
					return;
				}

				pi.sendMessage(
					{
						customType: "push",
						content: commandFailureMessage(currentCommand, result),
						display: true,
						details: { kind: "failure", command: currentCommand, target: push.target, result },
					},
					{ triggerTurn: true },
				);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				pi.sendMessage(
					{
						customType: "push",
						content: [
							"The deterministic `/push` command could not be started. Diagnose and handle the failure.",
							"",
							`Command: \`${currentCommand}\``,
							"",
							block("error", message),
						].join("\n"),
						display: true,
						details: { kind: "error", command: currentCommand, error: message },
					},
					{ triggerTurn: true },
				);
			} finally {
				ctx.ui.setStatus("push", undefined);
			}
		},
	});
}
