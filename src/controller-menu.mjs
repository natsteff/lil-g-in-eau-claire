export function createControllerMenu(dialog) {
  let heldDirection = '', nextRepeat = 0;
  function controls() {
    return [...dialog.querySelectorAll('button, select, input, summary, a[href]')]
      .filter(element => !element.matches(':disabled') && !element.hidden && element.getClientRects().length);
  }
  function focus(element) {
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
    if (actions.back || actions.menu || actions.pause) {
      heldDirection = '';
      dialog.close();
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
    if (move && (direction === 'up' || direction === 'down')) {
      const index = available.indexOf(active);
      const step = direction === 'down' ? 1 : -1;
      focus(available[(index < 0 ? (step > 0 ? 0 : available.length - 1)
        : (index + step + available.length) % available.length)]);
    } else if (move && active?.tagName === 'SELECT') {
      const options = [...active.options].filter(option => !option.disabled);
      const index = options.indexOf(active.selectedOptions[0]);
      const next = options[Math.max(0, Math.min(options.length - 1, index + (direction === 'right' ? 1 : -1)))];
      if (next && !next.selected) {
        active.value = next.value;
        active.dispatchEvent(new Event('input', { bubbles: true }));
        active.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else if (move && active?.type === 'range') {
      direction === 'right' ? active.stepUp() : active.stepDown();
      active.dispatchEvent(new Event('input', { bubbles: true }));
      active.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (move && active?.tagName === 'SUMMARY') {
      active.parentElement.open = direction === 'right';
    }
    if (actions.confirm) {
      const target = dialog.ownerDocument.activeElement;
      if (!available.includes(target)) focusFirst();
      else if (target.tagName !== 'SELECT' && target.type !== 'range') target.click();
    }
  }
  return { handle, focusFirst };
}
