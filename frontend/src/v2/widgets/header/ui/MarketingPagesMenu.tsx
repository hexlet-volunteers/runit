import { Link } from 'react-router';
import { Button } from '@mantine/core';

/** Кнопка «Кабинет» для авторизованных пользователей на маркетинг-страницах. */
export default function MarketingPagesMenu() {
  return (
    <Button component={Link} to="/snippets" variant="light">
      Кабинет
    </Button>
  );
}
