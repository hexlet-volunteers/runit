# AGENTS.md

- После изменений в `src/` перегенерировать типы для фронтенда: `npm run generate:types`.

## Agent skills

Сами скиллы лежат в `.agents/skills` (Claude Code видит их через симлинки в
`.claude/skills`), обновляются целью `make skills-update`. Ниже — то, что скиллы
обязаны знать про этот репозиторий.

### Трекер задач

Задачи и спецификации живут в GitHub Issues, операции — через `gh` CLI. Внешние
PR потоком заявок не считаются. См. `docs/agents/issue-tracker.md`.

### Ярлыки разбора

Пять канонических ярлыков: `needs-triage`, `needs-info`, `ready-for-agent`,
`ready-for-human`, `wontfix`. См. `docs/agents/triage-labels.md`.

### Доменная документация

Один контекст: `CONTEXT.md` и `docs/adr/` в корне — их создаст
`/domain-modeling`, когда появится что фиксировать. См. `docs/agents/domain.md`.
