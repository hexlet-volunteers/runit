export type Availability = {
    ok: true;
} | {
    ok: false;
    reason: 'no_cli' | 'no_daemon' | 'no_image' | 'disabled';
    message: string;
};
export declare function checkDaemon(): Promise<Availability>;
/**
 * Отличает «образа нет» от «демон не ответил».
 *
 * `docker image inspect` возвращает ненулевой код в обоих случаях, и раньше оба
 * объяснялись одинаково — «Образ не собран, выполните runner:build-images».
 * Совет бывал прямо вредным: во время обновления Docker Desktop демон
 * отказывался отвечать на inspect по имени, притом что образ был на месте и
 * `docker run` с ним работал. Человеку предлагалось пересобирать девять
 * образов, хотя нужно было подождать полминуты.
 *
 * Разбираем по тексту ошибки самого docker — другого признака у CLI нет.
 */
export declare const looksLikeDaemonProblem: (stderr: string) => boolean;
export declare function checkImage(language: string): Promise<Availability>;
