import * as yup from 'yup';
import { email } from '../../../utils/validationSchemas';

const PASSWORD_MAX_LENGTH = 30;

export const createSignInFormSchema = () =>
  yup.object().shape({
    email: email(),
    password: yup
      .string()
      .trim()
      .required('errors.validation.requiredField')
      .max(PASSWORD_MAX_LENGTH, 'errors.validation.passwordLength'),
  });
