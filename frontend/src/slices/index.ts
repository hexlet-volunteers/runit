import { AnyAction, combineReducers, ThunkDispatch } from '@reduxjs/toolkit';
import editorReducer, { actions as editorActions } from './editorSlice';
import terminalReducer, {
  actions as terminalActions,
  runCode,
} from './terminalSlice';
import languagesReducer, {
  actions as languagesActions,
} from './languagesSlice';
import modalReducer, { actions as modalActions } from './modalSlice';
import snippetsSlice, { actions as snippetsActions } from './snippetsSlice';
import userSlice, { actions as userActions } from './userSlice';
import checkboxesSlice, {
  actions as checkboxesActions,
} from './checkboxesSlice';
import userSettingsSlice, {
  actions as userSettingsActions,
} from './userSettingsSlice';
import type { RootReducerType } from '../types/slices';

//новый slise, actions для нового лендинга!!!!!
import codeReducer, { actions as codeActions } from '../newSlices/editorSlice';

export const rootReducer = combineReducers<RootReducerType>({
  editor: editorReducer,
  terminal: terminalReducer,
  languages: languagesReducer,
  modal: modalReducer,
  snippets: snippetsSlice,
  user: userSlice,
  checkboxes: checkboxesSlice,
  userSettings: userSettingsSlice,
  code: codeReducer,// для редактора нового лендинга
});

export type RootState = ReturnType<typeof rootReducer>;

export type AppDispatch = ThunkDispatch<RootState, any, AnyAction>;

// export const setupState = (gon) => (dispatch) => {
// FIXME: гон сейчас пустой, поэтому фолбек на джаваскрипт
//  dispatch(editorActions.changeLanguage(gon.language || 'javascript'));
// };

export const actions = {
  ...editorActions,
  ...terminalActions,
  ...languagesActions,
  ...modalActions,
  ...snippetsActions,
  ...userActions,
  ...checkboxesActions,
  ...userSettingsActions,
  ...codeActions,
  runCode,
};
