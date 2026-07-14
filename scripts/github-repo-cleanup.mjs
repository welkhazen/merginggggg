#!/usr/bin/env node
/**
 * Safely clean up GitHub repositories for an account or organization.
 *
 * Defaults to dry-run. The current repository is kept active and private,
 * non-current repositories are made private, likely duplicates are archived,
 * and repositories are deleted only when explicitly named.
 */

const args = parseArgs(process.argv.slice(2));
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const apiBase = process.env.GITHUB_API_URL || "https://api.github.com";

if (!token) exitWithUsage("Missing GITHUB_TOKEN or GH_TOKEN.");
if (!args.owner) exitWithUsage("Missing --owner <user-or-org>.");
if (!args.current) exitWithUsage("Missing --current <repo-name>.");

const dryRun = !args.apply;
const deleteNames = new Set(args.delete ?? []);
const duplicateNames = new Set(args.archive ?? []);

const repos = await listRepos(args.owner);
const current = repos.find((repo) => repo.name === args.current);
if (!current) {
  throw new Error(`Current repository '${args.current}' was not found under '${args.owner}'.`);
}

const groups = groupLikelyDuplicates(repos, current.name);
const likelyDuplicateNames = new Set([...duplicateNames, ...groups.flatMap((group) => group.slice(1).map((repo) => repo.name))]);

const actions = [];
for (const repo of repos) {
  if (repo.name === current.name) {
    if (!repo.private || repo.archived) {
      actions.push({ repo, method: "PATCH", path: repo.url, body: { private: true, archived: false }, reason: "keep current repo active and private" });
    }
    continue;
  }

  if (deleteNames.has(repo.name)) {
    actions.push({ repo, method: "DELETE", path: repo.url, reason: "explicitly named for deletion" });
    continue;
  }

  const body = {};
  if (!repo.private) body.private = true;
  if (!repo.archived && likelyDuplicateNames.has(repo.name)) body.archived = true;
  if (Object.keys(body).length > 0) {
    actions.push({ repo, method: "PATCH", path: repo.url, body, reason: likelyDuplicateNames.has(repo.name) ? "make private and archive likely duplicate" : "make non-current repo private" });
  }
}

if (actions.length === 0) {
  console.log(`No changes needed for ${args.owner}. Dry-run: ${dryRun}.`);
  process.exit(0);
}

console.log(`${dryRun ? "Dry run" : "Applying"} ${actions.length} action(s):`);
for (const action of actions) {
  console.log(`- ${action.method} ${action.repo.full_name}: ${action.reason}${action.body ? ` ${JSON.stringify(action.body)}` : ""}`);
  if (!dryRun) await request(action.method, action.path, action.body);
}

if (dryRun) {
  console.log("\nNo changes were made. Re-run with --apply to execute these actions.");
}

function parseArgs(argv) {
  const parsed = { delete: [], archive: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--apply") parsed.apply = true;
    else if (arg === "--owner") parsed.owner = argv[++i];
    else if (arg === "--current") parsed.current = argv[++i];
    else if (arg === "--delete") parsed.delete.push(...splitList(argv[++i]));
    else if (arg === "--archive") parsed.archive.push(...splitList(argv[++i]));
    else exitWithUsage(`Unknown argument: ${arg}`);
  }
  return parsed;
}

function splitList(value = "") {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

async function listRepos(owner) {
  const ownerProfile = await request("GET", `${apiBase}/users/${owner}`);
  const ownerType = ownerProfile.type === "Organization" ? "org" : "user";
  const repos = [];
  for (let page = 1; ; page += 1) {
    const path = ownerType === "org"
      ? `${apiBase}/orgs/${owner}/repos?per_page=100&page=${page}&type=all`
      : `${apiBase}/user/repos?per_page=100&page=${page}&visibility=all&affiliation=owner`;
    const batch = await request("GET", path);
    const ownedBatch = batch.filter((repo) => repo.owner?.login?.toLowerCase() === owner.toLowerCase());
    if (batch.length === 0) break;
    repos.push(...ownedBatch);
  }
  return repos.sort((a, b) => Date.parse(b.pushed_at || b.updated_at) - Date.parse(a.pushed_at || a.updated_at));
}

function groupLikelyDuplicates(repos, currentName) {
  const byBase = new Map();
  for (const repo of repos) {
    if (repo.name === currentName) continue;
    const base = repo.name.toLowerCase().replace(/[-_ ]?(copy|clone|backup|old|archive|duplicate|dupe|\d+)$/u, "");
    if (!byBase.has(base)) byBase.set(base, []);
    byBase.get(base).push(repo);
  }
  return [...byBase.values()].filter((group) => group.length > 1);
}

async function request(method, url, body) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return null;
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${method} ${url} failed with ${response.status}: ${text}`);
  }
  return data;
}

function exitWithUsage(message) {
  console.error(`${message}\n\nUsage: GITHUB_TOKEN=... node scripts/github-repo-cleanup.mjs --owner <owner> --current <repo> [--archive repo-a,repo-b] [--delete repo-c] [--apply]`);
  process.exit(1);
}
