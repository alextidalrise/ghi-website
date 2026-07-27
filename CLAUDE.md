# Working in this repo

## Git and worktrees

Agent sessions here often run in a worktree under `.claude/worktrees/`. Branch refs are
**shared across every worktree**, but each worktree has its own `HEAD` and its own index and
working tree. That combination is the source of the one git failure this repo has actually
suffered, so the rules below are not stylistic.

### Never check out `main` from inside a worktree

`main` is checked out in the primary checkout at `/home/ghi-website`. Git will refuse to
check it out a second time, and **that refusal is correct — do not work around it.**

On 2026-07-27 an agent ran this from a worktree:

```bash
git checkout -q main 2>/dev/null || git checkout -q -B main origin/main
git pull -q origin main 2>/dev/null
```

`git checkout main` failed for exactly the right reason, `2>/dev/null` discarded the message
saying so, and the `||` fallback escalated to `-B`, which force-moved the shared
`refs/heads/main`. Because the operation happened in a *different* worktree, the primary
checkout's `HEAD` reflog recorded nothing — `main` simply moved out from under it, leaving
its index and working tree pinned to the previous commit.

The result: for roughly four hours the primary checkout silently held pre-#104/#106 code
while `git status` reported what looked like a deliberate revert of two merged PRs. Anything
built, tested or dev-served there was stale. Production was unaffected only because Vercel
builds from GitHub.

**To read from `main`, don't switch to it:**

```bash
git show main:web/src/hooks.server.ts      # a file's content at main
git log --oneline main -5                  # inspect main's history
git diff main -- web/src                   # compare against main
git fetch origin main                      # update the remote-tracking ref only
```

**To sync the primary checkout**, move the ref and the tree together, from the primary
checkout itself:

```bash
git -C /home/ghi-website pull --ff-only
```

### Forbidden without explicit human instruction

- `git checkout -B <branch>` / `git branch -f <branch>` / `git update-ref` targeting a
  branch that may be checked out anywhere. These move a ref without moving the
  corresponding working tree.
- `git stash` / `git stash pop` bare. The stash stack is shared with every worktree and
  other sessions may be using it; you can pop someone else's work. Prefer a temporary WIP
  commit, or `git stash push -u -m "<unique-tag>"` and recover with `git stash apply <sha>`.
- `2>/dev/null` on a git command whose failure carries information. Suppressing the error is
  what turned a clear, correct refusal into a silent four-hour desync.
- `pkill -f "<pattern>"` where the pattern also matches the invoking shell's own command
  line — it kills the shell mid-script. Find the PID first and kill that.

### If a checkout looks desynced

The symptom is staged changes nobody authored, usually reverting recently merged work. The
check:

```bash
git -C /home/ghi-website diff-index --quiet HEAD || echo "OUT OF SYNC with HEAD"
```

A clean checkout exits 0 and prints nothing.

A `SessionStart` hook in `.claude/settings.json` runs this automatically and reports the
count of differing paths when there are any. Note that `.claude/` is gitignored, so that
hook is **local to each machine and does not travel with the repo** — a fresh clone won't
have it, and the command above is the manual equivalent. It resolves the main worktree via
`git worktree list` rather than a hardcoded path, so it works from any worktree and from the
primary checkout alike.

It reports rather than diagnoses: any uncommitted change trips it, including legitimate
work in progress. In this repo the primary checkout is normally clean, because agent work
happens in worktrees — so if it fires and you didn't author the changes, suspect the moved-ref
desync above.

Diagnose before repairing — confirm the content matches an ancestor commit and that nothing
unique would be lost:

```bash
git -C /home/ghi-website status --porcelain -uall     # expect only the desynced paths
git -C /home/ghi-website diff --cached <suspected-ancestor-sha>   # empty ⇒ nothing unique
```

Only then, and only with the human's agreement, because it discards on-disk content:

```bash
git -C /home/ghi-website reset --hard HEAD
git -C /home/ghi-website pull --ff-only    # the reset alone may leave you behind origin
```

That second command matters: a reset restores consistency with local `HEAD`, which may
itself be behind `origin/main`. Both steps were needed on 2026-07-27.
