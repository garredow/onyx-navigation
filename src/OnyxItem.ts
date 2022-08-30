import { Dimensions } from './models';

export class OnyxItem {
  id: string;
  shortcutId: string | undefined;
  groupId: string;
  isFocused: boolean;
  element: HTMLElement;
  private _dimensions: Dimensions | null = null;

  constructor(element: HTMLElement, groupId: string) {
    this.element = element;
    const id = element.dataset.onyxItemId;
    const shortcutId = element.dataset.onyxShortcut;

    this.id = id as string;
    this.shortcutId = shortcutId;
    this.groupId = groupId;
    this.isFocused = this.element.hasAttribute('data-onyx-focused');
  }

  get dimensions() {
    if (!this._dimensions) {
      this._dimensions = this.element.getBoundingClientRect();
    }
    return this._dimensions;
  }

  focus(): void {
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
    this.isFocused = true;
  }

  blur(): void {
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
    this.isFocused = false;
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
