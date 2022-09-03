import { Dimensions } from './models';
import { Route } from './services';

export class OnyxItem {
  id: string;
  shortcutId: string | undefined;
  groupId: string;
  element: HTMLElement;
  private _dimensions: Dimensions | null = null;

  constructor(element: HTMLElement, groupId: string) {
    this.element = element;
    const id = element.dataset.onyxItemId;
    const shortcutId = element.dataset.onyxShortcut;

    this.id = id as string;
    this.shortcutId = shortcutId;
    this.groupId = groupId;
  }

  get isFocused(): boolean {
    return this.element.hasAttribute('data-onyx-focused');
  }

  get dimensions() {
    if (!this._dimensions) {
      this._dimensions = this.element.getBoundingClientRect();
    }
    return this._dimensions;
  }

  focus(): void {
    Route.setFocusedId(this.groupId, this.id);
    this.element.setAttribute('data-onyx-focused', '');
    this.element.dispatchEvent(
      new CustomEvent('onyx:focus', {
        bubbles: true,
        detail: {
          groupId: this.groupId,
          itemId: this.id,
        },
      })
    );
  }

  blur(): void {
    Route.setFocusedId(this.groupId, undefined);
    this.element.removeAttribute('data-onyx-focused');
    this.element.dispatchEvent(
      new CustomEvent('onyx:blur', {
        bubbles: true,
        detail: {
          groupId: this.groupId,
          itemId: this.id,
        },
      })
    );
  }

  select(): void {
    this.focus();

    this.element.dispatchEvent(
      new CustomEvent('onyx:select', {
        bubbles: true,
        detail: {
          groupId: this.groupId,
          itemId: this.id,
        },
      })
    );
  }

  softkey(key: 'SoftLeft' | 'SoftRight'): void {
    this.element.dispatchEvent(
      new CustomEvent(key === 'SoftLeft' ? 'onyx:softleft' : 'onyx:softright', {
        bubbles: true,
        detail: {
          groupId: this.groupId,
          itemId: this.id,
        },
      })
    );
  }
}
