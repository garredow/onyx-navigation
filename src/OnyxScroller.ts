import { Dimensions } from './models';
import { OnyxItem } from './OnyxItem';

export class OnyxScroller {
  id: string;
  element: HTMLElement;
  private _dimensions: Dimensions | undefined;

  constructor(groupId: string) {
    this.id = groupId;

    const element: HTMLElement | null = document.querySelector(
      `[data-onyx-group-id='${this.id}'] [data-onyx-scroller]`
    );
    if (!element) throw new Error(`No scroller found for group ${this.id}`);

    this.element = element;
  }

  get dimensions() {
    if (!this._dimensions) {
      this._dimensions = this.element.getBoundingClientRect();
    }
    return this._dimensions;
  }

  canScrollUp(): boolean {
    return this.element.scrollTop > 0;
  }

  canScrollDown(): boolean {
    return this.element.scrollTop + this.element.clientHeight < this.element.scrollHeight;
  }

  scrollUp(behavior: 'auto' | 'smooth' = 'smooth'): void {
    this.element.scrollBy({
      top: (this.element.clientHeight / 2) * -1,
      behavior,
    });
  }

  scrollDown(behavior: 'auto' | 'smooth' = 'smooth'): void {
    this.element.scrollBy({
      top: this.element.clientHeight / 2,
      behavior,
    });
  }

  scrollToItem(item: OnyxItem, behavior: 'auto' | 'smooth'): void {
    const topDiff = this.dimensions.top - item.dimensions.top;
    const bottomDiff = item.dimensions.bottom - (this.dimensions.height + this.dimensions.top);

    this.element.scrollBy({
      top: topDiff > 0 ? -topDiff : bottomDiff > 0 ? bottomDiff : 0,
      behavior,
    });
  }
}
