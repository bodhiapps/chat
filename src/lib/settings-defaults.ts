// Generation parameters sent to API
export interface GenerationSettings {
  temperature: number;
  top_p: number;
  top_k: number;
  min_p: number;
  typ_p: number;
  max_tokens: number;
  repeat_last_n: number;
  repeat_penalty: number;
  presence_penalty: number;
  frequency_penalty: number;
}

// Display/UI preferences
export interface DisplaySettings {
  disableAutoScroll: boolean;
  alwaysShowSidebarOnDesktop: boolean;
  autoShowSidebarOnNewChat: boolean;
  showThoughtInProgress: boolean;
  renderUserContentAsMarkdown: boolean;
}

// General settings
export interface GeneralSettings {
  theme: 'system' | 'light' | 'dark';
  systemMessage: string;
}

export interface Settings {
  general: GeneralSettings;
  generation: GenerationSettings;
  display: DisplaySettings;
}

export const DEFAULT_SETTINGS: Settings = {
  general: {
    theme: 'system',
    systemMessage: '',
  },
  generation: {
    temperature: 0.8,
    top_p: 0.95,
    top_k: 40,
    min_p: 0.05,
    typ_p: 1.0,
    max_tokens: -1,
    repeat_last_n: 64,
    repeat_penalty: 1.0,
    presence_penalty: 0.0,
    frequency_penalty: 0.0,
  },
  display: {
    disableAutoScroll: false,
    alwaysShowSidebarOnDesktop: true,
    autoShowSidebarOnNewChat: true,
    showThoughtInProgress: true,
    renderUserContentAsMarkdown: false,
  },
};

// Validation ranges
export const VALIDATION_RANGES = {
  temperature: { min: 0, max: 2, step: 0.05 },
  top_p: { min: 0, max: 1, step: 0.05 },
  top_k: { min: 0, max: 100, step: 1 },
  min_p: { min: 0, max: 1, step: 0.05 },
  typ_p: { min: 0, max: 2, step: 0.05 },
  max_tokens: { min: -1, max: 32768, step: 1 },
  repeat_last_n: { min: 0, max: 256, step: 1 },
  repeat_penalty: { min: 0, max: 2, step: 0.05 },
  presence_penalty: { min: -2, max: 2, step: 0.05 },
  frequency_penalty: { min: -2, max: 2, step: 0.05 },
} as const;
