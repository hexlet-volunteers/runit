class ConfigHelper {
    // Раньше здесь было `Boolean(process.env.WITHOUT_DOCKER) || true`: из-за `|| true`
    // значение всегда было true, поэтому тесты python/php/ruby/java скипались даже
    // при запущенном docker. Теперь включение явное — WITH_DOCKER=true.
    runWithoutDocker: boolean = process.env.WITH_DOCKER !== 'true';
}

export const configHelper = new ConfigHelper();
