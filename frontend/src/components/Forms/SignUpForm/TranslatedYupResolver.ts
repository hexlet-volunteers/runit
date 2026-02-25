import * as yup from 'yup';
import { TFunction } from 'i18next';
import { yupResolver } from 'mantine-form-yup-resolver';
import { createSignUpFormSchema } from './ValidationSchema';

export type SignUpFormValues = yup.InferType<
  ReturnType<typeof createSignUpFormSchema>
>;

export const createTranslatedResolver = (t: TFunction) => {
  const schema = createSignUpFormSchema();
  const baseResolver = yupResolver(schema);

  return (values: SignUpFormValues) => {
    const errors = baseResolver(values);
    if (!errors) return null;

    if (errors && typeof errors === 'object') {
      const translatedErrors: Record<string, string> = {};
      Object.entries(errors as Record<string, string>).forEach(
        ([field, errorKey]) => {
          translatedErrors[field] = t(errorKey);
        },
      );
      return translatedErrors;
    }

    return errors;
  };
};
