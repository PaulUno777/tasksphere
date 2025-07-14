export const environment = {
  production: true,
  apiUrl: 'https://api.tasksphere.com',
  appName: 'TaskSphere',
  appVersion: '1.0.0',

  storage: {
    tokenKey: 'tasksphere_access_token',
    refreshTokenKey: 'tasksphere_refresh_token',
    userKey: 'tasksphere_user',
    themeKey: 'tasksphere_theme',
    languageKey: 'tasksphere_language',
  },

  features: {
    enableGoogleAuth: true,
    enableOfflineMode: true,
    enableAnalytics: true,
    enableDarkMode: true,
    enableMultiLanguage: true,
  },

  app: {
    defaultLanguage: 'en' as const,
    defaultTheme: 'system' as const,
    maxFileSize: 10 * 1024 * 1024,
    supportedFileTypes: ['image/jpeg', 'image/png', 'image/gif'],
    itemsPerPage: 20,
    maxItemsPerPage: 100,
  },

  oauth: {
    google: {
      clientId: 'your-production-google-client-id',
      scope: 'openid email profile',
    },
  },

  services: {
    healthCheckUrl: '/health',
    supportEmail: 'support@tasksphere.com',
    documentationUrl: 'https://docs.tasksphere.com',
  },
};
