import { CookieNotice } from '../widgets/cookie-notice';
import AppProviders from './AppProviders';
import AppRouter from './AppRouter';

export default function V2App() {
  return (
    <AppProviders>
      <AppRouter />
      {/*
        Уведомление о cookie — рядом с роутером, а не внутри страниц: оно должно
        показываться на любой странице, включая лендинг для гостей. Сам компонент
        решает, где не показываться (встроенный виджет).
      */}
      <CookieNotice />
    </AppProviders>
  );
}
