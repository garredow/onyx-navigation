import { Dimensions } from './models';
import { OnyxItem } from './OnyxItem';
import { OnyxScroller } from './OnyxScroller';

export class OnyxGroup {
  id: string;
  element: HTMLElement;
  private _dimensions: Dimensions | undefined;
  private scroller: OnyxScroller;
  private items: OnyxItem[] = [];
  private feelerRange = 25;

  constructor(groupId: string) {
    this.id = groupId;

    const group: HTMLElement | null = document.querySelector(`[data-onyx-group-id='${this.id}']`);
    if (!group) throw new Error(`No group found with ID ${this.id}`);

    this.element = group;

    this.scroller = new OnyxScroller(groupId);
    this.items = Array.from(this.element.querySelectorAll(`[data-onyx-item-id]`)).map(
      (a) => new OnyxItem(a as HTMLElement, this.id)
    );
  }

  get dimensions() {
    if (!this._dimensions) {
      this._dimensions = this.element.getBoundingClientRect();
    }
    return this._dimensions;
  }

  hasItems(): boolean {
    return this.items.length > 0;
  }

  hasItem(itemId: string): boolean {
    return this.items.some((a) => a.id == itemId);
  }

  focusItem(itemId: string, scrollBehavior: 'auto' | 'smooth'): void {
    const item = this.items.find((a) => a.id === itemId);
    if (!item) {
      throw new Error(`No item for ID ${itemId} found in group ${this.id}`);
    }

    const previous = this.items.find((a) => a.isFocused);
    const next = this.items.find((a) => a.id === itemId);

    previous?.blur();
    next?.focus();

    if (next) {
      this.scrollToItem(next, scrollBehavior);
    }
  }

  getFocusedItem(): OnyxItem | null {
    const item = this.items.find((a) => a.isFocused);
    return item || null;
  }

  getItemById(itemId: string): OnyxItem {
    const item = this.items.find((a) => a.id === itemId);
    if (!item) {
      throw new Error(`No item for ID ${itemId} found in group ${this.id}`);
    }

    return item;
  }

  getItemByShortcut(shortcut: string): OnyxItem | null {
    const item = this.items.find((a) => a.shortcutId === shortcut);
    return item || null;
  }

  findNextItem(key: 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown'): OnyxItem | null {
    const focused = this.getFocusedItem();

    const viewportTop = this.scroller.dimensions.top - this.feelerRange;
    const viewportBottom = this.scroller.dimensions.bottom + this.feelerRange;

    const others = this.items
      .filter((a) => a.id !== focused?.id)
      .filter((a) => {
        // Only include items in viewport
        const { top, bottom } = a.dimensions;

        return (
          (top >= viewportTop && top <= viewportBottom) ||
          (bottom <= viewportBottom && bottom >= viewportTop)
        );
      });

    let next: OnyxItem | null = null;

    switch (key) {
      case 'ArrowUp':
        next = this.findTop(focused, others);
        break;
      case 'ArrowDown':
        next = this.findBottom(focused, others);
        break;
      case 'ArrowLeft':
        next = this.findLeft(focused, others);
        break;
      case 'ArrowRight':
        next = this.findRight(focused, others);
        break;
    }

    return next;
  }

  canScrollUp(): boolean {
    return this.scroller.canScrollUp();
  }

  canScrollDown(): boolean {
    return this.scroller.canScrollDown();
  }

  scrollUp(behavior: 'auto' | 'smooth' = 'smooth'): void {
    this.scroller.scrollUp(behavior);
  }

  scrollDown(behavior: 'auto' | 'smooth' = 'smooth'): void {
    this.scroller.scrollDown(behavior);
  }

  scrollToItem(item: OnyxItem, behavior: 'auto' | 'smooth'): void {
    this.scroller.scrollToItem(item, behavior);
  }

  private findTop(focused: OnyxItem | null, others: OnyxItem[]): OnyxItem | null {
    if (!focused) {
      return others.at(-1) || null;
    }
    if (others.length === 0) {
      return null;
    }

    const closestItems = others
      .filter((a) => focused.dimensions.top - a.dimensions.bottom >= 0)
      .sort((a, b) => {
        const diffA = focused.dimensions.top - a.dimensions.bottom;
        const diffB = focused.dimensions.top - b.dimensions.bottom;
        if (diffA > diffB) return 1;
        else if (diffA < diffB) return -1;
        else return 0;
      })
      .filter((a, i, arr) => {
        const closest = focused.dimensions.top - arr[0].dimensions.bottom;
        const current = focused.dimensions.top - a.dimensions.bottom;
        return closest === current;
      });

    const found = closestItems.filter((other) => {
      if (other.dimensions.bottom > focused!.dimensions.top) {
        return false;
      }
      if (
        !this.overlapV(
          focused.dimensions.left,
          focused.dimensions.right,
          other.dimensions.left,
          other.dimensions.right
        )
      ) {
        return false;
      }

      return true;
    });

    return this.overlapCenterH(focused, found);
  }

  private findBottom(focused: OnyxItem | null, others: OnyxItem[]): OnyxItem | null {
    if (!focused) {
      return others?.[0] || null;
    }
    if (others.length === 0) {
      return null;
    }

    const closestItems = others
      .filter((a) => a.dimensions.top >= focused.dimensions.bottom)
      .sort((a, b) => {
        const diffA = a.dimensions.bottom - focused.dimensions.top;
        const diffB = b.dimensions.bottom - focused.dimensions.top;
        if (diffA > diffB) return 1;
        else if (diffA < diffB) return -1;
        else return 0;
      })
      .filter((a, i, arr) => {
        const closest = focused.dimensions.bottom - arr[0].dimensions.top;
        const current = focused.dimensions.bottom - a.dimensions.top;
        return closest === current;
      });

    const found = closestItems.filter((a) => {
      if (a.dimensions.top < focused.dimensions.bottom) {
        return false;
      }
      if (
        !this.overlapV(
          focused!.dimensions.left,
          focused!.dimensions.right,
          a.dimensions.left,
          a.dimensions.right
        )
      ) {
        return false;
      }

      return true;
    });

    return this.overlapCenterH(focused, found);
  }

  private findLeft(focused: OnyxItem | null, others: OnyxItem[]): OnyxItem | null {
    if (!focused) {
      return null;
    }
    const found = others.filter((a) => {
      if (a.dimensions.right > focused!.dimensions.left) {
        return false;
      }
      if (focused!.dimensions.left - a.dimensions.right > this.feelerRange) {
        return false;
      }
      if (
        !this.overlapH(
          focused!.dimensions.top,
          focused!.dimensions.bottom,
          a.dimensions.top,
          a.dimensions.bottom
        )
      ) {
        return false;
      }

      return true;
    });

    return this.overlapCenterV(focused, found);
  }

  private findRight(focused: OnyxItem | null, others: OnyxItem[]): OnyxItem | null {
    if (!focused) {
      return null;
    }
    const found = others.filter((a) => {
      if (a.dimensions.left < focused!.dimensions.right) {
        return false;
      }
      if (focused!.dimensions.right - a.dimensions.left > this.feelerRange) {
        return false;
      }
      if (
        !this.overlapH(
          focused!.dimensions.top,
          focused!.dimensions.bottom,
          a.dimensions.top,
          a.dimensions.bottom
        )
      ) {
        return false;
      }

      return true;
    });

    return this.overlapCenterV(focused, found);
  }

  private findClosest(focused: OnyxItem, others: OnyxItem[]): OnyxItem[] {
    const closestItems = others
      .filter((a) => focused.dimensions.top - a.dimensions.bottom >= 0)
      .sort((a, b) => {
        const diffA = focused.dimensions.top - a.dimensions.bottom;
        const diffB = focused.dimensions.top - b.dimensions.bottom;
        if (diffA > diffB) return 1;
        else if (diffA < diffB) return -1;
        else return 0;
      })
      .filter((a, i, arr) => {
        const closest = focused.dimensions.top - arr[0].dimensions.bottom;
        const current = focused.dimensions.top - a.dimensions.bottom;

        console.log('closest', closest);
        return closest === current;
      });

    console.log('closestItems', closestItems);
    return closestItems;

    const map = others.reduce((acc, val) => {
      const diff = focused.dimensions.top - val.dimensions.bottom;
      acc[diff] = acc[diff] ? [...acc[diff], val] : [val];
      return acc;
    }, {} as { [key: string]: OnyxItem[] });
    const keys = Object.keys(map)
      .filter((a) => Number(a) >= 0)
      .sort((a, b) => {
        if (Number(a) > Number(b)) return 1;
        else if (Number(a) < Number(b)) return -1;
        else return 0;
      });
    const closest = map[keys[0]] ?? [];
    return closest;
  }

  private overlapV(
    sourceLeft: number,
    sourceRight: number,
    otherLeft: number,
    otherRight: number
  ): boolean {
    if (otherLeft >= sourceLeft && otherRight <= sourceRight) return true;
    if (otherLeft <= sourceLeft && otherRight >= sourceRight) return true;
    if (otherRight > sourceLeft && otherRight < sourceRight) return true;
    if (otherLeft < sourceRight && otherLeft > sourceLeft) return true;

    return false;
  }

  private overlapH(
    sourceTop: number,
    sourceBottom: number,
    otherTop: number,
    otherBottom: number
  ): boolean {
    if (otherTop >= sourceTop && otherBottom <= sourceBottom) return true;
    if (otherTop <= sourceTop && otherBottom >= sourceBottom) return true;

    return false;
  }

  private overlapCenterH(source: OnyxItem, elements: OnyxItem[]): OnyxItem | null {
    if (elements.length === 0) {
      return null;
    } else if (elements.length === 1) {
      return elements[0];
    } else {
      // Find element nearest center
      const width = source.dimensions.right - source.dimensions.left;
      const center = Math.floor(source.dimensions.right - width / 2);

      return (
        elements.find((a) => {
          if (a.dimensions.left <= center && a.dimensions.right >= center) {
            return true;
          }
          return false;
        }) || null
      );
    }
  }

  private overlapCenterV(source: OnyxItem, others: OnyxItem[]): OnyxItem | null {
    if (others.length === 0) {
      return null;
    } else if (others.length === 1) {
      return others[0];
    } else {
      // Find element nearest center
      const height = source.dimensions.bottom - source.dimensions.top;
      const center = Math.floor(source.dimensions.bottom - height / 2);

      return (
        others.find((a) => {
          if (a.dimensions.top <= center && a.dimensions.bottom >= center) {
            return true;
          }
          return false;
        }) || null
      );
    }
  }
}
