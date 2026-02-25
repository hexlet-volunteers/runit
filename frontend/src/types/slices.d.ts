interface EditorSnippetData {
  id: number | null; //string???
  name: string | null;
  ownerUsername: string | null;
  slug: string;
  language?: string;
}

type DirectionType = 'horizontal' | 'vertical';

export type EditorStateType = {
  snippetData: EditorSnippetData;
  error: boolean;
  isReady: boolean;
  hasSnippetData: boolean;
  code: string;
  savedCode: string;
  isAllSaved: boolean;
  direction: DirectionType;
  isNotMobile: boolean;
};

export interface IActionResetEditor {
  payload: string | null | undefined;
}

export interface IActionUpdateDirection {
  payload: DirectionType;
}

export interface IActionUpdateCode {
  payload: string;
}

export interface IActionIsNotMobile {
  payload: boolean;
}

export interface IActionUpdateActiveSnippetName {
  payload: string;
}

export interface IActionSetActiveSnippetData {
  payload: EditorSnippetData;
}

export type CheckedSnippetsType = {
  id: number; // string???
  isChecked: boolean;
};

export type CheckboxesSnippetsStateType = {
  checkedSnippets: Array<CheckedSnippetsType>;
  isCheckboxesOpen: boolean;
};

type Languages = 'javascript' | 'html' | 'php' | 'python' | 'java' | 'ruby';

export type SupportedLanguagesArr = Languages[];

export type LanguagesStateType = {
  supportedLanguages: SupportedLangsArr;
  currentLanguage: Languages;
};

type CopiedSnippet = {
  code: string; // string???
  currSnippetLng: Languages;
  currSnippetName: string;
  ownerUsername: string;
};

type SharedSnippet = {
  name: string;
  id: number;
  slug: string;
  ownerUsername: string;
};

export interface ISnippet extends CopiedSnippet, SharedSnippet {}

export type ModalStateType = {
  isOpen: boolean;
  type: string | null;
  item: Partial<ISnippet> | null;
};

type Statuses = 'empty' | 'fulfilled' | 'pending' | 'rejected';

export interface SnippetOwnerType {
  created_at: string;
  email: string;
  id: number;
  isAdmin: boolean;
  password: string;
  recover_hash?: unknown;
  tempPassword: string;
  updated_at: string;
  username: string;
}

type FetchedCurrentUser = SnippetOwnerType & {
  avatar_base64?: string | null;
  theme: Themes;
};

export type FetchedTerminalDataType = {
  id: number;
  code: string;
  slug: string;
  language: Languages;
  ownerUsername: string;
  name: string;
};

export type FetchedSnippet = {
  id: number;
  slug: string;
  name: string;
  code: string;
  language: Languages;
  userId: number;
  created_at: string;
  updated_at: string;
};

export type ResponseUserSnippets = {
  currentUser: FetchedCurrentUser;
  snippets: FetchedSnippet[];
};

export type SnippetsStateType = {
  status: SnippetsStatuses;
  snippets: FetchedSnippet[];
};

export interface IOutput {
  terminal: string[] | [];
  alertLogs: unknown[];
}

export type TerminalStateType = {
  codeExecutionState: 'idle' | 'executing';
  output: IOutput;
};

type Themes = 'dark' | 'light' | 'system';

type LoadingStatuses = 'loading' | 'idle' | 'failed';

type UILanguages = 'en' | 'ru' | '';

export type UserSettingsStateType = {
  language: UILanguages;
  theme: '' | Themes;
  avatar: string | null;
  loadingStatus: LoadingStatuses;
};

export type UserSettingsThunkType = {
  currentUser: FetchedCurrentUser & { language: UILanguages };
  snippets: Array<FetchedSnippet> & {
    user: SnippetOwnerType;
  };
};

export type UserSliceStateType = {
  status: Statuses;
  // userInfo пока так потому что с бэка из сервиса || контроллера
  // прилетает cannot read properties of undefined (reading: 'toLowerCase')
  userInfo: Partial<FetchedCurrentUser>;
};

// для нового редактора в новом лендинге
export interface CodeState {
  editorCode: string;
  scriptValue: string;
  iframeValue: string;
}

export type RootReducerType = {
  editor: EditorStateType;
  terminal: TerminalStateType;
  languages: LanguagesStateType;
  modal: ModalStateType;
  snippets: SnippetsStateType;
  user: UserSliceStateType;
  checkboxes: CheckboxesSnippetsStateType;
  userSettings: UserSettingsStateType;
  code: CodeState; // для нового редактора в новом лендинге
};
