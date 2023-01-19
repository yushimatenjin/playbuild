<br>
<img display='inline' src="./static/icon.png" alt="PlayBuild" width="100">
<h1 display='inline'>PlayBuild</h1>
<h3>A bundler and package manager for PlayCanvas</h3>
<b><a href='https://chrome.google.com/webstore/detail/playbuild/nehnoidafglmienfkfgghgokkccbpfap'>Install</a></b> |
<b><a href='https://github.com/wearekuva/pcpm/wiki/Getting-Started'>Getting Started</a></b> |
<b><a href='https://github.com/wearekuva/playbuild/wiki'>Docs</a></b>
<br>
<br>

  
PlayBuild is a in-editor compiler, bundler and package manager for the PlayCanvas editor that adds support for Javascript Modules, TypeScript JSX and all the usual features of modern web tooling. You can use js modules and npm libraries in your PlayCanvas projects and it supports all the regular features of a compiler such such as de-duping, minification and treeshaking and more. It also has preliminary support for JSX and TypeScript.


```javascript
// Import code from other scripts
import config from './config'

// import npm libs
import { firebaseApp } from 'firebase/app'
import React from 'react'

var MyScript = pc.createScript('myScript')

// initialize code called once per entity
MyScript.prototype.initialize = function() {

    // Import your own modules
    const key = config.firebaseKey

    // Use NPM modules
    const app = firebaseApp(key)
}
```

### External libraries
PlayBuild also ships with a dedicated package manager so you can search for 3rd party libaries on npm and bundle them with your project. No more juggling your script loading order or searching for the libraries in the correct format. Playbuild will bundle the libraries you need and ignore the ones you don't.

<img width="300" src="https://user-images.githubusercontent.com/430764/213010752-a5cc8f0c-6c65-4eac-9e2c-361a3a70c87c.png">

### Configurable
You can also configure the bundler depending on your projects needs. You can optionally minify, remove console logs and disable tree-shaking. It supports a subset of the features found in WebPack and Esbuild. [Check the full list of options.](https://github.com/wearekuva/playbuild/wiki/Options)

### How?
PlayBuild is a compiler built around [ESBuild](https://github.com/evanw/esbuild). It syncs with your project and compiles and bundles your code. Your asset registry becomes a virtual file system so local modules can be resolved and remote modules can be imported. There is no run-time dependancy on any external CDN's, so you don't need to worry about outages in production

