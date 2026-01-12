# AVMatrix (0402U / 0403U) module for Bitfocus Companion

This module adds UDP control for AVMatrix video switchers, including full switching, keyers, audio control, STILL (input freeze), output routing and feedbacks.

Supported devices:
- AVMatrix 0402U
- AVMatrix 0403U

## Installation (local development)

1. Clone the repository.
2. Install dependencies:
   - yarn install
3. Build:
   - yarn build

The compiled module will be in the dist/ directory.

## Configuration

In Companion, add the module and set:
- Host: the IP address of the switcher

The module communicates via UDP.

## What is STILL in this module?

STILL is the input freeze function (not loading/storing images).
When STILL is enabled on a given input, selecting that input on PVW/PGM will show STILL state on the corresponding bus.

## Features

Video switching:
- PGM/PVW switching
- CUT / AUTO
- FTB

Keyers:
- LUMA / CHROMA / DSK
- PIP1 / PIP2
- LOGO
- ON AIR control and feedbacks for each

Audio:
- MUTE control and feedback
- Channel settings (where supported by the device)

STILL (input freeze):
- ON / OFF / TOGGLE per input
- ALL OFF helper action

Output routing (TX only):
- Multiview Out
- PGM Out
- USB Out
Destinations:
- SDI 1, SDI 2, HDMI 3, HDMI 4
- Program, Clean Program, Preview
- Color Bar, Multiview

## Logging

The module keeps logging minimal to avoid Companion log spam.
Errors are always logged.

If you enable any debug logging flags in the code, use them only for short troubleshooting sessions.

## License

MIT
