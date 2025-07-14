export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000', // Backend API URL
  appName: 'TaskSphere',
  appVersion: '1.0.0',

  // Storage keys for localStorage
  storage: {
    tokenKey: 'tasksphere_access_token',
    refreshTokenKey: 'tasksphere_refresh_token',
    userKey: 'tasksphere_user',
    themeKey: 'tasksphere_theme',
    languageKey: 'tasksphere_language',
  },

  // Feature flags
  features: {
    enableGoogleAuth: true,
    enableOfflineMode: false,
    enableAnalytics: false,
    enableDarkMode: true,
    enableMultiLanguage: true,
  },

  // App configuration
  app: {
    defaultLanguage: 'en' as const,
    defaultTheme: 'system' as const,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    supportedFileTypes: ['image/jpeg', 'image/png', 'image/gif'],
    itemsPerPage: 20,
    maxItemsPerPage: 100,
  },

  // OAuth configuration
  oauth: {
    google: {
      clientId: 'your-google-client-id',
      scope: 'openid email profile',
    },
  },

  // External services
  services: {
    healthCheckUrl: '/health',
    supportEmail: 'support@tasksphere.com',
    documentationUrl: 'https://docs.tasksphere.com',
  },
};
