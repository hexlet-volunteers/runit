import type { RootReducerType } from 'src/types/slices';
import { useDispatch, useSelector } from 'react-redux';

import { actions } from '../../slices';

import NewSignUpModal from './NewSignUp';
import SignInModal from './SignIn';
import RemoveAccount from './RemoveAccount';
import NewSnippet from './NewSnippet';
import ShareSnippet from './ShareSnippet';
import InDevelopment from './InDevelopment';
import SnippetUnavailable from './SnippetUnavailable';
import DuplicateSnippetModal from './DuplicateSnippetModal';
import AttemptDuplicateSnippet from './AttemptDuplicateSnippet';
import ChangeAvatarModal from './ChangeAvatar';
import RemoveAvatarModal from './RemoveAvatar';
import DeleteSnippetModal from './DeleteSnippetModal';

const modals = {
  signingUp: NewSignUpModal,
  signingIn: SignInModal,
  removeAccount: RemoveAccount,
  newSnippet: NewSnippet,
  sharingSnippet: ShareSnippet,
  inDevelopment: InDevelopment,
  snippetUnavailable: SnippetUnavailable, // #TODO: Remove this modal once proper re-direct is configured on the backend,
  duplicateSnippet: DuplicateSnippetModal,
  attemptDuplicateSnippet: AttemptDuplicateSnippet,
  changeAvatar: ChangeAvatarModal,
  removeAvatar: RemoveAvatarModal,
  deleteSnippet: DeleteSnippetModal,
};

function ModalWindow() {
  const dispatch = useDispatch();
  const { isOpen, type } = useSelector((state: RootReducerType) => state.modal);

  const handleClose = () => dispatch(actions.closeModal());

  const Modal = modals[type];
  if (!Modal) {
    return null;
  }
  return <Modal handleClose={handleClose} isOpen={isOpen} />;
}

export default ModalWindow;
