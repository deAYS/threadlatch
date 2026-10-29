# First-use evaluation protocol

Status: **ready to run; no participants tested**. This protocol does not establish a usability result.

Recruit five first-time users who already have a supported Node 22.12+ runtime and an authorized coding-agent account. Participants use their own accounts; do not share subscriptions, credentials or private chats. Ask consent to record anonymous timings, task outcomes and product friction. Record synthetic source text only. Keep names, contact details, account screenshots, personal paths and raw sessions outside public repository files.

## Coding-agent trial

Give the participant the tested preview source/tarball and [onboarding guide](../ONBOARDING.md). ThreadLatch must not be preinstalled in their target project. Use an empty disposable project. Start the timer before ThreadLatch installation; the already-supported runtime and agent are prerequisites rather than timed installation work.

Give the following tasks in the participant's preferred language. Do not type commands or JSON for them, choose proposal IDs, repair a model reply or coach them through a stuck step. The participant may ask their coding agent to perform routine setup using the documented instructions.

1. Set up ThreadLatch in the empty project using the onboarding guide.
2. Tell the coding agent: **“Remember this decision: use SQLite for local storage.”** / **“Bu kararı hatırla: yerel saklama için SQLite kullan.”**
3. Let the agent offer its concise batch review, then approve the intended decision. Record whether the participant had to edit JSON, handle identifiers or answer repeated per-item save questions.
4. Start a fresh agent session and say **“Pick up where we left off.”** / **“Kaldığımız yerden devam et.”** The agent must recover the saved SQLite decision with its user source.

Stop the first-cycle timer after step 4. Success requires setup, a source-linked save and correct new-session continuation **without facilitator coaching or participant-authored JSON**. The target is at least four of five successful first cycles within five minutes. A failure is still a useful result; do not reset its timer or exclude it from the denominator.

After timing, test the following separately:

- Add an assistant suggestion about cloud sync and a clearly labeled billing-screen example. Neither may become an approved active user requirement.
- Say “Replace SQLite with PostgreSQL; remember the correction.” A later handoff must not present SQLite as the current database choice.
- Ask the agent for a full JSON backup and a Markdown handoff. Confirm that the participant understands their different scope.
- Uninstall the project skill using the documented path. Check that memory and unrelated agent instructions remain intact.

## Chat/browser trial

Separately observe a participant who does not use terminals. Open the local preview for them before timing and use the synthetic example. Ask them to inspect a source, prepare a request, exchange it with their authorized chat tool, review the result and export a handoff. Copying a model-generated result is allowed; writing or fixing JSON is not. Record each point where the guide or UI leaves them unsure what to do. This group does not replace the five supported-agent trials above.

## Anonymous observation sheet

| Participant | Language | Agent/runtime versions | Setup seconds | First useful cycle seconds | Unassisted success | JSON/ID handling required | Friction / error stage |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P1 | Pending | Pending | — | — | Not run | Not run | Pending |
| P2 | Pending | Pending | — | — | Not run | Not run | Pending |
| P3 | Pending | Pending | — | — | Not run | Not run | Pending |
| P4 | Pending | Pending | — | — | Not run | Not run | Pending |
| P5 | Pending | Pending | — | — | Not run | Not run | Pending |

Publish aggregate outcomes and fixes after the observations. Do not turn an observer-run automation, developer walkthrough or provider benchmark into a first-time-human result.
