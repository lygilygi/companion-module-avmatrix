# AV MATRIX Video Switcher

This module allows control of **AV MATRIX video switchers** using the native **UDP protocol**.

The module supports common live-production workflows including program/preview switching, stills, audio control, keyers, PIP and logo overlays.

---

## Supported devices

This module has been tested with the following AV MATRIX OEM devices:

- AV MATRIX 0402U  
- AV MATRIX 0403U  

Other AV MATRIX OEM models using the same UDP protocol may also work.

---

## Connection

The device is controlled via **UDP**.

### Default ports

- **Device UDP port:** `19523`
- **Local UDP port:** `19522`

Both ports are fixed and cannot be changed on the device.

---

## Configuration

In the module configuration, set:

- **Device IP address**  
  IP address of the AV MATRIX switcher on your network.

No authentication is required.

---

## Available actions

The module provides actions for:

- Program (PGM) and Preview (PVW) switching
- Cut / Auto / Fade To Black (FTB)
- Still image selection and on-air control
- Audio channel control (mute, volume, delay)
- Keyers (Luma / Chroma / DSK)
- Picture-in-Picture (PIP 1 / PIP 2)
- Logo overlay control

---

## Feedbacks

Available feedbacks include:

- Program / Preview source indicators
- Still on-air state
- Audio mute state
- Keyer on-air / key status
- PIP and logo on-air indicators

These feedbacks can be used to update button colors and states dynamically.

---

## Notes

- The device sends regular UDP status updates which are used to keep Companion in sync.
- Optional keepalive ping packets are sent automatically.
- No TCP connection is required.

---

## Disclaimer

This module is **not officially affiliated with AV MATRIX**.  
AV MATRIX is a trademark of its respective owners.

---

## Author

Module developed and maintained by **Pawel Lygan**.
