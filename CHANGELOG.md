# Changelog

## [0.2.6](https://github.com/hexlet-volunteers/runit/compare/v0.2.5...v0.2.6) (2026-11-01)


### Build System

* **deps-dev:** bump js-yaml from 4.3.1 to 4.3.2 in /frontend ([#988](https://github.com/hexlet-volunteers/runit/issues/988)) ([eafb5a6](https://github.com/hexlet-volunteers/runit/commit/eafb5a61785da608c21e45524634024f7f68a2f4))

## [0.2.5](https://github.com/hexlet-volunteers/runit/compare/v0.2.4...v0.2.5) (2026-11-01)


### Build System

* **deps-dev:** bump brace-expansion from 1.1.18 to 1.1.21 in /frontend ([#993](https://github.com/hexlet-volunteers/runit/issues/993)) ([22da290](https://github.com/hexlet-volunteers/runit/commit/22da290f05839af57fb3a854d25e965cb1f18323))
* **deps-dev:** bump browserslist from 4.25.4 to 4.29.5 in /frontend ([#982](https://github.com/hexlet-volunteers/runit/issues/982)) ([0ba8ba4](https://github.com/hexlet-volunteers/runit/commit/0ba8ba4255707b8a42f53f3bec23572227406581))
* **deps-dev:** bump postcss-selector-parser from 7.1.4 to 7.1.7 in /frontend ([#996](https://github.com/hexlet-volunteers/runit/issues/996)) ([3225deb](https://github.com/hexlet-volunteers/runit/commit/3225debe39353de958854158811649f275d4e9af))
* **deps-dev:** bump vite from 7.3.6 to 7.3.7 in /frontend ([#999](https://github.com/hexlet-volunteers/runit/issues/999)) ([f58ae3f](https://github.com/hexlet-volunteers/runit/commit/f58ae3fe293d3797a1dfc43fa721a783800a1f06))
* **deps:** bump @vitest/mocker, @vitest/coverage-v8 and vitest in /frontend ([#1003](https://github.com/hexlet-volunteers/runit/issues/1003)) ([8206dab](https://github.com/hexlet-volunteers/runit/commit/8206dab1a8a423738e74d2cca9bfdf85dc5a7e6c))
* **deps:** bump source-map-js from 1.2.1 to 1.2.2 in /frontend ([#1001](https://github.com/hexlet-volunteers/runit/issues/1001)) ([066c7c7](https://github.com/hexlet-volunteers/runit/commit/066c7c7571e2b5130532976d9e2ae40d36d2bd9a))

## [0.2.4](https://github.com/hexlet-volunteers/runit/compare/v0.2.3...v0.2.4) (2026-10-21)


### Features

* **auth:** проверка блокировки, логирование и очистка старых записей ([#858](https://github.com/hexlet-volunteers/runit/issues/858)-4-7) ([#977](https://github.com/hexlet-volunteers/runit/issues/977)) ([220491d](https://github.com/hexlet-volunteers/runit/commit/220491d3f85badc055d2ab3ed3043e28918a4964))


### Bug Fixes

* **security:** доверять прокси по адресу и обновить fastify до 5.12.7 ([#1002](https://github.com/hexlet-volunteers/runit/issues/1002)) ([ad15d3a](https://github.com/hexlet-volunteers/runit/commit/ad15d3a3b1133bdf9a45f486b7d298a21f3e533b))


### Miscellaneous

* **tests:** перевести тесты на vitest ([#984](https://github.com/hexlet-volunteers/runit/issues/984)) ([fc525de](https://github.com/hexlet-volunteers/runit/commit/fc525de4e6cb7d492380caca1b0630f4a9d3db92))


### Build System

* **deps-dev:** bump vite from 8.2.2 to 8.3.4 ([#998](https://github.com/hexlet-volunteers/runit/issues/998)) ([b9fe78a](https://github.com/hexlet-volunteers/runit/commit/b9fe78a3e6ab9387a741ba8cdd122cdf0b8c6350))

## [0.2.3](https://github.com/hexlet-volunteers/runit/compare/v0.2.2...v0.2.3) (2026-08-27)


### Features

* **auth:** счётчик неудачных попыток входа и логика блокировки ([#858](https://github.com/hexlet-volunteers/runit/issues/858)/2-3) ([#963](https://github.com/hexlet-volunteers/runit/issues/963)) ([e57016a](https://github.com/hexlet-volunteers/runit/commit/e57016a988d43a8ad250267b3c7c388386d4f794))
* **db:** add login_attempts table for failed login tracking ([#953](https://github.com/hexlet-volunteers/runit/issues/953)) ([872a804](https://github.com/hexlet-volunteers/runit/commit/872a8040d278c81ba680ba6c5381d0f66fabb0c0))


### Miscellaneous

* **agents:** скиллы mattpocock/skills в репозитории + make skills-update ([#972](https://github.com/hexlet-volunteers/runit/issues/972)) ([7e0fb41](https://github.com/hexlet-volunteers/runit/commit/7e0fb41e17c38dcd1d2415d4190c39f77f4154fc))
* **docs:** наполнить AGENTS.md правилами, которых нет в конфигах ([#974](https://github.com/hexlet-volunteers/runit/issues/974)) ([9488293](https://github.com/hexlet-volunteers/runit/commit/9488293d0139645d338f16f9b66092e9f97da2f3))
* **docs:** один абзац — одна строка в docs/agents ([#975](https://github.com/hexlet-volunteers/runit/issues/975)) ([077a414](https://github.com/hexlet-volunteers/runit/commit/077a414612dd8469d4c4841a59ab4238c5b07d06))
* **docs:** правило «абзац — одна строка» и весь маркдаун по нему ([#976](https://github.com/hexlet-volunteers/runit/issues/976)) ([49edebe](https://github.com/hexlet-volunteers/runit/commit/49edebe0b64646861c4919beed9ac4fb92798da1))
* **docs:** удалить CONTRIBUTING.md ([#964](https://github.com/hexlet-volunteers/runit/issues/964)) ([33c68fa](https://github.com/hexlet-volunteers/runit/commit/33c68fa946acccbd14e6fe292747af99ed7d76dc))

## [0.2.2](https://github.com/hexlet-volunteers/runit/compare/v0.2.1...v0.2.2) (2026-08-17)


### Bug Fixes

* **editor:** предупреждать о недоступном исполнении заранее ([#958](https://github.com/hexlet-volunteers/runit/issues/958)) ([7501f6f](https://github.com/hexlet-volunteers/runit/commit/7501f6f96ab87812111aaed5e0e900e787962416))
* **runner:** не путать сбой docker с несобранным образом ([#956](https://github.com/hexlet-volunteers/runit/issues/956)) ([e3a6a2d](https://github.com/hexlet-volunteers/runit/commit/e3a6a2df9ac9ac7dcb7a1764e7bee3e4ebdbc2d7))


### Performance Improvements

* **frontend:** убрать блокирующие Google Fonts и заглушку загрузки ([#960](https://github.com/hexlet-volunteers/runit/issues/960)) ([d88d0b3](https://github.com/hexlet-volunteers/runit/commit/d88d0b3cd0f3567b660b4852775db322b05992a3))

## [0.2.1](https://github.com/hexlet-volunteers/runit/compare/v0.2.0...v0.2.1) (2026-08-15)


### Features

* **ci:** выпуск версий через release-please, как в hexlet-basics ([#946](https://github.com/hexlet-volunteers/runit/issues/946)) ([bd5a5b5](https://github.com/hexlet-volunteers/runit/commit/bd5a5b5b8acf1dfb3947349a3d517c3910beb841))


### Bug Fixes

* **ci:** проверка типов в тестах не видела объявлений *.d.ts ([#945](https://github.com/hexlet-volunteers/runit/issues/945)) ([6e0d41d](https://github.com/hexlet-volunteers/runit/commit/6e0d41dbb72cfb9526a6f8bc7ce211bf1c7d7fe0))
* **ci:** убрать имя компонента из тега release-please ([#949](https://github.com/hexlet-volunteers/runit/issues/949)) ([f7f91b6](https://github.com/hexlet-volunteers/runit/commit/f7f91b6c2fb1fb392ce739458ff6e7f58597d938))
* **editor:** различать «сервер не отвечает» и «исполнение недоступно» ([#955](https://github.com/hexlet-volunteers/runit/issues/955)) ([bd3b257](https://github.com/hexlet-volunteers/runit/commit/bd3b257b0f27fe6a2e9c64946b82223c15a367dc))
* **security:** песочница исполнения кода и понятное сохранение сниппета ([#954](https://github.com/hexlet-volunteers/runit/issues/954)) ([3541b67](https://github.com/hexlet-volunteers/runit/commit/3541b671850f965c89563b6ecee1612e78d2f5e7))


### Miscellaneous

* **docs:** гайд для контрибьюторов — мерж, ограничения main, выпуск ([#952](https://github.com/hexlet-volunteers/runit/issues/952)) ([e780979](https://github.com/hexlet-volunteers/runit/commit/e780979c551513ea9f9d8e156b7358b67fe3e02d))
