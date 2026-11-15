# Backlog: i18n

## Context

- What: Full Spanish (default) + English app for farmers and non-Spanish-speaking judges; language kept in the URL (`?lang=en`); every visible text follows it. Plan: none.
- Stack: existing (FastAPI + engine + contracts; React + Vite). No new dependencies.
- Expensive decisions: English travels as additive `*_en` sibling fields next to each `*_es` field (contract change agreed by the lead); no `lang` API parameter.
- Test command: make check
- Single test: uv run pytest <file> | npx --prefix web vitest run <file>

## Backlog

01. [x] 6ff81ad As a visitor, I want to switch the map screen to English with a language toggle so that I can start the app in my language.
02. [x] 0897032 As a visitor, I want the form screen in English, including crop names, so that I can enter my current rotation. Requires: #01
03. [x] ce89191 As a visitor, I want the site risks explained in English so that I understand my plot's conditions. Requires: #01
04. [x] b8a3635 As a visitor, I want the comparison screen and its badges in English so that I can compare the options. Requires: #01
05. [x] cf0b7b2 As a visitor, I want each option's reasons, benefits, NASA evidence, data gaps and local review in English so that I understand why it is recommended. Requires: #04
06. [~] As a visitor, I want errors, loading and empty states in English so that I am never left with Spanish-only messages. Requires: #01
