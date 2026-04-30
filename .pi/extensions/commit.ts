import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const STATUS_COMMAND = "git status --short --branch";
const BRANCHES_COMMAND = "git branch --list --format='%(refname:short)'";

function block(label: string, value: string): string {
	return [`${label}:`, "```", value.trimEnd(), "```"].join("\n");
}

function commitPrompt(intent: string, status: string, branches: string): string {
	return [
		"Please turn the current worktree changes into an appropriate Git commit.",
		"",
		`User intent: ${intent || "not specified; infer from the diff"}`,
		"",
		"Decide the correct branch strategy before committing:",
		"- Inspect the diff and recent context as needed.",
		"- If the current branch is already appropriate, commit there.",
		"- If this is a new feature or risky change on `main`, create a concise feature branch first, then commit there.",
		"- If a suitable existing branch is present, switch to it only if safe; otherwise explain the issue.",
		"- Choose a clear commit message yourself.",
		"- Stage and commit the relevant worktree changes.",
		"- Do not push unless the user explicitly asks to push.",
		"- If any git command fails, diagnose it and tell the user what to do next.",
		"",
		block(STATUS_COMMAND, status || "<empty>"),
		"",
		block(BRANCHES_COMMAND, branches || "<empty>"),
	].join("\n");
}

export default function commitExtension(pi: ExtensionAPI) {
	pi.registerCommand("commit", {
		description: "Ask the LLM to choose branch strategy and commit current changes",
		handler: async (args, ctx) => {
			await ctx.waitForIdle();
			ctx.ui.setStatus("commit", "preparing commit request");

			try {
				const status = await pi.exec("bash", ["-lc", STATUS_COMMAND], {
					cwd: ctx.cwd,
					timeout: 10_000,
				});

				if (status.code !== 0) {
					pi.sendUserMessage(
						[
							"Please help me create a Git commit, but the preflight status command failed. Diagnose the problem and tell me what to do next.",
							"",
							`Command: \`${STATUS_COMMAND}\``,
							`Exit code: ${status.code}${status.killed ? " (killed)" : ""}`,
							"",
							block("stdout", status.stdout || "<empty>"),
							"",
							block("stderr", status.stderr || "<empty>"),
						].join("\n"),
					);
					return;
				}

				const changedLines = status.stdout
					.split("\n")
					.map((line) => line.trimEnd())
					.filter((line) => line && !line.startsWith("##"));

				if (changedLines.length === 0) {
					ctx.ui.notify("No changes to commit.", "info");
					pi.sendMessage({
						customType: "commit",
						content: "No uncommitted worktree changes to commit.",
						display: true,
						details: { kind: "clean", status: status.stdout },
					});
					return;
				}

				const branches = await pi.exec("bash", ["-lc", BRANCHES_COMMAND], {
					cwd: ctx.cwd,
					timeout: 10_000,
				});

				pi.sendUserMessage(commitPrompt(args.trim(), status.stdout, branches.stdout || branches.stderr));
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				pi.sendUserMessage(
					[
						"Please help me create a Git commit, but the commit extension failed before it could prepare the request.",
						"",
						block("error", message),
					].join("\n"),
				);
			} finally {
				ctx.ui.setStatus("commit", undefined);
			}
		},
	});
}
