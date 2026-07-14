import AppProviders from './AppProviders';
import AppRouter from './AppRouter';

export default function V2App() {
  return (
    <AppProviders>
      <AppRouter/>
    </AppProviders>
  );
}