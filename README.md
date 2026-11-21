# The Great Monkey Beer Run · Lil’ G in Eau Claire

![The Great Monkey Beer Run — Lil’ G in Eau Claire](assets/branding/main-logo.png)

<p align="center">
  <a href="https://natsteff.github.io/lil-g-in-eau-claire/"><img src="docs/play-now.svg" width="400" alt="Play Now! Lil G in EC version 0.1.34"></a>
</p>

**Play version 0.1.34** in your browser. Full screen is recommended on desktop. On a phone, add the game to your Home Screen and play in landscape. [Open the game](https://natsteff.github.io/lil-g-in-eau-claire/)

Pick up a towering stack of beer at the Unicorn Beer Distribution and carry it across Eau Claire to **3rd & Vine**. Dodge neighborhood traffic and swooping seagulls, ride on top of passing vehicles, and grab the spring near the start of the Event Center to unlock **Mega Jump**.

## Add the game to your Home Screen

1. Open the [game](https://natsteff.github.io/lil-g-in-eau-claire/) on your phone.
2. **iPhone:** In Safari, tap **Share → Add to Home Screen → Add**. **Android:** In Chrome, open the **⋮** menu and choose **Add to Home screen** or **Install app**, whichever appears.
3. Launch the **Lil G in EC** icon and turn your phone sideways.

## Controls

On mobile, tap **☰** to customize your controls. Choose arrows, Sliding Speed Runner, or Game Stick. Arrow spacing, larger arrows, and double-tap sprint settings are saved on your device.

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move | **A/D** or **←/→** | **◀ / ▶** |
| Jump | **Space**, **W**, or **↑** | **Jump** |
| Mega Jump after collecting the spring | Quickly press **Space** twice | Quickly tap **Jump** twice |
| Pick up beer, enter 3rd & Vine, or deliver | **F** | **Action** |
| Pause, restart, sound, or full screen | **P**, **R**, **S**, or **V** | Matching toolbar buttons |

## Batocera / Chromium fullscreen launch

Use `?fullscreen=1` to make the game fill the browser window immediately, including on desktop Linux. This expands the game layout without requiring the browser Fullscreen API. It does not change desktop touch-control defaults or controller settings. Normal links retain their existing layout.

To hide Chromium’s tabs and address bar as well, configure the Batocera launcher to start a dedicated Chromium window/process in kiosk mode:

```sh
chromium --kiosk "https://natsteff.github.io/lil-g-in-eau-claire/?fullscreen=1"
```

Use the Chromium executable/wrapper installed in that Batocera setup. The launch must include both the `--kiosk` flag and the URL. Adding the URL parameter alone cannot hide browser chrome. Ensure the browser has focus for controller input and retain a working Batocera exit shortcut. The game’s menu and V shortcut can still toggle its expanded layout; reloading the fullscreen URL starts expanded again.

## USB / NES-style D-pad setup

If a controller’s face buttons work but its D-pad does not, open **Game menu → Controller options → Configure D-pad** with the mouse. Release all controls, then press and release **Left, Right, Up, Down** as prompted. The game saves the mapping for that controller in that browser. Setup supports D-pad buttons, alternate axes, and hat-switch values. Live controller details show the USB name, mapping, pressed buttons, and axes for troubleshooting.

Nonstandard compact USB pads use their first two face buttons for Jump/Action (use Swap if needed), Select for the menu, and Start for pause/resume. Standard-mapped controllers retain their existing defaults. A physical-device playtest is still needed for each unusual controller/browser combination.
