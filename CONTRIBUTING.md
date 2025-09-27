# Contribution Guideline - Smishing Detection Backend

This document outlines the guidelines for contributing to the Smishing Detection backend project.  
**All contributions not following these guidelines will be discarded**.

## ⚡ How to Contribute

1. Create a task on Microsoft Planner
2. Create a feature branch from your fork's latest `main` branch
3. Make your changes
4. Commit with a clear message
5. Push to your fork and create a pull request to the `dev` branch of this repository.

## 📝 Microsoft Planner Task Guideline

To ensure all work is tracked and visible to the team, you should create a corresponding task in [Microsoft Planner](https://planner.cloud.microsoft/webui/v1/plan/7czycmBzFECF4PKTlRVqzcgADTOe?tid=d02378ec-1688-46d5-8540-1c28b5f470f6) before starting work on the task.  
**All Microsoft Planner tasks must follow the format outlined below:**

- **Title: Briefly describe the task (e.g., Add login route validation)**
- **Bucket:** Choose the relevant bucket (e.g., Backend, Frontend)
- **Assign To:** Yourself (and others involved, if applicable)
- **Start Date:** Pick a start date (the day you create the task or when you plan on starting work on the task)
- **Due Date:** Pick a reasonable deadline
- **Description: Include a clear scope of your task with a short summary and link to the GitHub PR when completed**
- **Checklist: Break the task down into subtasks and list the deliverables. Tick off when completed with a comment on your task to document your progress**

## 🌱 Branching Strategy

You should always branch off from the latest `main` branch in your fork.  
**Never commit directly to `main` or `dev` in this repository.**

### Branch Naming Convention

Use hyphen-separated lowercase names and your Microsoft Planner task name as part of your branch name as per the format outlined below.

**Format:**

```
<planner-task-name>/<name>
```

**Examples:**

```
oauth-implementation/john
fix-login-crash/mayer
```

## ✒️ Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) standard to keep our history clean and meaningful.

**Format:**

```
<type>(<scope>): <short description>
```

**Examples:**

```
feat(auth): add Google login support
fix(api): correct login flow
docs(readme): update setup instructions
chore(deps): bump dotenv from 0.21.1 to 0.24.0
```

**Common Types:**

- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- style: Code style (formatting, missing semi-colons, etc)
- refactor: Code change that neither fixes a bug nor adds a feature
- test: Adding or updating tests
- chore: Maintenance work (build tasks, package updates, etc)

**If there are multiple changes to many different files, please do not include all your changes in one single commit.  
Instead, break it down into smaller, more focused commits using the above listed format.**

## 🔃 Pull Requests

- **PRs should always target the `dev` branch unless stated otherwise.**
- Make sure your branch is up to date with `dev` before opening a PR.
- **Describe what your PR does (scope, deliverables), link your Microsoft Planner task, and include screenshots if applicable.**
- **Always keep PRs focused and small.**

## 🧪 Code Quality & Testing

- Run all tests before pushing (if applicable)
- Follow existing coding patterns and styles
- If you introduce a feature or fix a bug, please consider adding a test for it

## 🙌 Thank You!

We appreciate your time and effort. Let’s build something great together!
