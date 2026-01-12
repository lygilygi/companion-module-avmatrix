# Changelog

## v1.1.0

### Added
- Output routing control (TX only):
  - Multiview Out
  - PGM Out
  - USB Out
- Output routing destinations:
  - SDI 1
  - SDI 2
  - HDMI 3
  - HDMI 4
  - Program
  - Clean Program
  - Preview
  - Color Bar
  - Multiview

### Changed
- Complete internal refactor to current Companion module structure
- Unified STILL handling based on input freeze state
- RX logging reduced to prevent Companion log spam
- Presets cleaned up and aligned with actual device behavior

### Fixed
- Audio MUTE control and feedback
- STILL handling per input
- Chroma / Luma / DSK controls
- PIP1 / PIP2 / Logo controls
- ON AIR states and feedbacks for all keyers

### Tested on
- AVMatrix 0402U
- AVMatrix 0403U
