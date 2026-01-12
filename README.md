Companion module for controlling AVMatrix video switchers via UDP, based directly on the official AVMatrix API.


⸻

**Tested devices
**
The following devices have been tested and confirmed working:

AVMatrix HVS0402U
AVMatrix HVS0403U


⸻

Configuration

Device IP

Set the IP address of the AVMatrix switcher in the module configuration.

Ports:
	•	Local UDP port: defined by the module
	•	Device UDP port: according to AVMatrix documentation

When the connection is successful, the module status will change to:


Connected (x.x.x.x)
⸻

**Functionality**

Video Inputs
	•	PGM source selection
	•	PVW source selection
	•	CUT
	•	AUTO

STILL (input freeze)
	•	STILL ON / OFF / TOGGLE per input
	•	Works as input freeze, not image loading
	•	State depends on which input is currently active on PGM or PVW
	•	Feedback follows the active bus and frozen input

Keys / Layers
	•	LUMA
	•	CHROMA
	•	DSK
	•	PIP1
	•	PIP2
	•	LOGO

For each key:
	•	ON AIR
	•	KEY
	•	Combined modes, according to API

Audio
	•	MUTE ON / OFF 

Output Routing (TX only without feedback)

Output source control for:
	•	MV OUT
	•	PGM OUT
	•	USB OUT

Available sources:
	•	SDI 1
	•	SDI 2
	•	HDMI 3
	•	HDMI 4
	•	PGM
	•	CLEAN PGM
	•	PVW
	•	COLOR BAR
	•	MULTIVIEW

Routing is implemented as actions with dropdown selections.

⸻

**Presets**

The module includes ready-to-use presets:
	•	PGM / PVW input selection
	•	CUT / AUTO
	•	STILL PGM / STILL PVW
	•	ON AIR keys
	•	Audio MUTE

⸻

**Feedback**

Available feedbacks:
	•	PGM source
	•	PVW source
	•	STILL active state
	•	ON AIR state for keyers
	•	Audio MUTE state

Color conventions:
	•	PGM – red
	•	PVW – green
	•	STILL – follows active bus
	•	Keys – purple
	•	Audio – blue

⸻

**Logging**

By default:
	•	no RX/TX frame logging
	•	no debug spam
	•	only critical errors (UDP error, init error)

This behavior is intentional and compliant with Companion best practices.

Logging can be temporarily enabled for debugging but is not required for normal operation.

⸻

**Development Notes
**
The codebase is structured as follows:
	•	instance.ts – UDP communication and state handling
	•	actions.ts – Companion actions
	•	feedbacks.ts – feedback definitions
	•	presets.ts – preset definitions
	•	constants.ts – API mappings

Changes can be introduced incrementally without regression risk.

⸻

License

MIT
