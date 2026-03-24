# homebridge-website-to-camera

Homebridge plugin for displaying a website as a camera snapshot.

[![NPM version](https://badge.fury.io/js/homebridge-website-to-camera.svg)](https://npmjs.org/package/homebridge-website-to-camera)
[![Downloads](https://img.shields.io/npm/dm/homebridge-website-to-camera.svg)](https://npmjs.org/package/homebridge-website-to-camera)

This fork is maintained at [palasinio/homebridge-website-to-camera](https://github.com/palasinio/homebridge-website-to-camera).

## Highlights

- Supports Homebridge 1.x and Homebridge 2 beta
- Uses `puppeteer-core` with an installed Chromium/Chrome binary
- Can expose a normal snapshot camera in HomeKit
- Can provide MJPEG output for `homebridge-camera-ffmpeg` live setups

## Requirements

- Homebridge `^1.6.0 || ^2.0.0-beta.0`
- Node.js `^18 || ^20 || ^22 || ^24`
- A local Chromium or Chrome installation

## Installation

1. Install Chromium or Chrome, for example on Debian/Raspberry Pi:
   `sudo apt-get install chromium-browser`
2. Verify the browser path, for example `/usr/bin/chromium-browser`
3. Install the plugin:

```bash
sudo npm install -g homebridge-website-to-camera
```

For this fork directly from GitHub:

```bash
sudo npm install -g git+https://github.com/palasinio/homebridge-website-to-camera.git#master
```

## Configuration

Add this platform to the `platforms` section of your Homebridge `config.json`:

```json
{
  "platform": "website-camera",
  "cameras": [
    {
      "name": "Website 1",
      "url": "https://github.com",
      "chromiumPath": "/usr/bin/chromium-browser"
    }
  ]
}
```

You can add multiple cameras.

See also [config.example.json](config.example.json).

## Options

- `name`: camera name, required
- `id`: unique camera identifier, optional
- `url`: website URL to capture, required
- `scale`: multiplier for the Home app preview size request
- `width` / `height`: explicit browser viewport size, overrides `scale`
- `chromiumPath`: browser executable path, defaults to `/usr/bin/chromium-browser`
- `timeout`: page load timeout in ms, defaults to `10000`
- `renderTimeout`: wait time after page load before screenshot in ms, defaults to `1`
- `ignoreHTTPSErrors`: ignore HTTPS errors, useful for self-signed certificates
- `cacheTime`: reuse a cached image for the given number of seconds
- `jsFile`: inject custom JavaScript into the page before the screenshot
- `live`: set to `"true"` to enable MJPEG helper mode instead of a HomeKit camera
- `liveSnapshotInterval`: interval between snapshots in live mode, defaults to `1000`
- `liveRefreshInterval`: page reload interval in live mode
- `livePort`: MJPEG helper server port in live mode, defaults to `8554`

## Usage

If the camera is not visible in the Home app:

1. Add a new accessory
2. Choose `More options...` or `Code missing`
3. Select the camera accessory
4. Use the setup code shown in the Homebridge log

## Live Mode

If `live` is enabled, the plugin does not expose its own HomeKit camera. Instead, it starts an MJPEG helper server that can be used together with [homebridge-camera-ffmpeg](https://github.com/Sunoo/homebridge-camera-ffmpeg).

Example:

```json
[
  {
    "platform": "website-camera",
    "cameras": [
      {
        "name": "Website 1",
        "url": "https://github.com",
        "live": "true",
        "liveSnapshotInterval": 1000,
        "liveRefreshInterval": 5000,
        "livePort": 8554
      }
    ]
  },
  {
    "platform": "Camera-ffmpeg",
    "cameras": [
      {
        "name": "Website Camera",
        "videoConfig": {
          "source": "-i http://localhost:8554",
          "stillImageSource": "-i http://localhost:8554/still"
        }
      }
    ]
  }
]
```

## Notes

- This plugin is optimized for snapshots, not high-frame-rate video
- For fast-refresh live mode, CPU usage can increase quickly
- The browser instance stays open for better performance and is recycled periodically
