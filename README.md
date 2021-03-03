# Make it fullscreen
Focus any html element to fullscreen.
## Features
- True fullscreen or focus in window modes;
- Animated transition.

## Usage
[![npm install svg-path-bounds](https://nodei.co/npm/make_it_fullscreen.png?mini=true)](https://npmjs.org/package/make_it_fullscreen/)

```js
//Initialize
import FullscreenView from 'make_it_fullscreen'
import {FullscreenViewModes} from 'make_it_fullscreen'

FullscreenView.init(FullscreenViewModes.FULL_WINDOW, '#00000088')//Display mode, cover color

//Request element focus
window.fullscreenView.focusElement(document.getElementById('element_to_focus'))
```