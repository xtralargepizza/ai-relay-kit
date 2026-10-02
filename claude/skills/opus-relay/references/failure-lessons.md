# Failure lessons from the Codex Relay (Sep–Oct 2026)

Each line: what happened → the rule that prevents it. Sources: IMVU chats `01a0f3c9…` (Analyze derived opacity examples), `01a0e242…` (Review IMVU handoff and assets), `01a0f72f…` (ten-outfit batch).

1. **Deadlock by contradictory constraints.** Fit evidence was required while the AI step that created it was forbidden; workers reported "blocked". → Check that the brief's own rules permit the requested work before dispatch.
2. **Intermediates displaced the deliverable.** Hours of AI mannequin pictures, inventories and reports; zero opacity maps. → Name the deliverable and a does-not-count list. Count only delivered artifacts.
3. **Same failure repeated under new IDs.** Six outfits' AI fit jobs failed for one shared cause (provider altered the body / duplicated side views). → Two-failure rule across items; change the mechanism.
4. **First-result rule became a batch freeze.** Everyone waited while one shoulder seam was polished. → After the first end-to-end result, item-level defects get one owner; the rest continue.
5. **Idle workers, "message sent" treated as "running".** → Verify the next actual artifact or tool event, not delivery of a message.
6. **Claimed a restart before seeing the tool response.** → Never report an action whose result has not been observed.
7. **Stacked steering files and stale progress fields.** BRIEF, STEERING, RESUME, ACTUAL-DELIVERY, CURRENT-BRIEF all coexisted; counters contradicted each other. → One BRIEF.md and one STATUS.json, edited in place.
8. **Orchestrator overhead dominated.** Provider calls took ~25 s; leases, handoffs and reviews took 20+ minutes. The parent kept polling and re-checking. → Background agents + notifications; orchestrator verifies artifacts, does not supervise keystrokes.
9. **Over-reviewing / infrastructure as deliverable.** "39 minutes" produced recipes and validators but no outfit. Release checks dragged after tests passed. → Infrastructure work only when a concrete deliverable needs it; stop polishing once acceptance passes.
10. **Technical checks mistaken for quality.** Hashes, dimensions and preserved alpha passed while the artwork was rejected. → Grade the actual visual result against the reference first; technical checks are constraints, not approval.
11. **Prompt labels treated as constraints.** "HARD/PRIMARY guide" did not stop the image model from inventing seams or moving hems. → Enforce geometry deterministically (code, masks, compositing); let AI work only where variation is allowed.
12. **Old outputs shown as new progress.** Lara/Candice were re-shown as batch progress. → Label reused outputs; never count them.
13. **Fixation on one example.** Skirt polish loops while tops, pants and sleeves waited; the user wanted a general system. → Rotate examples; test whether the method generalizes.
14. **Tasks conflated.** A canceled full-body painting experiment was merged into the regular torso/bottoms/sleeves trials. → Keep separately requested workstreams separate in BRIEF.md.
15. **Uncertain paid outcomes.** HTTP 502 "error consuming credits" with no task id; a wrapper named 2K outputs "1.5k". → Keep receipts, reconcile before retry, inspect real output dimensions/metadata.
16. **Unverified inherited claims.** Earlier "passed" receipts were later found stale (e.g. pants "gaps" were unused UV, not missing cloth). → Test a claim before relying on it; record in VERIFIED.md.
17. **Ignored owner decisions.** The owner said "no AI gen on mannequin" (2026-09-29) yet the gate still required AI fit pictures. → Latest owner decision overrides older written rules; surface the conflict once if a tool still enforces the old rule.
18. **Unbounded fix loop (IMVU BodyShape, 2026-10-01/02).** About 130 build rounds and 6–7 hours on one body; builder runs of 25–100 minutes; five checker passes on the same glute region while the owner had not yet said whether the overall shape was right. The owner then rejected the lower body anyway. → Write a wall-time and round cap in the brief and every packet; after two fix passes on one region stop and offer different approaches; get the owner's taste call on the first clean version before polishing.
