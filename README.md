# onyx-navigation

[![CircleCI](https://circleci.com/gh/garredow/onyx-navigation/tree/main.svg?style=svg)](https://circleci.com/gh/garredow/onyx-navigation/tree/main)
[![npm](https://img.shields.io/npm/v/onyx-navigation.svg)](https://www.npmjs.com/package/onyx-navigation)

A library to handle d-pad navigation in KaiOS.

## Installation

```
npm install onyx-navigation
```

## Events

### `onyx:blur`

Fired on an element when it loses focus.

### `onyx:focus`

Fired on an element when it gains focus.

### `onyx:select`

Fired on the focused element when the Enter key is pressed.

### `onyx:softleft`

Fired on the focused element when the SoftLeft key is pressed.

### `onyx:softright`

Fired on the focused element when the SoftRight key is pressed.

## Attributes

### `data-onyx-group-id`

Marks an element as an Onyx group.

### `data-onyx-scroller`

Marks an element as an Onyx scroller. You need one of these in each Onyx group. This is the element that your items will scroll in.

### `data-onyx-item-id`

Marks an element as an Onyx item. This must be a unique value per Onyx group.

### `data-onyx-focused`

When an element is focused, it gains this attribute.

### `data-onyx-shortcut`

This lets you tie an element to a 1-9 number key. Pressing one of these keys will fire `onyx:focus` and `onyx:select` on the marked element.

## Example

```js
OnyxNavigation.startListening({
  useNumbers: true,
  useSoftLeft: true,
  useSoftRight: true,
});
OnyxNavigation.registerGroup('main');

document.addEventListener('onyx:focus', (ev) => {
  console.log(`Item ${ev.detail.itemId} in group ${ev.detail.groupId} focused`);
});
document.addEventListener('onyx:blur', (ev) => {
  console.log(`Item ${ev.detail.itemId} in group ${ev.detail.groupId} blurred`);
});
document.addEventListener('onyx:select', (ev) => {
  console.log(`Item ${ev.detail.itemId} in group ${ev.detail.groupId} selected`);
});
document.addEventListener('onyx:softleft', (ev) => {
  console.log(`Item ${ev.detail.itemId} in group ${ev.detail.groupId} softleft`);
});
document.addEventListener('onyx:softright', (ev) => {
  console.log(`Item ${ev.detail.itemId} in group ${ev.detail.groupId} softright`);
});
```

```html
<div class="content" data-onyx-group-id="main">
  <div class="scroller" data-onyx-scroller>
    <div class="row">
      <div class="item" data-onyx-item-id="row1_item1" data-onyx-shortcut="1"></div>
      <div class="item" data-onyx-item-id="row1_item2" data-onyx-shortcut="2"></div>
      <div class="item" data-onyx-item-id="row1_item3" data-onyx-shortcut="3"></div>
    </div>
    <div class="row">
      <div class="item" data-onyx-item-id="row2_item1" data-onyx-shortcut="4"></div>
      <div class="item" data-onyx-item-id="row2_item2" data-onyx-shortcut="5"></div>
      <div class="item" data-onyx-item-id="row2_item3" data-onyx-shortcut="6"></div>
    </div>
    <div class="row">
      <div class="item" data-onyx-item-id="row3_item1" data-onyx-shortcut="7"></div>
      <div class="item" data-onyx-item-id="row3_item2" data-onyx-shortcut="8"></div>
      <div class="item" data-onyx-item-id="row3_item3" data-onyx-shortcut="9"></div>
    </div>
  </div>
</div>
```
