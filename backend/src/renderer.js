// Server-side renderer: open the public invitation page in headless Chrome
// then capture either a high-DPI JPEG or a vector PDF. Garantit la parité
// 1:1 entre l'aperçu écran et l'export.
import puppeteer from 'puppeteer-core';
import fs from 'fs';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
].filter(Boolean);

function findChrome() {
  for (const p of CHROME_CANDIDATES) {
    try { if (fs.existsSync(p)) return p; } catch { /* ignore */ }
  }
  throw new Error(
    'Aucun navigateur Chrome/Edge trouvé. Définissez CHROME_PATH dans .env.'
  );
}

let _browser = null;
async function getBrowser() {
  if (_browser && _browser.connected) return _browser;
  _browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--font-render-hinting=none',
      '--disable-font-subpixel-positioning',
    ],
  });
  _browser.on('disconnected', () => { _browser = null; });
  return _browser;
}

export async function closeBrowser() {
  if (_browser) { try { await _browser.close(); } catch { /* ignore */ } _browser = null; }
}

/** Format physique (mm) — invitation 5x7" portrait standard */
const SIZES = {
  portrait:  { width: 127,  height: 178,  // 5x7 inches
               cssPx: { w: 480, h: 672 } },
  landscape: { width: 178,  height: 127,
               cssPx: { w: 672, h: 480 } },
  a5:        { width: 148,  height: 210,
               cssPx: { w: 559, h: 794 } },
};

/**
 * Charge la page publique en mode "print" et attend le rendu complet.
 *  - viewport haute densité (deviceScaleFactor=3) → JPEG haute résolution
 *  - les fonts Google sont attendues via document.fonts.ready
 */
async function openInvitationPage({ webUrl, code, format = 'portrait' }) {
  const size = SIZES[format] || SIZES.portrait;
  const browser = await getBrowser();
  const page = await browser.newPage();

  await page.setViewport({
    width: size.cssPx.w,
    height: size.cssPx.h,
    deviceScaleFactor: 3,
  });

  const url = `${webUrl}/i/${encodeURIComponent(code)}?print=1&format=${format}`;
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

  // attend la carte + les fonts + 200ms de marge pour SVG/QR
  await page.waitForSelector('.invitation-card', { timeout: 15000 });
  await page.evaluate(async () => {
    document.documentElement.classList.add('print-mode');
    document.body.classList.add('print-mode');
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    // attend les images
    const imgs = Array.from(document.images);
    await Promise.all(imgs.map((img) =>
      img.complete && img.naturalWidth ? Promise.resolve() :
      new Promise((r) => { img.onload = img.onerror = r; })
    ));
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
  await new Promise((r) => setTimeout(r, 350));

  return { page, size };
}

async function captureCard(page, type, opts = {}) {
  const rect = await page.evaluate(() => {
    const el = document.querySelector('.invitation-card');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  if (!rect) {
    return page.screenshot({ type, ...opts });
  }
  return page.screenshot({
    type,
    ...opts,
    clip: {
      x: Math.max(0, Math.floor(rect.x)),
      y: Math.max(0, Math.floor(rect.y)),
      width: Math.ceil(rect.width),
      height: Math.ceil(rect.height),
    },
  });
}

/** Capture JPEG haute qualité (jusqu'à ~3x DPI) du conteneur d'invitation */
export async function renderJpeg({ webUrl, code, format = 'portrait', quality = 95 }) {
  const { page } = await openInvitationPage({ webUrl, code, format });
  try {
    return await captureCard(page, 'jpeg', { quality });
  } finally {
    await page.close();
  }
}

/** Capture PNG sans perte (idéal pour impression) */
export async function renderPng({ webUrl, code, format = 'portrait' }) {
  const { page } = await openInvitationPage({ webUrl, code, format });
  try {
    return await captureCard(page, 'png');
  } finally {
    await page.close();
  }
}

/** Génère un PDF vectoriel au format papier 5x7" (ou paysage / A5) */
export async function renderPdf({ webUrl, code, format = 'portrait' }) {
  const size = SIZES[format] || SIZES.portrait;
  const { page } = await openInvitationPage({ webUrl, code, format });
  try {
    const buf = await page.pdf({
      width: `${size.width}mm`,
      height: `${size.height}mm`,
      printBackground: true,
      preferCSSPageSize: false,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    return buf;
  } finally {
    await page.close();
  }
}
