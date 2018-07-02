# homebridge-website-to-camera

**Homebridge plugin for displaying a Website (intended for Google Maps-->Traffic) as Camera**

[![NPM version](https://badge.fury.io/js/homebridge-website-to-camera.svg)](https://npmjs.org/package/homebridge-website-to-camera) [![Dependency Status](https://david-dm.org/werthdavid/homebridge-website-to-camera.svg)](https://david-dm.org/werthdavid/homebridge-website-to-camera) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com) [![Downloads](https://img.shields.io/npm/dm/homebridge-website-to-camera.svg)](https://npmjs.org/package/homebridge-website-to-camera)


<img width="350" src="https://werthdavid.github.io/homebridge-website-to-camera/sample.png">

# Installation

1. (Install Homebridge using: `(sudo) npm install -g --unsafe-perm homebridge` if you haven't already)


## Raspberry Pi and any other ARM

Currently I couldn't find a proper solution for installing the plugin on raspberry-pi (Help wanted!) so unfortunately you have to 
use this hacky workaround
2. Download the latest [phantomjs-on-raspberry](https://github.com/fg2it/phantomjs-on-raspberry)
* `wget https://github.com/fg2it/phantomjs-on-raspberry/releases/download/v2.1.1-wheezy-jessie-armv6/phantomjs_2.1.1_armhf.deb`
* `sudo dpkg -i phantomjs_2.1.1_armhf.deb`
3. Find your npm-root:
* `npm root -g` 
* probably the output will be `/usr/lib/node_modules`
3. Install this plugin with git:
* `cd /usr/lib/node_modules`
* `sudo git clone https://github.com/werthdavid/homebridge-website-to-camera.git`
* `cd homebridge-website-to-camera`
* `sudo npm install`

4. Update your Homebridge `config.json` using the sample below (append in the block 'platforms' not 'accessories')



## x86/x64

2. Install this plugin using: `(sudo) npm install -g homebridge-website-to-camera`
3. Update your Homebridge `config.json` using the sample below (append in the block 'platforms' not 'accessories')




# Configuration

Update your config similar to this:
```json
 "platforms":[
      {
         "platform":"website-camera",
         "cameras":[
            {
               "name":"Website 1",
               "url":"http://github.com",
               "width":800,
               "height":400,
               "renderDelay":1500
            }
         ]
      }
   ]
```

## Config file


Take a look at the <a href="config.example.json">example config.json</a>


Fields:

* `name` name of the camera (required)
* `url` the URL of the website that is to be captured
* `width` the width of the virtual browser window
* `height` the height of the virtual browser window
* `renderDelay` time in ms that is waited after loading the URL before screenshot is taken (increase if image is incomplete)


# Usage

In some cases, the camera is not visible in Home-App:
* Press + on top right corner in Home-App
* Press `Add device`
* Press `Code missing`
* Select Camera

# TODO

* Probably we should use Chrome-Headless/Puppeteer in later versions
* Live-Video not working yet