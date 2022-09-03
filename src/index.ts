import { OnyxKeys } from 'onyx-keys';
import { KeyPressEvent } from 'onyx-keys/lib/events';
import { ScrollBehavior } from './enums';
import { Group } from './models';
import { OnyxGroup } from './OnyxGroup';

type Config = {
  scrollBehavior: ScrollBehavior;
  allowedKeysInInputs: string[];
  groupRegistration: 'auto' | 'manual';
};

const defaultConfig: Config = {
  scrollBehavior: ScrollBehavior.Dynamic,
  allowedKeysInInputs: ['ArrowDown', 'ArrowUp', 'SoftLeft', 'SoftRight', 'Enter'],
  groupRegistration: 'auto',
};

export class OnyxNavigation {
  private static listening = false;
  private static groupStack: Group[] = [];
  private static config: Config = defaultConfig;
  private static keys: any;

  static restoreFocusedItems() {
    this.checkGroups();
    this.groupStack.forEach(({ id }) => new OnyxGroup(id).restoreFocusedItem());
  }

  // Groups

  static registerGroup(id: string): void {
    this.groupStack.push({ id });
  }

  static unregisterGroup(id: string): void {
    this.groupStack = this.groupStack.filter((a) => a.id !== id);
  }

  static getActiveGroup(): Group | null {
    return this.groupStack.at(-1) || null;
  }

  private static checkGroups(): void {
    const allGroups = Array.from(document.querySelectorAll('[data-onyx-group-id]'))
      .map((a) => (a as HTMLElement).dataset.onyxGroupId)
      .filter(Boolean) as string[];
    const existingGroups = this.groupStack.map((a) => a.id);
    const newGroups = allGroups.filter((a) => !existingGroups.includes(a));
    const removedGroups = existingGroups.filter((a) => !allGroups.includes(a));

    removedGroups.forEach((a) => this.unregisterGroup(a));
    newGroups.forEach((a) => this.registerGroup(a));
  }

  // Key Handler

  static startListening(options?: Partial<Config>): void {
    if (this.listening) return;

    this.config = { ...defaultConfig, ...options };

    this.keys = OnyxKeys.subscribe({
      onArrowUp: this.handleKeyPress.bind(this),
      onArrowDown: this.handleKeyPress.bind(this),
      onArrowLeft: this.handleKeyPress.bind(this),
      onArrowRight: this.handleKeyPress.bind(this),
      onEnter: this.handleKeyPress.bind(this),
      onSoftLeft: this.handleKeyPress.bind(this),
      onSoftRight: this.handleKeyPress.bind(this),
      on1: this.handleKeyPress.bind(this),
      on2: this.handleKeyPress.bind(this),
      on3: this.handleKeyPress.bind(this),
      on4: this.handleKeyPress.bind(this),
      on5: this.handleKeyPress.bind(this),
      on6: this.handleKeyPress.bind(this),
      on7: this.handleKeyPress.bind(this),
      on8: this.handleKeyPress.bind(this),
      on9: this.handleKeyPress.bind(this),
    });

    this.listening = true;
  }

  static stopListening(): void {
    if (!this.listening) return;

    this.keys.unsubscribe();
    this.keys = null;

    this.listening = false;
  }

  private static async handleKeyPress(ev: KeyPressEvent) {
    // We only want the arrow keys to repeat
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(ev.detail.key) && ev.repeat) {
      return;
    }

    if (ev.detail.targetIsInput && !this.config.allowedKeysInInputs.includes(ev.detail.key)) {
      return;
    }

    if (this.config.groupRegistration === 'auto') {
      this.checkGroups();
    }

    if (ev.detail.key === 'Other' || !this.getActiveGroup()) {
      return;
    }

    const group = new OnyxGroup(this.getActiveGroup()?.id || '');
    const focused = group.getFocusedItem();

    if (ev.detail.key === 'Enter') {
      focused?.select();
      return;
    }

    if (ev.detail.key === 'SoftLeft' || ev.detail.key === 'SoftRight') {
      focused?.softkey(ev.detail.key);
      return;
    }

    const shortcutKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    if (shortcutKeys.includes(ev.detail.key)) {
      focused?.blur();

      const next = group.getItemByShortcut(ev.detail.key);
      if (next) {
        next.select();
        group.scrollToItem(next, 'auto');
      }

      return;
    }

    const next = group.findNextItem(ev.detail.key as any);
    if (next) {
      focused?.blur();
      next.focus();
      group.scrollToItem(next, this.getScrollBehavior(ev.repeat));
    } else if (ev.detail.key === 'ArrowUp' && group.canScrollUp()) {
      group.scrollUp();
    } else if (ev.detail.key === 'ArrowDown' && group.canScrollDown()) {
      group.scrollDown();
    }
  }

  private static getScrollBehavior(isRepeat: boolean): 'auto' | 'smooth' {
    if (this.config.scrollBehavior === ScrollBehavior.Instant) {
      return 'auto';
    } else if (this.config.scrollBehavior === ScrollBehavior.Smooth) {
      return 'smooth';
    } else if (this.config.scrollBehavior === ScrollBehavior.Dynamic && isRepeat) {
      return 'auto';
    } else if (this.config.scrollBehavior === ScrollBehavior.Dynamic && !isRepeat) {
      return 'smooth';
    } else {
      return 'smooth';
    }
  }
}
