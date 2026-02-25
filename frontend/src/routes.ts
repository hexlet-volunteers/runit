const apiPath = '/api';

export default {
  // post - create user: { name, email, password }
  // get - get all users
  usersPath: () => [apiPath, 'users'].join('/'),

  // get user info that is logged in
  userProfilePath: () => [apiPath, 'users', 'profile'].join('/'),

  // get user info
  userInfoPath: (param: string) => [apiPath, 'users', `${param}`].join('/'),

  // put - update user info: { name, email, password }
  updateUserPath: (id: number) => [apiPath, 'users', `${id}`].join('/'),

  // put - update user settings: { theme, language }
  updateUserSettingsPath: (id: number) =>
    [apiPath, 'users', 'settings', `${id}`].join('/'),

  resetPassPath: () => [apiPath, 'users', 'recover'].join('/'),

  signInPath: () => [apiPath, 'signin'].join('/'),

  // post
  signOutPath: () => [apiPath, 'signout'].join('/'),

  // delete user
  deleteUserPath: (id: number) => [apiPath, 'users', `${id}`].join('/'),

  // get - shows all snippets
  snippetsPath: () => [apiPath, 'snippets'].join('/'),

  // post - create snippet: { name, code }
  createSnippetPath: () => [apiPath, 'snippets'].join('/'),

  // get snippet
  getSnippetPath: (id: number) => [apiPath, 'snippets', `${id}`].join('/'),

  getSnippetPathByParams: (username: string, slug: string) =>
    [apiPath, 'snippets', username, slug].join('/'),

  // put - update snippet info: { name, code }
  updateSnippetPath: (id: number) => [apiPath, 'snippets', `${id}`].join('/'),

  // delete snippet
  deleteSnippetPath: (id: number) => [apiPath, 'snippets', `${id}`].join('/'),

  // get random initial snippet name
  getDefaultSnippetName: () => [apiPath, 'snippets', 'name'].join('/'),

  // OAuth
  oAuthPath: () => [apiPath, 'oauth'].join('/'),

  adminPanelPath: () => ['admin', 'users'].join('/'),

  // RunCode
  runCode: () => [apiPath, 'runner', 'run'].join('/'),

  // Path for ProfileEditForm
  editProfilePath: () => [apiPath, 'users', 'profile', 'edit'].join('/'),
  profilePageNew: () => [apiPath, 'users', 'profile'].join('/'),

  oldLandingPath: () => '/oldLanding',
  homePagePath: () => '/editor',
  aboutPagePath: () => '/about',
  profilePagePath: (username = ':username') => `/u/${username}`,
  myProfilePagePath: () => '/profile',
  settingsPagePath: () => '/settings',
  signInPagePath: () => '/signin',
  signUpPagePath: () => '/signup',
  forgotPassPagePath: () => '/forgot_password',
  resetPassPagePath: (hash = ':hash') => `/recovery/${hash}`,
  licenseAgreementPath: () => '/licenseAgreement',
  privacyPolicyPath: () => '/policy',
  publicOfferPath: () => '/offer',
  consentToProcessingPath: () => '/consent',
  snippetPagePath: (username = ':username', slug = ':slug') =>
    `u/${username}/snippets/${slug}`,
  embedSnippetPagePath: (username = ':username', slug = ':slug') =>
    `/embed/u/${username}/snippets/${slug}`,
  landingPath: () => '/',
};
