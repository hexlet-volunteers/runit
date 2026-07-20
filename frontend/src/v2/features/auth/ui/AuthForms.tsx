import { useEffect, useState } from 'react';
import { useAuthModal } from '..';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ResetForm from './ResetForm';

export default function AuthForms() {
  const { mode, opened } = useAuthModal();
  // Пересоздаём формы при каждом открытии модалки, чтобы сбрасывать значения и ошибки.
  const [instance, setInstance] = useState(0);
  useEffect(() => {
    if (opened) setInstance((n) => n + 1);
  }, [opened]);

  if (mode === 'register') return <RegisterForm key={`register-${instance}`} />;
  if (mode === 'reset') return <ResetForm key={`reset-${instance}`} />;
  return <LoginForm key={`login-${instance}`} />;
}
