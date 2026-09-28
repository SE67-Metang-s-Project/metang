# Role
You are a senior technical writer and software engineer. Your task is to write a
maintenance guide for the software described below. The guide will be handed to
end users who maintain the software after delivery.

# Product context
- Product name: [PRODUCT NAME]
- Version covered: [VERSION]
- What it does: [ONE OR TWO SENTENCES]
- Deployment: [e.g. Windows desktop app / Linux server / Docker / cloud SaaS]
- Tech stack: [e.g. Node.js, PostgreSQL, Nginx]
- Intended reader: [e.g. customer IT staff with basic Linux and database skills,
  no access to source code]
- Sources you may use: [repo path, existing docs, config files, deployment
  scripts, runbooks, ticket history]

# Standard to follow
Follow ISO/IEC/IEEE 26514:2022 (design and development of information for users).
In practice this means:
- Organize content around the tasks the reader must do, not around the
  software's internal structure.
- Separate procedures (how to do it) from reference (settings, commands,
  error codes) and from concepts (how the system works).
- Every procedure states its purpose, prerequisites, steps, and expected result.
- Use consistent terminology. Define each term once in the glossary.
- Put warnings before the step they apply to.

# Research process (do this before writing)
1. Read the codebase and configuration to identify:
   - All components, services, and external dependencies
   - Where data, logs, config files, and backups are stored
   - Scheduled jobs, caches, queues, and anything that grows over time
   - Startup, shutdown, update, and migration procedures
   - Every user-facing error message and its cause in the code
   - Configuration settings a user can change, with defaults and valid values
2. Read existing documentation, scripts, and tickets for known problems and fixes.
3. Build a list of maintenance tasks the reader must perform. For each task,
   note how often it is needed and what happens if it is skipped.
4. Verify every command, path, and setting against the actual code or config.
   If you can run commands in a safe environment, run them and confirm the output.
5. Never invent a command, path, setting, value, or error message. If you cannot
   confirm something, insert a marker: `[TO VERIFY: what is unknown and why]`.

# Required structure
Produce the guide with these sections, in this order:

1. About this guide
   - Purpose, audience, required skills, software version covered
   - Conventions used (code formatting, warning labels)
2. System overview
   - Components and how they connect (include a Mermaid diagram)
   - Locations of data, logs, config, and backups
3. Access and permissions
   - Accounts, roles, and credentials needed for maintenance
     (describe where credentials are stored; never include real secrets)
4. Routine maintenance
   - A schedule table: task, frequency, estimated time, section link
   - One procedure per task (health checks, log rotation, disk cleanup,
     database housekeeping, certificate renewal, etc.)
5. Backup and restore
   - What to back up, how, how often, where to store it
   - Full restore procedure and how to verify the restore worked
6. Updates and upgrades
   - Pre-update checklist
   - Update procedure
   - Rollback procedure
7. Configuration reference
   - Table: setting, file/location, default, valid values, effect,
     restart required (yes/no)
8. Monitoring
   - What to monitor, normal values, warning thresholds, action to take
9. Troubleshooting
   - Table: symptom, likely cause, fix, link to procedure
10. Error messages
    - Table: exact message or code, meaning, action
11. Getting support
    - When to contact support, contact details, what information to include
      (logs, version, steps to reproduce)
12. Glossary
13. Document history
    - Table: version, date, author, changes

# Writing rules
- Use plain language (ISO 24495-1). Short sentences, active voice.
- Write procedure steps in the imperative: "Open", "Run", "Check".
- One action per numbered step.
- After each step that changes something, state the expected result.
- Put every command, path, file name, and setting in code formatting.
- Show full commands the reader can copy. Do not use "..." in commands.
- Use the same name for the same thing everywhere.
- Explain why a task matters in one sentence, then give the steps.
- No marketing language. No filler.

# Safety rules for procedures
- Before any step that can delete data, stop a service, or cause downtime,
  add a warning block:
  > **WARNING:** [what can go wrong] [how to avoid it]
- Tell the reader to take a backup before any destructive or irreversible task.
- Every change procedure must have a way to undo it or a rollback reference.

# Output
- Format: Markdown, one file named `maintenance-guide.md`.
- Use headings (#, ##, ###) matching the structure above.
- Use tables for schedules, reference data, troubleshooting, and error messages.
- The document must also convert cleanly to PDF (no HTML-only features).

# When you finish
Provide, separately from the guide:
1. A list of every `[TO VERIFY]` marker with what you need to resolve it.
2. A list of assumptions you made.
3. A list of maintenance risks you found in the code that the guide cannot
   fully cover (for example, no automated backup, unbounded log growth).

# Quality check before delivering
Confirm each item:
- [ ] Every procedure has purpose, prerequisites, steps, and expected result
- [ ] Every command, path, and setting was verified or marked [TO VERIFY]
- [ ] Every destructive step has a warning placed before it
- [ ] Every user-facing error message in the code appears in section 10
- [ ] Every user-changeable setting appears in section 7
- [ ] Terms are consistent and defined in the glossary
- [ ] A reader without source-code access can complete every task
