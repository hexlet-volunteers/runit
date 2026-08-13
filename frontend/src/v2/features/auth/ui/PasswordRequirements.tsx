import { Box, Text } from '@mantine/core';
import { passwordRules } from '../lib/passwordPolicy';

/**
 * Требования к паролю с отметкой выполненных (#621).
 *
 * Показываются рядом с полем, а не только в ошибке после отправки: иначе
 * пользователь узнаёт правила, уже получив отказ, и подбирает пароль наугад.
 *
 * Пока поле пустое, список выводится нейтрально — красные пункты у ещё не
 * начатого ввода выглядят как ошибка, которой пользователь не совершал.
 */
export default function PasswordRequirements({ value }: { value: string }) {
  const touched = value.length > 0;

  return (
    <Box mt={6}>
      {passwordRules.map((rule) => {
        const met = rule.isMet(value);
        return (
          <Text
            key={rule.label}
            size="xs"
            c={!touched ? 'dimmed' : met ? 'teal.7' : 'dimmed'}
            style={{ lineHeight: 1.5 }}
          >
            <Text span aria-hidden fw={600} mr={6}>
              {touched && met ? '✓' : '·'}
            </Text>
            {rule.label}
          </Text>
        );
      })}
    </Box>
  );
}
