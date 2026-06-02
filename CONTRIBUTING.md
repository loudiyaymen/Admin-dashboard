# Contribution & Branch Workflow Guide

This project uses three permanent branches with a strict promotion flow:

dev → staging → main

Each branch has a specific purpose, rules, and review requirements.
All contributors are expected to follow these rules to keep the project stable and reviewable.

Tech stack: JavaScript, Typescript, React Native

---

## 1. Base Development Standards (Applies to ALL Branches)

### Goals

- Readable code for any teammate
- Fast reviews
- Minimal bugs
- No over-engineering

---

### File-Level Documentation (Required)

Every file must start with a short comment explaining its purpose.

```js
// Displays the user profile screen and handles profile data loading.
```

Add a second line only if the file has constraints or assumptions.

---

### Project Structure

- Organize by feature
- Avoid dumping grounds (misc, randomUtils)
- One responsibility per file

```
/src
  /features
    /auth
    /profile
  /components
  /services
  /utils
```

---

### General Rules

- One responsibility per function
- Prefer functions under 50 lines
- Avoid files over 300 lines
- Max nesting depth: 3
- Remove commented-out code before merging

---

### Naming Conventions

- Prefer clarity over brevity
- No vague abbreviations

```ts
// Bad
fn1();
tmp;
data2;

// Good
fetchUserProfile();
userList;
isLoggedIn;
```

---

### React Native Guidelines

- One component per file
- Separate UI from business logic
- Extract reusable logic into hooks or helpers

```ts
useAuth();
ProfileScreen();
formatDate();
```

---

### Error Handling

- Never fail silently
- Always log with context
- User-facing errors must be readable

```ts
try {
  await loadProfile();
} catch (error) {
  console.error("Failed to load profile data", error);
}
```

---

### Formatting & Linting

- Prettier is mandatory
- Formatting is not debated
- Address lint warnings before merging

---

### Comments

- Explain why, not what
- Excessive comments usually mean refactoring is needed

```ts
// Required because the API returns inconsistent date formats
```

---

## 2. Branch-Specific Rules & Workflow

### dev Branch — Active Development

Purpose:

- Day-to-day development
- Experiments, features, refactors
- May be unstable

Who Can Push:

- Everyone on the team

Rules:

- Direct pushes allowed
- Code does not need to be perfect
- Temporary logs and TODOs allowed

Expectations:

- Code must build
- No intentional breaking of unrelated features
- Follow base standards

Workflow:
feature work → commit → push to dev

---

### staging Branch — Review & Integration

Purpose:

- Pre-release validation
- Integration testing
- Cleanup before production

Who Can Push:

- Dev Lead only

How Code Enters:

- Pull Request from dev to staging
- Approval required from maintainer

Rules:

- No direct pushes
- No experimental or unfinished features
- Remove debug logs and TODOs

Expectations:

- Features complete and reviewable
- Clean structure and style
- Clear commit history

Workflow:
dev → PR → review → staging

---

### main Branch — Stable / Release

Purpose:

- Stable, demo-ready code
- Final submissions
- Reference version

Who Can Push:

- Dev Lead only

How Code Enters:

- Pull Request from staging to main
- QA approval required
- Dev Lead merges

Rules:

- No direct pushes
- No unfinished features
- No debug logging or commented code

Expectations:

- Code builds without errors
- Stable and predictable behavior
- Safe for demos and submissions

Workflow:
staging → PR → QA approval → main

---

## 3. Commit Standards

Format:

```
<type>: short description
```

Allowed Types:

- feat
- fix
- refactor
- chore
- docs
- test

Good Examples:

```
feat: add profile screen layout
fix: prevent crash when user data is null
refactor: extract profile API logic into service
chore: configure prettier
docs: add project setup instructions
```

Bad Examples:

```
changes
final fix
stuff
working now
```

Rules:

- One logical change per commit
- Avoid combining unrelated changes
- Code should run at every commit

---

## 4. Pull Request Guidelines

PR descriptions should answer:

- What changed?
- Why was it needed?
- Any risks or limitations?

Keep PRs small and focused.

---

## 5. Golden Rule

Code, commits, and PRs should be understandable without explanation from the author.
