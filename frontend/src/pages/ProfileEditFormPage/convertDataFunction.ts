import { UpdateUserInputData } from '../../types/components';
import type { ProfileEditFormValues } from './TranslatedYupResolver';

function convertFormDataForUpdating(
  formValues: ProfileEditFormValues,
  userId: number,
): UpdateUserInputData {
  return {
    id: userId,
    username: formValues.login,
    email: formValues.email,
    // currentPassword: formValues.currentPassword,
    password: formValues.newPassword,
  };
}

export default convertFormDataForUpdating;
