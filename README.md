<br>
<img display='inline' src="./static/icon.png" alt="PlayBuild" width="100">
<h1 display='inline'>PlayBuild</h1>
<h3>A bundler and package manager for PlayCanvas</h3>
<b><a href='https://chrome.google.com/webstore/detail/playbuild/nehnoidafglmienfkfgghgokkccbpfap'>Install</a></b> |
<b><a href='https://github.com/wearekuva/pcpm/wiki/Getting-Started'>Getting Started</a></b> |
<b><a href='https://github.com/wearekuva/playbuild/wiki'>Docs</a></b>
<br>
<br>

  
PlayBuild is a in-editor compiler, bundler and package manager for the PlayCanvas editor that adds support for Javascript Modules, TypeScript JSX and all the usual features of modern web tooling. Use js modules and npm libraries in your PlayCanvas projects and it all the regular features of a modern web tooling such such as minification, treeshaking and more.


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

### Install libraries from NPM
PlayBuild also ships with a dedicated package manager so you can search for 3rd party libaries on npm and bundle them with your project. No more juggling your script loading order or searching for the libraries in the correct format. Playbuild will bundle the libraries you need and ignore the ones you don't.

<img width="300" src="https://user-images.githubusercontent.com/430764/213010752-a5cc8f0c-6c65-4eac-9e2c-361a3a70c87c.png">

### More build options
You can also configure the bundler depending on your projects needs. You can optionally minify, remove console logs and disable tree-shaking. It supports a subset of the features found in WebPack and Esbuild. [Check the full list of options.](https://github.com/wearekuva/playbuild/wiki/Options)

### How?
Playbuild compiles and bundles your code down into a single built file that includes all of your projects scripts and any external libraries you've installed. At it's core it's built around [esbuild](https://github.com/evanw/esbuild), a modern, fast and robust compiler which means more compact code, less network requests and faster start up times. But more importantly it gives you more flexibility building your PlayCanvas projects and provides all the benefits of modern js tools.

