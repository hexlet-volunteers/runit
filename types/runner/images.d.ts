import { runProcess } from './process';
import type { RunnerLanguage } from './types';
export interface ImageDeps {
    runProcess: typeof runProcess;
}
export type ImageState = 'present' | 'pulled' | 'failed' | 'local_missing';
export interface ImageReport {
    language: RunnerLanguage;
    tag: string;
    state: ImageState;
    /** Причина, если образа нет. Для лога, не для пользователя. */
    detail?: string;
}
/**
 * Ссылка указывает на реестр, откуда образ можно скачать.
 *
 * Локальное имя вида `runit-runner-python:1` docker попытался бы тянуть из
 * Docker Hub и ответил бы «pull access denied» — сообщение, из которого не
 * следует настоящая причина. Такой образ собирают локально, а не скачивают,
 * поэтому его отсутствие — отдельное состояние с внятным объяснением.
 *
 * Признак реестра тот же, что у самого docker: в первом сегменте имени есть
 * точка или двоеточие (ghcr.io/..., registry:5000/...).
 */
export declare function isRemoteImage(tag: string): boolean;
/**
 * Проверяет наличие образов включённых языков и скачивает отсутствующие.
 *
 * Не бросает исключений: недоступный демон или сбой сети не должны мешать
 * приложению работать — языки, чьи образы не появились, просто ответят
 * «недоступно», как и раньше.
 */
export declare function ensureImages(languages?: readonly RunnerLanguage[], deps?: ImageDeps): Promise<ImageReport[]>;
/**
 * Фоновая подготовка образов при старте приложения.
 *
 * Отдельная функция, а не вызов ensureImages напрямую: старт сервера ждать
 * скачивания не должен (на чистом хосте это минуты), а результат обязан попасть
 * в лог — иначе «языки не работают» пришлось бы выяснять по одному запросу.
 */
export declare function prefetchImages(log?: (message: string) => void): void;
