import { ElementFinder } from './ElementFinder';
import { ScrollBehavior } from './enums';
import { Group } from './models';

type Config = {
  enableArrorRepeat: boolean;
  arrowRepeatDelay: number;
  arrowRepeatRate: number;
  scrollBehavior: ScrollBehavior;
};

const defaultConfig: Config = {
  enableArrorRepeat: true,
  arrowRepeatDelay: 500,
  arrowRepeatRate: 100,
  scrollBehavior: ScrollBehavior.Dynamic,
};

export class OnyxNavigation {
  private static listening = false;
  private static activeKey: string | null;
  private static repeaterDelay: NodeJS.Timeout | null;
  private static repeaterInterval: NodeJS.Timeout | null;
  private static groupStack: Group[] = [];
  private static config: Config = defaultConfig;

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

    this.config = { ...defaultConfig, ...config };
    document.addEventListener('keydown', this.handleKeyDown.bind(this), false);
    document.addEventListener('keyup', this.handleKeyUp.bind(this), false);

    this.listening = true;
  }

  static stopListening(): void {
    if (!this.listening) return;

    document.removeEventListener('keydown', this.handleKeyDown.bind(this), false);
    document.removeEventListener('keyup', this.handleKeyUp.bind(this), false);

    this.listening = false;
  }

  private static actOnKey(key: string, isRepeat: boolean): void {
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

    const shortcutKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
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

      this.scrollIntoView(scroller, next, this.getBehavior(isRepeat));

      return;
    }

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

    this.scrollIntoView(scroller, result.next, this.getBehavior(isRepeat));

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

  private static handleKeyUp(ev: KeyboardEvent): void {
    const key = this.parseKey(ev);

    if (!key || key !== this.activeKey) return;

    this.activeKey = null;

    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();

    clearTimeout(this.repeaterDelay!);
    clearInterval(this.repeaterInterval!);
  }

  private static handleKeyDown(ev: KeyboardEvent): void {
    const key = this.parseKey(ev);

    // TODO: Handle inputs
    if (!key || !this.getActiveGroup() || this.activeKey) {
      return;
    }

    this.activeKey = key;

    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();

    this.actOnKey(key, false);

    // Don't repeat non-arrow keys
    if (
      !this.config.enableArrorRepeat ||
      !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)
    )
      return;

    this.repeaterDelay = setTimeout(() => {
      this.repeaterInterval = setInterval(() => {
        this.actOnKey(key, true);
      }, this.config.arrowRepeatRate);
    }, this.config.arrowRepeatDelay);
  }

  private static parseKey(ev: KeyboardEvent): string | null {
    let key = ev.key;

    // Simulate soft keys for testing purposes
    if (ev.shiftKey && ev.key === 'ArrowLeft') {
      key = 'SoftLeft';
    }
    if (ev.shiftKey && ev.key === 'ArrowRight') {
      key = 'SoftRight';
    }

    const shortcutKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    const dpadKeys = [
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Enter',
      'SoftLeft',
      'SoftRight',
    ];

    // TODO: Handle inputs. Example: When in an input, we want 1-9 to type, not
    // act as a shortcut key.

    return [...shortcutKeys, ...dpadKeys].includes(key) ? key : null;
  }

  private static getBehavior(isRepeat: boolean): 'auto' | 'smooth' {
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
    behavior: 'smooth' | 'auto'
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
