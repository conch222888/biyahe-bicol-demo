# Runbook

Every procedure is labelled **TESTED** (date, evidence link) or **UNTESTED**. An untested procedure is a recommendation, not a guarantee. Owner for all escalations: the founder.

| Scenario | Status | First actions |
|---|---|---|
| Failed CI or nightly job | UNTESTED | Open the run (`gh run view --log-failed`). If the failure is in the change, fix on the branch. If it is flaky or environmental, rerun once; a second failure becomes an issue. Never skip or delete the test. |
| Failed scheduled agent job | UNTESTED | Check the run's status and last output. Do not auto-retry more than once. Disable the schedule if it fails three runs in a row and raise an issue. |
| Failed staging deploy | UNTESTED | Staging keeps the previous version if the smoke test fails. Read the workflow log, fix forward on a branch. |
| Failed production deploy | UNTESTED | Founder reruns the production workflow with the previous release SHA. Confirm health checks. Then `/incident-review`. |
| Database restore | UNTESTED | TEMPLATE: provider-specific restore steps. Restore into a new instance first, verify row counts and latest records, then switch. Record the date this was last rehearsed. |
| Credential compromise | UNTESTED | Revoke and rotate the credential at the provider first, then update the secret store, then redeploy. Review access logs for the exposure window. Remove it from git history only after rotation. |
| Service outage | UNTESTED | Check provider status, recent deploys and error logs. Roll back if a deploy preceded it. Communicate to affected users. |
| Duplicate or inconsistent transactions | UNTESTED | Stop the job or webhook causing it. Export affected record IDs (no personal fields). Do not bulk-edit data from an agent session; the founder approves each repair, which is logged. Add the missing constraint and a regression test. |

## Escalation thresholds (proposed)
- Production unavailable or error rate above 5% for 5 minutes: act immediately.
- Any suspected duplicate payment, booking, order or financing record: act immediately.
- CI on the default branch red for more than one working day: prioritise over new features.
- AI spend at 75% of the monthly budget: review; at 100%: pause scheduled agent jobs.
