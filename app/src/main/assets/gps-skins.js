(function (global) {
  'use strict';
  const THEMES = [
    ['fighter', '전투기 콕핏'],
    ['cybertruck', '사이버트럭'],
    ['digital', '숫자 중심 계기판'],
    ['retro', '레트로 하이파이'],
    ['space', '우주선 콘솔']
  ];
  const clamp = (value, max) => Math.max(0, Math.min(max, Number.isFinite(value) ? value : 0));
  const angle = value => Math.PI * (.75 + clamp(value, 200) / 200 * 1.5);

  function mount({panel, hud, store}) {
    const toolbar = document.createElement('div');
    toolbar.className = 'gps-theme-control';
    const label = document.createElement('label');
    label.htmlFor = 'gTheme';
    label.textContent = '속도계 디자인';
    const select = document.createElement('select');
    select.id = 'gTheme';
    select.className = 'sel';
    THEMES.forEach(([key, name]) => select.add(new Option(name, key)));
    toolbar.append(label, select);
    panel.querySelector('.body').prepend(toolbar);
    let theme, colors;

    function refresh() {
      const style = getComputedStyle(panel);
      const read = (name, fallback) => style.getPropertyValue('--gps-' + name).trim() || fallback;
      colors = {
        accent: read('accent', '#e69a60'), fg: read('fg', '#f3eee6'),
        dim: read('dim', '#9a8878'), off: read('off', '#ffffff16'),
        face: read('face', '#0b0d10'), glow: read('glow', '#e69a6044')
      };
      // HUD lives outside the speedometer panel, so carry only its local palette.
      if (hud) {
        hud.style.setProperty('--lcd-text', colors.accent);
        hud.style.setProperty('--lcd-fg', colors.fg);
        hud.style.setProperty('--lcd-text-2', colors.fg);
        hud.style.setProperty('--lcd-glow', colors.glow);
      }
    }

    function setTheme(key) {
      theme = THEMES.some(([id]) => id === key) ? key : 'cybertruck';
      panel.dataset.gpsTheme = theme;
      select.value = theme;
      store.set('gpsTheme', theme);
      refresh();
    }
    select.addEventListener('change', () => setTheme(select.value));
    setTheme(store.get('gpsTheme', 'cybertruck'));

    function line(g, x1, y1, x2, y2) {
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    }

    function drawGauge({canvas, context: g, speed, limit, over, pixelRatio: d}) {
      if (!g || !canvas.width || !canvas.height) return;
      const w = canvas.width, h = canvas.height;
      const r = Math.min(w * .455, h * .48), x = w / 2, y = h * .52;
      const value = clamp(speed, 200), hot = over ? '#ff5145' : colors.accent;
      panel.querySelector('.dial').style.setProperty('--g', r * 2 / d + 'px');
      g.save();
      g.clearRect(0, 0, w, h);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      if (theme === 'digital') {
        const left = w * .08, width = w * .84, top = h * .78;
        const count = 40, step = width / count;
        for (let i = 0; i < count; i++) {
          g.fillStyle = (i + .5) / count * 200 <= value ? hot : colors.off;
          g.fillRect(left + i * step, top, step * .8, Math.max(8 * d, h * .045));
        }
        g.fillStyle = colors.dim; g.strokeStyle = colors.dim;
        g.lineWidth = d; g.font = `600 ${Math.max(11 * d, h * .045)}px monospace`;
        for (let n = 0; n <= 200; n += 40) {
          const tx = left + n / 200 * width;
          line(g, tx, top + h * .065, tx, top + h * .085);
          g.fillText(n, tx, top + h * .125);
        }
        if (limit > 0) {
          const tx = left + clamp(limit, 200) / 200 * width;
          g.fillStyle = '#ff5145';
          g.beginPath(); g.moveTo(tx - 5 * d, top - 8 * d); g.lineTo(tx + 5 * d, top - 8 * d); g.lineTo(tx, top - d); g.fill();
        }
        g.restore(); return;
      }

      if (theme === 'retro') {
        g.fillStyle = '#f4e8ce'; g.strokeStyle = '#8c603b'; g.lineWidth = r * .045;
        g.beginPath(); g.arc(x, y, r * .98, 0, Math.PI * 2); g.fill(); g.stroke();
      }
      if (theme === 'fighter') {
        g.strokeStyle = colors.off; g.lineWidth = d;
        for (let n = -3; n <= 3; n++) {
          line(g, x - r, y + n * r / 4, x + r, y + n * r / 4);
          line(g, x + n * r / 4, y - r, x + n * r / 4, y + r);
        }
      }
      if (theme === 'space') {
        for (const size of [.45, .57, .96]) {
          g.strokeStyle = colors.off; g.lineWidth = d;
          g.beginPath(); g.arc(x, y, r * size, 0, Math.PI * 2); g.stroke();
        }
      }
      if (theme === 'cybertruck') {
        g.strokeStyle = '#9ea3aa'; g.lineWidth = 2 * d;
        g.beginPath();
        for (let i = 0; i <= 8; i++) {
          const a = angle(i / 8 * 200), px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
          if (i) g.lineTo(px, py); else g.moveTo(px, py);
        }
        g.stroke();
      }

      const segments = theme === 'space' ? 80 : 50;
      const span = Math.PI * 1.5 / segments;
      g.lineWidth = r * (theme === 'space' ? .025 : .065);
      if (theme !== 'retro') {
        for (let i = 0; i < segments; i++) {
          g.strokeStyle = (i + .5) / segments * 200 <= value ? hot : colors.off;
          g.beginPath(); g.arc(x, y, r * .88, angle(i / segments * 200) + span * .12, angle((i + 1) / segments * 200) - span * .12); g.stroke();
        }
      }
      g.strokeStyle = theme === 'retro' ? '#4c392b' : colors.fg;
      g.fillStyle = g.strokeStyle;
      g.font = `600 ${Math.max(11 * d, r * .09)}px Rajdhani,monospace`;
      for (let n = 0; n <= 200; n += 10) {
        const a = angle(n), major = n % 20 === 0;
        g.globalAlpha = major ? 1 : .45;
        g.lineWidth = (major ? 2 : 1) * d;
        line(g, x + Math.cos(a) * r * (major ? .71 : .75), y + Math.sin(a) * r * (major ? .71 : .75), x + Math.cos(a) * r * .81, y + Math.sin(a) * r * .81);
        if (major) g.fillText(n, x + Math.cos(a) * r * .61, y + Math.sin(a) * r * .61);
      }
      g.globalAlpha = 1;
      if (limit > 0) {
        const a = angle(limit); g.strokeStyle = '#ff5145'; g.lineWidth = 3 * d;
        line(g, x + Math.cos(a) * r * .82, y + Math.sin(a) * r * .82, x + Math.cos(a) * r * .97, y + Math.sin(a) * r * .97);
      }
      const a = angle(value);
      g.strokeStyle = hot; g.fillStyle = hot;
      g.lineWidth = (theme === 'retro' ? 3 : 4) * d;
      const inner = theme === 'retro' ? 0 : .4;
      line(g, x + Math.cos(a) * r * inner, y + Math.sin(a) * r * inner, x + Math.cos(a) * r * .83, y + Math.sin(a) * r * .83);
      if (theme === 'retro') {
        g.fillStyle = '#5a3b26'; g.beginPath(); g.arc(x, y, r * .055, 0, Math.PI * 2); g.fill();
      }
      g.restore();
    }

    function drawCompass({canvas, context: g, heading, pixelRatio: d}) {
      if (!g || !canvas.width || !canvas.height) return;
      const w = canvas.width, h = canvas.height, labels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      g.save(); g.clearRect(0, 0, w, h); g.textAlign = 'center'; g.textBaseline = 'bottom';
      for (let degree = Math.floor((heading - 75) / 5) * 5; degree <= heading + 75; degree += 5) {
        const tx = w / 2 + (degree - heading) * w / 140, n = ((degree % 360) + 360) % 360;
        const major = n % 45 === 0, mid = n % 15 === 0;
        g.strokeStyle = colors.fg; g.globalAlpha = major ? 1 : mid ? .5 : .2; g.lineWidth = d;
        line(g, tx, 0, tx, h * (major ? .3 : .15));
        if (major || mid) {
          g.fillStyle = colors.fg; g.font = `${major ? 700 : 500} ${h * (major ? .4 : .27)}px Rajdhani,monospace`;
          g.fillText(major ? labels[n / 45] : n, tx, h - 3 * d);
        }
      }
      g.globalAlpha = 1; g.fillStyle = colors.accent;
      g.beginPath(); g.moveTo(w / 2 - 7 * d, 0); g.lineTo(w / 2 + 7 * d, 0); g.lineTo(w / 2, 10 * d); g.fill();
      g.restore();
    }
    return {setTheme, refresh, drawGauge, drawCompass};
  }
  global.GpsSkins = {mount, themes: THEMES};
})(window);
