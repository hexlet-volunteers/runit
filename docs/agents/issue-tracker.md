# Трекер задач: GitHub

Задачи и спецификации этого репозитория живут в GitHub Issues (`hexlet-volunteers/runit`). Все операции — через `gh` CLI: он сам определяет репозиторий по `git remote`, когда запущен внутри клона.

Файл читают скиллы `to-tickets`, `triage`, `to-spec`, `code-review`, `wayfinder` и `implement`.

## Соглашения

- **Создать задачу**: `gh issue create --title "..." --body "..."`. Для многострочного описания — heredoc.
- **Прочитать задачу**: `gh issue view <number> --comments`, при необходимости отфильтровать комментарии через `jq` и заодно забрать ярлыки.
- **Список задач**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` с нужными фильтрами `--label` и `--state`.
- **Комментарий**: `gh issue comment <number> --body "..."`
- **Поставить или снять ярлык**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Закрыть**: `gh issue close <number> --comment "..."`

## Pull request как поток заявок

**PR как поток заявок (PRs as a request surface): нет.** _(Поставить `да`, если внешние PR в этом репозитории считаются заявками на доработку; флаг читает `/triage`.)_

Пока стоит «нет», PR в очередь разбора не попадают. Со «да» они проходят через те же ярлыки и состояния, что и задачи, только командами `gh pr`:

- **Прочитать PR**: `gh pr view <number> --comments`, диф — `gh pr diff <number>`.
- **Список внешних PR для разбора**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments`, затем оставить только `authorAssociation` из `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, `NONE` (отбросить `OWNER`, `MEMBER`, `COLLABORATOR`).
- **Комментарий, ярлыки, закрытие**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

У GitHub одна нумерация на задачи и PR, поэтому `#42` может быть и тем, и другим: сначала `gh pr view 42`, при неудаче — `gh issue view 42`.

## Когда скилл говорит «опубликовать в трекер»

Создать задачу в GitHub Issues.

## Когда скилл говорит «взять соответствующий тикет»

Выполнить `gh issue view <number> --comments`.

## Операции wayfinder

Нужны скиллу `/wayfinder`. **Карта** — одна задача, тикеты — её дочерние задачи.

- **Карта**: задача с ярлыком `wayfinder:map`, в теле — разделы Notes, Decisions-so-far, Fog. Создаётся через `gh issue create --label wayfinder:map`.
- **Дочерний тикет**: задача, привязанная к карте как sub-issue GitHub (через `gh api` на эндпоинт sub-issues). Если sub-issues недоступны — добавить тикет в список задач в теле карты, а в начало тела тикета поставить строку `Part of #<map>`. Ярлыки: `wayfinder:<type>` (`research`, `prototype`, `grilling`, `task`). Взятый в работу тикет назначается на того, кто его ведёт.
- **Блокировки**: родные зависимости задач GitHub — это канонический вид, видимый в интерфейсе. Ребро добавляется командой `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, где `<blocker-db-id>` — числовой **database id** блокирующей задачи (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, а _не_ `#number` и не `node_id`). GitHub отдаёт `issue_dependencies_summary.blocked_by` — только открытые блокировки, это и есть живой шлагбаум. Где зависимости недоступны, запасной вариант — строка `Blocked by: #<n>, #<n>` в начале тела тикета. Тикет разблокирован, когда закрыты все блокирующие задачи.
- **Запрос фронтира**: взять открытые дочерние задачи карты (`gh issue list --state open`, в пределах sub-issues или списка задач карты), отбросить те, у которых есть открытая блокировка (`issue_dependencies_summary.blocked_by > 0` или открытая задача в строке `Blocked by`) либо назначенный исполнитель; побеждает первая по порядку в карте.
- **Взять в работу**: `gh issue edit <n> --add-assignee @me` — первая запись за сессию.
- **Закрыть вопрос**: `gh issue comment <n> --body "<ответ>"`, затем `gh issue close <n>`, затем дописать указатель на контекст (gist со ссылкой) в Decisions-so-far карты.
