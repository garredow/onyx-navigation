type StateObj = {
  focusMap: { [groupId: string]: string | undefined };
};

export class Route {
  static setState(obj: StateObj): void {
    history.replaceState(
      {
        ...history.state,
        __onyx: obj,
      },
      ''
    );
  }

  static updateState(obj: Partial<StateObj>): void {
    history.replaceState(
      {
        ...history.state,
        __onyx: {
          ...history.state?.__onyx,
          ...obj,
        },
      },
      ''
    );
  }

  static getState(): StateObj {
    return history.state?.__onyx || {};
  }

  static setFocusedId(groupId: string, itemId: string | undefined): void {
    const current = this.getState();
    this.updateState({
      focusMap: {
        ...current.focusMap,
        [groupId]: itemId,
      },
    });
  }

  static getFocusedId(groupId: string): string | undefined {
    return this.getState().focusMap?.[groupId];
  }
}
