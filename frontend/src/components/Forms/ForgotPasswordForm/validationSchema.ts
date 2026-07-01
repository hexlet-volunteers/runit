import * as yup from 'yup';
import { email} from '../../../utils/validationSchemas';

export const createForgotPasswordFormSchema = () =>
  yup.object().shape({
    email: email(),
  });
