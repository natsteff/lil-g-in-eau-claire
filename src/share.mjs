const links = {
  game: { title: 'Lil G in Eau Claire', url: 'https://natsteff.github.io/lil-g-in-eau-claire/', label: 'Game' },
  soundtrack: { title: 'Lil G in Eau Claire soundtrack', url: 'https://suno.com/playlist/77421ceb-9ae2-40a0-9193-dfd75389b7e2', label: 'Soundtrack' },
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
