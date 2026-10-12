# Continue the existing resume project into a usable app

Continue from the existing project and preserve its resume evidence, templates, drafts, review records and working processing logic. The earlier BUILD.md stopped short of the intended product: completing a resume through chat commands is a prototype, not the finished tool.

Build a simple browser app that I can use after this coding chat ends:

1. Add a resume, job description and optional supporting evidence through the page.
2. Select **Create draft**, see progress, and receive a tailored resume with traceable source checks. Flag unsupported claims and conflicting facts rather than inventing them.
3. Review changes and warnings, select **Request changes** or **Approve**, and download the resulting PDF. Keep a clear history of drafts and decisions. No application submission or email sending is required.

Reuse the existing pipeline behind this interface. Do not add more agents simply to build the interface. Add the actual application code, dependencies and launch files needed; do not stop at creating skills or instructions. Make reasonable reversible implementation choices and ask only for information that blocks progress.

Start with labeled synthetic data. Connect real AI processing through a supported runtime, checking credentials and costs first. My chat subscription may not cover API calls. If a connection is missing, finish the runnable demo and clearly mark the live-processing step as unconnected; do not show canned output as a real tailored resume. Keep keys server-side and do not send personal documents to new services without authorization.

Test the full path, a second fresh case after restarting, missing input, processing failures and the review controls. If scheduling remains part of the original requirements, implement and test a real scheduler with status and a pause control.

Finish with a launch link or launcher and START-HERE.md containing no more than three everyday-use steps. Record actual test evidence and remaining setup in DELIVERY-REPORT.md. Report READY only when the real processing works independently of this chat; otherwise report DEMO ONLY or the precise blocker. Demonstrate the tool, not just one finished PDF.
