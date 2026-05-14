import type { ExecResult, ExtensionAPI } from "@mariozechner/pi-coding-agent";

const DEFAULT_BASE = "main";
const FETCH_COMMAND = "git fetch --prune";
const STATUS_COMMAND = "git status --short --branch";
const LOCAL_BRANCHES_COMMAND = "git for-each-ref --format='%(refname:short)' refs/heads";
const REMOTE_BRANCHES_COMMAND = "git for-each-ref --format='%(refname:short)' refs/remotes";
const TIMEOUT_MS = 30_000;

type Candidate = {
	ref: string;
	ahead: number;
	behind: number;
	log: string;
	stat: string;
	mergeCheck: string;
	mergeCheckExitCode: number;
	lastCommitTime: number;
	lastCommitIso: string;
};

function block(label: string, value: string): string {
	return [`${label}:`, "```", value.trimEnd(), "```"].join("\n");
}

function shellQuote(value: string): string {
	return "'" + value.replace(/'/g, "'\\''") + "'";
}

async function run(pi: ExtensionAPI, cwd: string, command: string, timeout = TIMEOUT_MS): Promise<ExecResult> {
	return pi.exec("bash", ["-lc", command], { cwd, timeout });
}

function commandFailureMessage(command: string, result: ExecResult): string {
	return [
		"Please help with the branch merge workflow, but a deterministic preflight command failed. Diagnose the problem and tell the user what to do next.",
		"",
		`Command: \`${command}\``,
		`Exit code: ${result.code}${result.killed ? " (killed)" : ""}`,
		"",
		block("stdout", result.stdout || "<empty>"),
		"",
		block("stderr", result.stderr || "<empty>"),
	].join("\n");
}

function parseBranches(output: string): string[] {
	return output
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.filter((branch) => !branch.endsWith("/HEAD"));
}

async function mainTrackingStatus(pi: ExtensionAPI, cwd: string, base: string): Promise<string> {
	const remoteRef = `origin/${base}`;
	const exists = await run(pi, cwd, `git rev-parse --verify --quiet ${shellQuote(remoteRef)}`);
	if (exists.code !== 0) return `No remote tracking ref found for ${remoteRef}.`;

	const counts = await run(pi, cwd, `git rev-list --left-right --count ${shellQuote(remoteRef)}...${shellQuote(base)}`);
	if (counts.code !== 0) return `Could not compare ${base} with ${remoteRef}: ${counts.stderr || counts.stdout}`.trim();

	const [behindRaw, aheadRaw] = counts.stdout.trim().split(/\s+/);
	const behind = Number(behindRaw || 0);
	const ahead = Number(aheadRaw || 0);
	return `${base} is ${ahead} commit(s) ahead and ${behind} commit(s) behind ${remoteRef}.`;
}

async function collectCandidate(pi: ExtensionAPI, cwd: string, base: string, ref: string): Promise<Candidate | undefined> {
	const counts = await run(pi, cwd, `git rev-list --left-right --count ${shellQuote(base)}...${shellQuote(ref)}`);
	if (counts.code !== 0) return undefined;

	const [behindRaw, aheadRaw] = counts.stdout.trim().split(/\s+/);
	const behind = Number(behindRaw || 0);
	const ahead = Number(aheadRaw || 0);
	if (ahead <= 0) return undefined;

	const log = await run(pi, cwd, `git log --oneline --decorate -20 ${shellQuote(base)}..${shellQuote(ref)}`);
	const stat = await run(pi, cwd, `git diff --stat ${shellQuote(base)}...${shellQuote(ref)}`);
	const mergeCheck = await run(pi, cwd, `git merge-tree --write-tree ${shellQuote(base)} ${shellQuote(ref)}`);
	const lastCommit = await run(pi, cwd, `git log -1 --format=%ct%x09%cI ${shellQuote(ref)}`);
	const [ctRaw, ciso] = (lastCommit.stdout || "").trim().split(/\t/);
	const lastCommitTime = Number(ctRaw || 0);
	const lastCommitIso = ciso || "unknown";

	return {
		ref,
		ahead,
		behind,
		log: log.stdout || log.stderr,
		stat: stat.stdout || stat.stderr,
		mergeCheck: mergeCheck.stdout || mergeCheck.stderr,
		mergeCheckExitCode: mergeCheck.code,
		lastCommitTime: Number.isFinite(lastCommitTime) ? lastCommitTime : 0,
		lastCommitIso,
	};
}

function candidatesText(candidates: Candidate[]): string {
	if (candidates.length === 0) return "No branches appear to be ahead of the base branch.";

	return candidates
		.map((candidate, index) =>
			[
				`## Candidate ${index + 1}: ${candidate.ref}${index === 0 ? "  (most recent commit — recommended target)" : ""}`,
				`Ahead of base: ${candidate.ahead} commit(s)` ,
				`Behind base: ${candidate.behind} commit(s)`,
				`Last commit: ${candidate.lastCommitIso}`,
				`Merge check: ${candidate.mergeCheckExitCode === 0 ? "clean" : "conflict or error"}`,
				"",
				block(`git log --oneline ${DEFAULT_BASE}..${candidate.ref}`, candidate.log || "<empty>"),
				"",
				block(`git diff --stat ${DEFAULT_BASE}...${candidate.ref}`, candidate.stat || "<empty>"),
				"",
				block("git merge-tree --write-tree result", candidate.mergeCheck || "<empty>"),
			].join("\n"),
		)
		.join("\n\n");
}

function mergePrompt(base: string, status: string, mainStatus: string, candidates: Candidate[], target?: string): string {
	return [
		`Please review branches that may need merging into \`${base}\`.`,
		"",
		"请使用中文回复。",
		"",
		target ? `Requested target branch/ref: ${target}` : "Requested target branch/ref: not specified; choose from candidates.",
		"",
		"Goal:",
		`- Find branches that are ahead of \`${base}\` and decide whether they should be merged into \`${base}\`.`,
		"- **Merge at most one branch per invocation.** Candidates are pre-sorted by most recent commit time (newest first); prefer Candidate 1 unless it is unsafe, in which case fall through to the next one or refuse.",
		"- If the chosen branch is low-risk and clearly ready, merge it into the base branch locally and stop — do not proceed to other candidates in the same run.",
		"- If there is meaningful risk, conflicts, unclear intent, or missing checks, do not merge; explain the risk and recommended next step. Mention the other candidates briefly so the user knows what is pending, but still do not merge them now.",
		"- Prefer fast-forward merges when possible. Use a normal merge only when appropriate and explain why.",
		"- Do not push unless the user explicitly asks to push.",
		"- If there are no candidate branches and the base branch is ahead of its remote, suggest `/push`.",
		"- After a successful merge, suggest the user re-run `/merge` to handle the next branch.",
		"",
		block(STATUS_COMMAND, status || "<empty>"),
		"",
		block("base tracking status", mainStatus),
		"",
		candidatesText(candidates),
	].join("\n");
}

export default function mergeExtension(pi: ExtensionAPI) {
	pi.registerCommand("merge", {
		description: "Review branches ahead of main and merge safe ones into main",
		handler: async (args, ctx) => {
			await ctx.waitForIdle();
			ctx.ui.setStatus("merge", "scanning branches");

			try {
				const target = args.trim() || undefined;
				const base = DEFAULT_BASE;

				const fetch = await run(pi, ctx.cwd, FETCH_COMMAND, 60_000);
				if (fetch.code !== 0) {
					pi.sendUserMessage(commandFailureMessage(FETCH_COMMAND, fetch));
					return;
				}

				const status = await run(pi, ctx.cwd, STATUS_COMMAND);
				if (status.code !== 0) {
					pi.sendUserMessage(commandFailureMessage(STATUS_COMMAND, status));
					return;
				}

				const dirty = status.stdout
					.split("\n")
					.map((line) => line.trimEnd())
					.some((line) => line && !line.startsWith("##"));
				if (dirty) {
					pi.sendUserMessage(
						[
							`Please prepare a branch merge review, but do not merge yet because the worktree has uncommitted changes.`,
							"",
							"Explain that the user should commit, stash, or discard the changes before merging branches.",
							"",
							block(STATUS_COMMAND, status.stdout),
						].join("\n"),
					);
					return;
				}

				const baseExists = await run(pi, ctx.cwd, `git rev-parse --verify --quiet ${shellQuote(base)}`);
				if (baseExists.code !== 0) {
					pi.sendUserMessage(`Cannot find base branch \`${base}\`. Explain the problem and ask the user which branch should be used as the merge target.`);
					return;
				}

				const localBranches = await run(pi, ctx.cwd, LOCAL_BRANCHES_COMMAND);
				const remoteBranches = await run(pi, ctx.cwd, REMOTE_BRANCHES_COMMAND);
				const refs = [...new Set([...parseBranches(localBranches.stdout), ...parseBranches(remoteBranches.stdout)])]
					.filter((ref) => ref !== base && ref !== `origin/${base}`);
				const selectedRefs = target ? refs.filter((ref) => ref === target || ref.endsWith(`/${target}`)) : refs;

				const candidates: Candidate[] = [];
				for (const ref of selectedRefs) {
					const candidate = await collectCandidate(pi, ctx.cwd, base, ref);
					if (candidate) candidates.push(candidate);
				}
				// Strategy: only merge one branch per /merge call, prioritising the
				// branch whose tip commit is most recent. Sort newest → oldest so
				// Candidate 1 in the prompt is always the recommended target.
				candidates.sort((a, b) => b.lastCommitTime - a.lastCommitTime);

				const tracking = await mainTrackingStatus(pi, ctx.cwd, base);
				pi.sendUserMessage(mergePrompt(base, status.stdout, tracking, candidates, target));
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				pi.sendUserMessage(
					[
						"Please help with the branch merge workflow, but the merge extension failed before it could prepare the request.",
						"",
						block("error", message),
					].join("\n"),
				);
			} finally {
				ctx.ui.setStatus("merge", undefined);
			}
		},
	});
}
