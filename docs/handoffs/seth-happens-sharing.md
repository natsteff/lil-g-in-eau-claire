# Seth Happens — game and soundtrack sharing handoff

Implement the sharing feature used in Lil’ G in Eau Claire in the Seth Happens game. This handoff is for the receiving Codex chat; the Seth Happens game and soundtrack URLs must be supplied or confirmed there. No changes have been made to Seth Happens by creating this file.

## Required behavior

Add **Share ▾** to the game menu, with two choices:

- **Share game**: share the canonical public URL that opens the playable Seth Happens game directly.
- **Share soundtrack**: share the Seth Happens soundtrack/playlist URL.

Selecting a choice closes the dropdown and immediately opens the native OS share sheet through `navigator.share({ title, url })` when supported. The dropdown chooses the content; it must not replace native sharing with a custom list of social networks.

If native sharing is unavailable or fails, try `navigator.clipboard.writeText(url)`. Show “Game link copied!” or “Soundtrack link copied!” for four seconds. If the user cancels native sharing (`AbortError`), stop quietly without copying anything. On native-share resolution, show “Share request sent.”; this does not assert that a message was delivered.

If clipboard access also fails, reveal a read-only selectable input with the URL, focus/select it, and show “Copy this link to share:”. It must remain possible to select text even if the game globally disables selection.

Close the dropdown on selection, outside click, Escape, and when the game menu closes. Escape should close the dropdown and restore focus to Share without also closing the surrounding game menu. Prevent duplicate in-flight requests. Do not change gameplay, audio settings, or existing controls as part of this work.

## Links and project integration

1. Inspect the current Seth Happens checkout and its instructions before editing. Locate its menu, styling, input handling, and version/update mechanism.
2. Replace **both** `REPLACE_WITH_...` values in the example module below. Obtain the right links from that project/chat or the user. Do not reuse Lil’ G’s game URL or Suno playlist, and do not publish placeholders.
3. Use a stable canonical playable URL, not `location.href`, a preview/editor URL, or a URL with temporary cache-busting parameters.
4. Adapt `#settings` to Seth Happens’ actual game-menu element. The example assumes a native `<dialog>` that fires `close`; connect its equivalent close/reset event if it uses another menu system.
5. Initialize the module once, after the menu markup exists. If that game replaces menu DOM during rendering, use its component lifecycle and avoid duplicate listeners.
6. Match Seth Happens’ colors, spacing, and typography. Ensure the dropdown is not clipped by scrolling containers and is usable in phone landscape/fullscreen.
7. Invoke native sharing directly within the user’s selection handler. Do not insert a fetch, timer, or other awaited work before it; that can lose the user activation required by browsers. Use actual feature detection rather than assuming support from a mobile user agent.
8. Check that game-wide touch/pointer/keyboard handlers do not swallow the menu taps. Keep all sharing buttons `type="button"` so they do not submit/close a surrounding form accidentally.
9. Follow the destination project’s release workflow and refresh its entry-script/version cache mechanism if appropriate. Commit/push only within the authorization provided in the receiving chat.

## Suggested markup

Place this inside the game menu. Keep the status and fallback input outside the collapsible dropdown so the feedback remains visible after selection.

```html
<details id="share-menu">
  <summary>Share ▾</summary>
  <div id="share-choices">
    <button type="button" data-share="game">Share game</button>
    <button type="button" data-share="soundtrack">Share soundtrack</button>
  </div>
</details>
<p id="share-status" role="status" aria-live="polite"></p>
<input id="share-link" aria-label="Link to copy" readonly hidden>
```

## Reference implementation

Create/adapt `src/share.mjs`:

```javascript
const links = {
  game: { title: 'Seth Happens', url: 'REPLACE_WITH_SETH_HAPPENS_PLAYABLE_URL', label: 'Game' },
  soundtrack: { title: 'Seth Happens soundtrack', url: 'REPLACE_WITH_SETH_HAPPENS_SOUNDTRACK_URL', label: 'Soundtrack' },
};

export async function shareLink(data, platform = navigator) {
  if (typeof platform.share === 'function') {
    try {
      await platform.share({ title: data.title, url: data.url });
      return 'shared';
    } catch (error) {
      if (error.name === 'AbortError') return 'cancelled';
    }
  }
  try {
    await platform.clipboard.writeText(data.url);
    return 'copied';
  } catch {
    return 'manual';
  }
}

export function installShareMenu() {
  const menu = document.querySelector('#share-menu');
  const summary = menu.querySelector('summary');
  const status = document.querySelector('#share-status');
  const manual = document.querySelector('#share-link');
  let busy = false;
  let clearStatus;
  function close() { menu.open = false; }
  document.addEventListener('click', event => {
    if (!menu.contains(event.target)) close();
  });
  document.querySelector('#settings').addEventListener('close', close);
  menu.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !menu.open) return;
    event.preventDefault();
    event.stopPropagation();
    close();
    summary.focus();
  });
  for (const button of menu.querySelectorAll('[data-share]')) {
    button.addEventListener('click', async () => {
      if (busy) return;
      busy = true;
      clearTimeout(clearStatus);
      status.textContent = '';
      manual.hidden = true;
      close();
      const data = links[button.dataset.share];
      // Call native sharing directly from this click to preserve user activation.
      const result = await shareLink(data);
      busy = false;
      if (result === 'cancelled') return;
      status.textContent = result === 'copied' ? `${data.label} link copied!`
        : result === 'shared' ? 'Share request sent.' : 'Copy this link to share:';
      if (result === 'manual') {
        manual.value = data.url;
        manual.hidden = false;
        manual.focus();
        manual.select();
      } else {
        summary.focus();
        clearStatus = setTimeout(() => { status.textContent = ''; }, 4000);
      }
    });
  }
}
```

Initialize after the markup is available:

```javascript
import { installShareMenu } from './src/share.mjs';
installShareMenu();
```

## Reference styles — adapt to Seth Happens’ theme

These are the working Lil’ G styles, supplied as a starting point rather than a requirement to copy its colors. The destination game must also supply its usual button typography/background/borders if those are not global.

```css
#share-menu{position:relative;display:inline-block;margin:4px 0}
#share-menu summary{list-style:none;cursor:pointer;border:1px solid #7b9aae;border-radius:9px;padding:9px 14px;background:#203e57;touch-action:manipulation}
#share-menu summary::-webkit-details-marker{display:none}
#share-choices{position:absolute;top:100%;left:0;z-index:2;min-width:200px;padding:6px;background:#10263a;border:1px solid #96bdc9;border-radius:9px;box-shadow:0 6px 16px #0008}
#share-choices button{display:block;width:100%;text-align:left;touch-action:manipulation}
#share-choices button+button{margin-top:5px}
#share-status{margin:4px 0;color:#b8c9d9}
#share-status:empty{display:none}
#share-link{width:100%;padding:8px;-webkit-user-select:text;user-select:text}
```

## Verification before declaring complete

- Each option passes the correct title and URL to native sharing.
- A supported mobile browser opens its native share sheet from each selection. Distinguish a real-device check from a mocked API check in the report.
- Without `navigator.share`, each choice copies its own URL and shows the corresponding confirmation.
- Native cancellation neither copies a URL nor shows a failure message.
- A non-cancellation share failure falls back to clipboard; clipboard denial/unavailability reveals the selectable URL.
- Outside click, Escape/focus restoration, and closing/reopening the game menu work.
- Repeated taps do not launch duplicate share requests, and mobile taps do not trigger gameplay or form submission.
- Existing menu controls and gameplay remain functional; both placeholders have been replaced before release.

## Source provenance

This handoff reflects the implementation shipped in Lil’ G in Eau Claire (introduced in v0.1.16), checked against its current `src/share.mjs`, share markup/styles in `index.html`, and initialization in `game.js`. The full example above is self-contained so the receiving chat does not need access to the source checkout.
