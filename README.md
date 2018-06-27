# homebridge-website-to-camera

**Homebridge plugin for displaying a Website (intended for Google Maps-->Traffic) as Camera**

[![NPM version](https://badge.fury.io/js/homebridge-website-to-camera.svg)](https://npmjs.org/package/homebridge-website-to-camera) [![Dependency Status](https://david-dm.org/werthdavid/homebridge-website-to-camera.svg)](https://david-dm.org/werthdavid/homebridge-website-to-camera) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com) [![Downloads](https://img.shields.io/npm/dm/homebridge-website-to-camera.svg)](https://npmjs.org/package/homebridge-website-to-camera)


# Installation

1. Install Homebridge using: `(sudo) npm install -g --unsafe-perm homebridge` if you haven't already
2. Install this plugin using: `(sudo) npm install -g homebridge-website-to-camera`
3. Update your Homebridge `config.json` using the sample below (append in the block 'platforms' not 'accessories')
4. If you're using this on ARM/Raspberry Pi: Download the latest [phantomjs-on-raspberry](https://github.com/fg2it/phantomjs-on-raspberry)
* `wget https://github.com/fg2it/phantomjs-on-raspberry/releases/download/v2.1.1-wheezy-jessie-armv6/phantomjs_2.1.1_armhf.deb`
* `sudo dpkg -i phantomjs_2.1.1_armhf.deb`


In some cases, the camera is not visible in Home-App:
* Press + on top right corner in Home-App
* Press `Add device`
* Pres `Code missing`
* Select Camera

# Configuration




## Config file


Take a look at the <a href="config.example.json">example config.json</a>


Fields:

* `name` name of the camera (required)
* `url` the URL of the website that is to be captured
* `width` the width of the virtual browser window
* `height` the height of the virtual browser window
* `renderDelay` time in ms that is waited after loading the URL before screenshot is taken (increase if image is incomplete)


# TODO

* Probably we should use Chrome-Headless/Puppeteer in later versions
* Live-Video not working yet