import * as yup from 'yup';
import { username, email, password } from '../../../utils/validationSchemas';

export const createSignUpFormSchema = () =>
  yup.object().shape({
    username: username(),
    email: email(),
    password: password(),
  });
