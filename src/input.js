import { CONFIG } from './config.js';
import { upgradeButtons } from './render.js';

export function toVirtual(clientX, clientY, rect, virtualW, virtualH) {
  const x = ((clientX - rect.left) / rect.width) * virtualW;
  const y = ((clientY - rect.top) / rect.height) * virtualH;
  return { x, y };
}

export function hitButton(pos, buttons) {
  for (const b of buttons) {
    if (pos.x >= b.x && pos.x <= b.x + b.w && pos.y >= b.y && pos.y <= b.y + b.h) {
      return b.kind;
    }
  }
  return null;
}

export function attachInput(canvas, handlers) {
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const pos = toVirtual(e.clientX, e.clientY, rect, CONFIG.virtualW, CONFIG.virtualH);
    const kind = hitButton(pos, upgradeButtons());
    if (kind) handlers.onUpgrade(kind);
    else handlers.onTap(pos);
  });
}
