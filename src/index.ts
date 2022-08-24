import { ElementFinder } from './ElementFinder';
import { Group } from './models';

type Config = {
  useSoftLeft: boolean;
  useSoftRight: boolean;
  useNumbers: boolean;
};

const defaultConfig: Config = {
  useSoftLeft: false,
  useSoftRight: false,
  useNumbers: false,
};

export class OnyxNavigation {
  static listening = false;
  static groupStack: Group[] = [];
  static config: Config = defaultConfig;

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

  // Key Handler

  static startListening(config?: Partial<Config>): void {
    if (this.listening) return;
    this.listening = true;

    this.config = { ...defaultConfig, ...config };
    document.addEventListener('keydown', this.handleKey.bind(this), false);
  }

  static stopListening(): void {
    if (!this.listening) return;
    this.listening = false;

    document.removeEventListener('keydown', this.handleKey.bind(this), false);
  }

  private static handleKey(ev: KeyboardEvent): void {
    const key = this.parseKey(ev);

    // Check if valid key
    const target = ev.target as HTMLElement | undefined;
    const shortcutKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

    let validKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'];
    if (this.config.useSoftLeft) validKeys.push('SoftLeft');
    if (this.config.useSoftRight) validKeys.push('SoftRight');
    if (this.config.useNumbers) validKeys = validKeys.concat(validKeys, shortcutKeys);

    // TODO: Handle inputs
    if (!validKeys.includes(key) || !this.getActiveGroup()) {
      return;
    }

    if (key === 'Enter') {
      const current = new ElementFinder(this.getActiveGroup()!.id).getCurrent();
      current?.dispatchEvent(
        new CustomEvent('onyx:select', {
          bubbles: true,
          detail: {
            groupId: this.getActiveGroup()!.id,
            itemId: current?.dataset.onyxItemId,
          },
        })
      );
      return;
    }

    if (key === 'SoftLeft') {
      const current = new ElementFinder(this.getActiveGroup()!.id).getCurrent();
      current?.dispatchEvent(
        new CustomEvent('onyx:softleft', {
          bubbles: true,
          detail: {
            groupId: this.getActiveGroup()!.id,
            itemId: current?.dataset.onyxItemId,
          },
        })
      );
      return;
    }

    if (key === 'SoftRight') {
      const current = new ElementFinder(this.getActiveGroup()!.id).getCurrent();
      current?.dispatchEvent(
        new CustomEvent('onyx:softright', {
          bubbles: true,
          detail: {
            groupId: this.getActiveGroup()!.id,
            itemId: current?.dataset.onyxItemId,
          },
        })
      );
      return;
    }

    if (shortcutKeys.includes(key)) {
      const finder = new ElementFinder(this.getActiveGroup()!.id);
      const current = finder.getCurrent();
      const next = finder.getByShortcut(key);
      if (!next) return;

      current?.dispatchEvent(
        new CustomEvent('onyx:blur', {
          bubbles: true,
          detail: {
            groupId: this.getActiveGroup()!.id,
            itemId: current?.dataset.onyxItemId,
          },
        })
      );
      current?.removeAttribute('data-onyx-focused');

      next.dispatchEvent(
        new CustomEvent('onyx:focus', {
          bubbles: true,
          detail: {
            groupId: this.getActiveGroup()!.id,
            itemId: next.dataset.onyxItemId,
          },
        })
      );

      next.dispatchEvent(
        new CustomEvent('onyx:select', {
          bubbles: true,
          detail: {
            groupId: this.getActiveGroup()!.id,
            itemId: next.dataset.onyxItemId,
          },
        })
      );

      next.dataset.onyxFocused = 'true';
      const scroller: HTMLElement | null =
        finder.getGroup()?.querySelector(`[data-onyx-scroller]`) || null;
      if (!scroller) throw new Error('Cannot find scroller');

      this.scrollIntoView(scroller, next, 'smooth');

      return;
    }

    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();

    const result = new ElementFinder(this.getActiveGroup()!.id).find(key as any);

    if (result.previous && result.next) {
      result.previous.dispatchEvent(
        new CustomEvent('onyx:blur', {
          bubbles: true,
          detail: {
            groupId: this.getActiveGroup()!.id,
            itemId: result.previous?.dataset.onyxItemId,
          },
        })
      );
      result.previous.removeAttribute('data-onyx-focused');
    }

    if (!result.next) return;

    result.next.dataset.onyxFocused = 'true';

    const scroller: HTMLElement | null = result.group.querySelector(`[data-onyx-scroller]`);
    if (!scroller) return;

    this.scrollIntoView(scroller, result.next, 'smooth');

    result.next?.dispatchEvent(
      new CustomEvent('onyx:focus', {
        bubbles: true,
        detail: {
          groupId: this.getActiveGroup()!.id,
          itemId: result.next?.dataset.onyxItemId,
        },
      })
    );
  }

  private static parseKey(ev: KeyboardEvent): string {
    // Simulate soft keys for testing purposes
    if (ev.shiftKey && ev.key === 'ArrowLeft') {
      return 'SoftLeft';
    }
    if (ev.shiftKey && ev.key === 'ArrowRight') {
      return 'SoftRight';
    }
    return ev.key;
  }

  private static scrollContent(direction: 'up' | 'down', scroller: HTMLElement): boolean {
    scroller.scrollBy({
      top: (scroller.clientHeight / 3) * (direction === 'up' ? -1 : 1),
      behavior: 'smooth',
    });

    return true;
  }

  private static scrollIntoView(
    scroller: HTMLElement,
    item: HTMLElement,
    behavior: 'smooth' | 'auto' = 'auto'
  ): boolean {
    const rect = item.getBoundingClientRect();
    const topDiff = scroller.offsetTop - rect.top;
    const bottomDiff = rect.bottom - (scroller.offsetHeight + scroller.offsetTop);

    scroller.scrollBy({
      top: topDiff > 0 ? -topDiff : bottomDiff > 0 ? bottomDiff : 0,
      behavior,
    });

    return true;
  }
}
