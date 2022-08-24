import { ElementWithDimens } from './models';

type FindResult = {
  group: HTMLElement;
  previous: HTMLElement | null;
  next: HTMLElement | null;
};

export class ElementFinder {
  feeler = 15;
  current: ElementWithDimens | null = null;
  others: ElementWithDimens[] = [];
  group: HTMLElement;

  constructor(groupId: string) {
    const group: HTMLElement | null = document.querySelector(`[data-onyx-group-id='${groupId}']`);
    if (!group) throw new Error(`No group found with ID ${groupId}`);

    this.group = group;

    const items: HTMLElement[] = Array.from(group.querySelectorAll(`[data-onyx-item-id]`));

    items.forEach((item) => {
      if (item.dataset.onyxFocused) {
        this.current = {
          element: item,
          dimens: item.getBoundingClientRect() || {
            top: 0,
            bottom: 0,
            left: 0,
            right: document.documentElement.clientWidth,
          },
        };
      } else {
        this.others.push({
          element: item,
          dimens: item.getBoundingClientRect(),
        });
      }
    });
  }

  getCurrent(): HTMLElement | null {
    return this.current?.element || null;
  }

  getByShortcut(key: string): HTMLElement | null {
    return (
      [this.current, ...this.others].find((a) => a?.element.dataset.onyxShortcut == key)?.element ||
      null
    );
  }

  getGroup(): HTMLElement | null {
    return this.group;
  }

  find(key: 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown'): FindResult {
    let next;

    switch (key) {
      case 'ArrowUp':
        next = this.findTop();
        break;
      case 'ArrowDown':
        next = this.findBottom();
        break;
      case 'ArrowLeft':
        next = this.findLeft();
        break;
      case 'ArrowRight':
        next = this.findRight();
        break;
    }

    return {
      group: this.group,
      previous: this.current?.element || null,
      next,
    };
  }

  findTop(): HTMLElement | null {
    if (!this.current) {
      return this.others.at(-1)?.element || null;
    }
    const found = this.others.filter((other) => {
      if (other.dimens.bottom > this.current!.dimens.top) {
        return false;
      }
      if (other.dimens.bottom - this.current!.dimens.top > this.feeler) {
        return false;
      }
      if (other.dimens.bottom < this.current!.dimens.top - this.feeler) {
        return false;
      }
      if (
        !this.overlapV(
          this.current!.dimens.left,
          this.current!.dimens.right,
          other.dimens.left,
          other.dimens.right
        )
      ) {
        return false;
      }

      return true;
    });

    return this.overlapCenterH(this.current, found);
  }

  findBottom(): HTMLElement | null {
    if (!this.current) {
      return this.others[0].element;
    }

    const found = this.others.filter((a) => {
      if (a.dimens.top < this.current!.dimens.bottom) {
        return false;
      }
      if (a.dimens.top - this.current!.dimens.bottom > this.feeler) {
        return false;
      }
      if (
        !this.overlapV(
          this.current!.dimens.left,
          this.current!.dimens.right,
          a.dimens.left,
          a.dimens.right
        )
      ) {
        return false;
      }

      return true;
    });

    return this.overlapCenterH(this.current, found);
  }

  findLeft(): HTMLElement | null {
    if (!this.current) {
      return null;
    }
    const found = this.others.filter((a) => {
      if (a.dimens.right > this.current!.dimens.left) {
        return false;
      }
      if (this.current!.dimens.left - a.dimens.right > this.feeler) {
        return false;
      }
      if (
        !this.overlapH(
          this.current!.dimens.top,
          this.current!.dimens.bottom,
          a.dimens.top,
          a.dimens.bottom
        )
      ) {
        return false;
      }

      return true;
    });

    return this.overlapCenterV(this.current, found);
  }

  findRight(): HTMLElement | null {
    if (!this.current) {
      return null;
    }
    const found = this.others.filter((a) => {
      if (a.dimens.left < this.current!.dimens.right) {
        return false;
      }
      if (this.current!.dimens.right - a.dimens.left > this.feeler) {
        return false;
      }
      if (
        !this.overlapH(
          this.current!.dimens.top,
          this.current!.dimens.bottom,
          a.dimens.top,
          a.dimens.bottom
        )
      ) {
        return false;
      }

      return true;
    });

    return this.overlapCenterV(this.current, found);
  }

  overlapV(
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

  overlapH(
    sourceTop: number,
    sourceBottom: number,
    otherTop: number,
    otherBottom: number
  ): boolean {
    if (otherTop >= sourceTop && otherBottom <= sourceBottom) return true;
    if (otherTop <= sourceTop && otherBottom >= sourceBottom) return true;

    return false;
  }

  overlapCenterH(source: ElementWithDimens, elements: ElementWithDimens[]): HTMLElement | null {
    if (elements.length === 0) {
      return null;
    } else if (elements.length === 1) {
      return elements[0].element;
    } else {
      // Find element nearest center
      const width = source.dimens.right - source.dimens.left;
      const center = Math.floor(source.dimens.right - width / 2);

      return (
        elements.find((a) => {
          if (a.dimens.left <= center && a.dimens.right >= center) {
            return true;
          }
          return false;
        })?.element || null
      );
    }
  }

  overlapCenterV(source: ElementWithDimens, elements: ElementWithDimens[]): HTMLElement | null {
    if (elements.length === 0) {
      return null;
    } else if (elements.length === 1) {
      return elements[0].element;
    } else {
      // Find element nearest center
      const height = source.dimens.bottom - source.dimens.top;
      const center = Math.floor(source.dimens.bottom - height / 2);

      return (
        elements.find((a) => {
          if (a.dimens.top <= center && a.dimens.bottom >= center) {
            return true;
          }
          return false;
        })?.element || null
      );
    }
  }
}
