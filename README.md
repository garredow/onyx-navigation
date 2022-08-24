# onyx-navigation

[![CircleCI](https://circleci.com/gh/garredow/onyx-navigation/tree/main.svg?style=svg)](https://circleci.com/gh/garredow/onyx-navigation/tree/main)
[![npm](https://img.shields.io/npm/v/onyx-navigation.svg)](https://www.npmjs.com/package/onyx-navigation)

A library to handle d-pad navigation in KaiOS.

## Installation

```
npm install onyx-navigation
```

## Usage

```html
<div class="content" data-onyx-group-id="main">
  <div class="scroller" data-onyx-scroller>
    <div class="row">
      <div class="item" data-onyx-item-id="row1_item1" data-onyx-shortcut="1"></div>
      <div class="item" data-onyx-item-id="row1_item2" data-onyx-shortcut="2"></div>
      <div class="item" data-onyx-item-id="row1_item3" data-onyx-shortcut="3"></div>
      <div class="item" data-onyx-item-id="row1_item4" data-onyx-shortcut="4"></div>
      <div class="item" data-onyx-item-id="row1_item5" data-onyx-shortcut="5"></div>
      <div class="item" data-onyx-item-id="row1_item6" data-onyx-shortcut="6"></div>
    </div>
    <div class="row">
      <div class="item" data-onyx-item-id="row2_item1"></div>
      <div class="item" data-onyx-item-id="row2_item2"></div>
      <div class="item" data-onyx-item-id="row2_item3"></div>
    </div>
  </div>
</div>
```
