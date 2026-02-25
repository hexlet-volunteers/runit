import { SignUpUserInputData } from '../../../types/components';
import type { SignUpFormValues } from './TranslatedYupResolver';

function convertFormDataForApi(
  formValues: SignUpFormValues,
): SignUpUserInputData {
  return {
    username: formValues.username,
    email: formValues.email,
    password: formValues.password,
  };
}

export default convertFormDataForApi;
