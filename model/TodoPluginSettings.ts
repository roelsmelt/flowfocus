export interface FocusPriorityRule {
  tag: string;       // e.g. 'urgent'
  max: number | 'all'; // 'all' or a number like 1, 2
}

export interface TodoPluginSettings {
  dateFormat: string;
  dateTagFormat: string;
  openFilesInNewLeaf: boolean;
  focusMaxItems: number;
  focusPriorityRules: FocusPriorityRule[];
}

export const DEFAULT_SETTINGS: TodoPluginSettings = {
  dateFormat: 'yyyy-MM-dd',
  dateTagFormat: '#%date%',
  openFilesInNewLeaf: true,
  focusMaxItems: 5,
  focusPriorityRules: [
    { tag: 'urgent', max: 'all' },
    { tag: 'lifegoal', max: 1 },
    { tag: 'important', max: 'all' },
  ],
};
