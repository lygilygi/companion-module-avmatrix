Changelog

[1.1.0] – 2026-01-12

Added
	•	Full control of output routing:
	•	Multiview Out
	•	PGM Out
	•	USB Out
	•	Output destination selection via dropdown actions:
	•	SDI 1
	•	SDI 2
	•	HDMI 3
	•	HDMI 4
	•	PGM
	•	Clean PGM
	•	PVW
	•	Color Bar
	•	Multiview
	•	TX-only output control (no RX dependency, no feedback required)

Changed
	•	Complete internal refactor of module structure
	•	Rewritten instance, actions, feedbacks, and presets
	•	Simplified and cleaned logging (status and error only by default)
	•	Unified STILL logic to match real device behavior (input freeze, not image recall)
	•	Presets reorganized for clarity and consistency

Fixed
	•	STILL handling per input (toggle / off / all off)
	•	MUTE action and feedback
	•	PIP1, PIP2, LOGO actions and ON AIR feedbacks
	•	LUMA, CHROMA, DSK actions and feedbacks
	•	Missing presets for keyer and PIP controls
	•	Excessive RX logging and Companion log spam

Removed
	•	Legacy STILL 1–4 logic
	•	Unused RX logging and debug noise
	•	Deprecated assumptions about device RX behavior

⸻

[1.0.0]
	•	Initial release
