# AVMatrix – Video Switcher

Companion module for AVMatrix video switchers controlled over UDP.

## Features

- PGM / PVW switching
- Still selection (16 stills)
- Fade To Black (FTB)
- Keyers / overlays (where supported by device)
- Audio controls (where supported by device)

## Tested devices

The following devices have been tested and confirmed working:

- **AVMatrix HVS0402U**
- **AVMatrix HVS0403U**

Other AVMatrix video switchers using the same UDP control protocol may also work, but are untested.

## Requirements

- Bitfocus Companion v4+
- Network connectivity to the device
- UDP reachable:
  - Device control: UDP 19523
  - Device status: UDP 19522

## Setup (Companion)

1. In Companion go to **Connections** → **Add connection**
2. Select **AVMatrix – Video Switcher**
3. Enter the device **IP address**
4. Apply / save

If everything is correct, the module status should change to **Connected** after a moment.

## Troubleshooting

### Not connecting / stays red
- Confirm the device IP is correct
- Confirm UDP ports **19523 / 19522** are not blocked by firewall
- Make sure the device and Companion are on the same network (or routing allows UDP)

### No status feedbacks
- Status is received over UDP **19522**
- The device must be able to send UDP packets back to the Companion machine

## Development

```bash
yarn install
yarn build
