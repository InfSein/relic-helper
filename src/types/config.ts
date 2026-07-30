import { assignDefaults } from '@/tools'

export interface AppConfig {
  theme: 'light' | 'dark'
}

export type AppConfigKey = keyof AppConfig;

const defaultAppConfig : AppConfig = {
  theme: 'light',
}

export const fixAppConfig = (appConfig?: AppConfig) => {
  // 处理特定环境下的设置项
  if (!appConfig) {
    appConfig = {} as AppConfig
  }

  // 处理其他的设置项
  return assignDefaults(defaultAppConfig, appConfig || {}) as AppConfig
}
