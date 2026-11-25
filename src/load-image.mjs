// A single failed image must not permanently strand the loading screen.
export async function loadImage(url, {
  ImageClass = globalThis.Image,
  base = globalThis.location?.href,
  wait = ms => new Promise(resolve => setTimeout(resolve, ms)),
  now = Date.now,
} = {}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    let source = url;
    if (attempt) {
      await wait(attempt * 400);
      const retry = new URL(url, base);
      retry.searchParams.set('_artRetry', `${now()}-${attempt}`);
      source = retry.href;
    }
    try {
      return await new Promise((resolve, reject) => {
        const image = new ImageClass();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(url));
        image.src = source;
      });
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
}
