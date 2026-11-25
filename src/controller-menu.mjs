export function createControllerMenu(dialog) {
  let heldDirection = '', nextRepeat = 0;
  const shareMenu = () => dialog.querySelector('#share-menu');
  function controls() {
    return [...dialog.querySelectorAll('button, select, input, summary, a[href]')]
      .filter(element => {
        if (element.matches(':disabled') || element.hidden || !element.getClientRects().length) return false;
        const closed = element.closest('details:not([open])');
        return !closed || closed.querySelector('summary') === element;
      });
  }
  function focus(element) {
    const share = shareMenu();
    if (share?.open && element && !share.contains(element)) share.open = false;
    element?.focus();
    element?.scrollIntoView({ block: 'nearest' });
  }
  function focusFirst(preferred) {
    heldDirection = '';
    dialog.classList.add('controller-navigation');
    const available = controls();
    focus(available.includes(preferred) ? preferred : available[0]);
  }
  function handle(actions, now = performance.now()) {
    dialog.classList.add('controller-navigation');
    if (actions.menu || actions.pause) {
      heldDirection = '';
      dialog.close();
      return;
    }
    if (actions.back) {
      heldDirection = '';
      const activeDetails = dialog.ownerDocument.activeElement?.closest('details[open]');
      const details = activeDetails ?? (shareMenu()?.open ? shareMenu() : null);
      if (details) {
        details.open = false;
        focus(details.querySelector('summary'));
      } else dialog.close();
      return;
    }
    const direction = actions.down ? 'down' : actions.up ? 'up' : actions.right ? 'right' : actions.left ? 'left' : '';
    let move = false;
    if (direction !== heldDirection) {
      heldDirection = direction;
      nextRepeat = now + 400;
      move = Boolean(direction);
    } else if (direction && now >= nextRepeat) {
      nextRepeat = now + 140;
      move = true;
    }
    const available = controls();
    const active = dialog.ownerDocument.activeElement;
    const horizontal = direction === 'left' || direction === 'right';
    if (move && horizontal && active?.tagName === 'SELECT') {
      const options = [...active.options].filter(option => !option.disabled);
      const index = options.indexOf(active.selectedOptions[0]);
      const next = options[Math.max(0, Math.min(options.length - 1, index + (direction === 'right' ? 1 : -1)))];
      if (next && !next.selected) {
        active.value = next.value;
        active.dispatchEvent(new Event('input', { bubbles: true }));
        active.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else if (move && horizontal && active?.type === 'range') {
      direction === 'right' ? active.stepUp() : active.stepDown();
      active.dispatchEvent(new Event('input', { bubbles: true }));
      active.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (move) {
      const index = available.indexOf(active);
      const step = direction === 'down' || direction === 'right' ? 1 : -1;
      focus(available[(index < 0 ? (step > 0 ? 0 : available.length - 1)
        : (index + step + available.length) % available.length)]);
    }
    if (actions.confirm) {
      const target = dialog.ownerDocument.activeElement;
      if (!controls().includes(target)) focusFirst();
      else if (target.tagName !== 'SELECT' && target.type !== 'range') {
        target.click();
        if (target.tagName === 'SUMMARY' && target.parentElement.open) {
          const firstChild = controls().find(element => element !== target && target.parentElement.contains(element));
          if (firstChild) focus(firstChild);
        }
      }
    }
  }
  return { handle, focusFirst };
}
