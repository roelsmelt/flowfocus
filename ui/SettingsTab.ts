import { App, PluginSettingTab, Setting } from 'obsidian';
import { DateTime } from 'luxon';
import TodoPlugin from 'main';
import { DEFAULT_SETTINGS, FocusPriorityRule } from '../model/TodoPluginSettings';

export class SettingsTab extends PluginSettingTab {
  private plugin: TodoPlugin;

  constructor(app: App, plugin: TodoPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    const currentSettings = this.plugin.getSettings();

    containerEl.empty();

    containerEl.createEl('h2', { text: 'FlowFocus Settings' });

    // --- Date tag format ---
    const tagFormatSetting = new Setting(containerEl);
    tagFormatSetting
      .setName('Date tag format')
      .setDesc(this.dateTagFormatDescription())
      .addText((text) =>
        text.setPlaceholder(currentSettings.dateTagFormat).onChange(async (dateTagFormat) => {
          if (dateTagFormat.length === 0) dateTagFormat = DEFAULT_SETTINGS.dateTagFormat;
          if (!this.validateDateTag(dateTagFormat)) {
            tagFormatSetting.descEl.empty();
            tagFormatSetting.setDesc(this.dateTagFormatDescription('Date tag must include %date% token.'));
            return;
          }
          tagFormatSetting.descEl.empty();
          tagFormatSetting.setDesc(this.dateTagFormatDescription());
          this.plugin.updateSettings({ ...currentSettings, dateTagFormat });
        }),
      );

    // --- Date format ---
    const dateFormatSetting = new Setting(containerEl);
    dateFormatSetting
      .setName('Date format')
      .setDesc(this.dateFormatDescription())
      .addText((text) =>
        text.setPlaceholder(currentSettings.dateFormat).onChange(async (dateFormat) => {
          if (dateFormat.length === 0) dateFormat = DEFAULT_SETTINGS.dateFormat;
          if (!this.validateDateFormat(dateFormat)) {
            dateFormatSetting.descEl.empty();
            dateFormatSetting.setDesc(this.dateTagFormatDescription('Invalid date format.'));
            return;
          }
          dateFormatSetting.descEl.empty();
          dateFormatSetting.setDesc(this.dateTagFormatDescription());
          this.plugin.updateSettings({ ...currentSettings, dateFormat });
        }),
      );

    // --- Open in new leaf ---
    new Setting(containerEl)
      .setName('Open files in a new leaf')
      .setDesc('If enabled, opening a task will open its file in a new leaf.')
      .addToggle((toggle) => {
        toggle.setValue(currentSettings.openFilesInNewLeaf);
        toggle.onChange(async (openFilesInNewLeaf) => {
          this.plugin.updateSettings({ ...currentSettings, openFilesInNewLeaf });
        });
      });

    // --- Focus: max items ---
    containerEl.createEl('h3', { text: 'Focus tab' });

    new Setting(containerEl)
      .setName('Max items in Focus')
      .setDesc('Maximum number of tasks shown in the Focus tab (1–10).')
      .addSlider((slider) => {
        slider
          .setLimits(1, 10, 1)
          .setValue(currentSettings.focusMaxItems)
          .setDynamicTooltip()
          .onChange(async (focusMaxItems) => {
            this.plugin.updateSettings({ ...currentSettings, focusMaxItems });
          });
      });

    // --- Focus: priority rules ---
    containerEl.createEl('h4', { text: 'Priority rules (applied in order)' });
    containerEl.createEl('p', {
      text: 'Tags are matched against task text. "all" = no limit, or enter a number (e.g. 1).',
      cls: 'setting-item-description',
    });

    const rules = [...currentSettings.focusPriorityRules];

    const renderRules = () => {
      rulesContainer.empty();
      rules.forEach((rule, index) => {
        const row = rulesContainer.createDiv('flowfocus-rule-row');

        // Tag input
        const tagInput = row.createEl('input', { type: 'text', placeholder: 'tag (e.g. urgent)' });
        tagInput.value = rule.tag;
        tagInput.addEventListener('change', () => {
          rules[index] = { ...rules[index], tag: tagInput.value.replace(/^#/, '') };
          this.plugin.updateSettings({ ...currentSettings, focusPriorityRules: [...rules] });
        });

        // Max input
        const maxInput = row.createEl('input', { type: 'text', placeholder: 'all or number' });
        maxInput.value = rule.max === 'all' ? 'all' : String(rule.max);
        maxInput.style.width = '60px';
        maxInput.addEventListener('change', () => {
          const val = maxInput.value.trim();
          const parsed = parseInt(val);
          rules[index] = { ...rules[index], max: isNaN(parsed) ? 'all' : parsed };
          this.plugin.updateSettings({ ...currentSettings, focusPriorityRules: [...rules] });
        });

        // Remove button
        const removeBtn = row.createEl('button', { text: 'x' });
        removeBtn.addEventListener('click', () => {
          rules.splice(index, 1);
          this.plugin.updateSettings({ ...currentSettings, focusPriorityRules: [...rules] });
          renderRules();
        });
      });

      // Add rule button
      const addBtn = rulesContainer.createEl('button', { text: '+ Add rule' });
      addBtn.addEventListener('click', () => {
        rules.push({ tag: '', max: 'all' });
        renderRules();
      });
    };

    const rulesContainer = containerEl.createDiv('flowfocus-rules-container');
    renderRules();
  }

  private dateTagFormatDescription(error?: string): DocumentFragment {
    const el = document.createDocumentFragment();
    el.appendText('The format in which the due date is included in the task description.');
    el.appendChild(document.createElement('br'));
    el.appendText('Must include the %date% token.');
    el.appendChild(document.createElement('br'));
    el.appendText("To configure the format of the date, see 'Date format'.");
    if (error != null) {
      el.appendChild(document.createElement('br'));
      el.appendText(`Error: ${error}`);
    }
    return el;
  }

  private dateFormatDescription(error?: string): DocumentFragment {
    const el = document.createDocumentFragment();
    el.appendText('Dates in this format will be recognised as due dates.');
    el.appendChild(document.createElement('br'));
    const a = document.createElement('a');
    a.href = 'https://moment.github.io/luxon/#/formatting?id=table-of-tokens';
    a.text = 'See the documentation for supported tokens.';
    a.target = '_blank';
    el.appendChild(a);
    if (error != null) {
      el.appendChild(document.createElement('br'));
      el.appendText(`Error: ${error}`);
    }
    return el;
  }

  private validateDateTag(dateTag: string): boolean {
    if (dateTag.length === 0) return true;
    return dateTag.includes('%date%');
  }

  private validateDateFormat(dateFormat: string): boolean {
    if (dateFormat.length === 0) return true;
    const expected = DateTime.fromISO('2020-05-25');
    const formatted = expected.toFormat(dateFormat);
    const parsed = DateTime.fromFormat(formatted, dateFormat);
    return parsed.hasSame(expected, 'day') && parsed.hasSame(expected, 'month') && parsed.hasSame(expected, 'year');
  }
}
