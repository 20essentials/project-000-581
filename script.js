const $ = el => document.querySelector(el);
const $$ = el => document.querySelectorAll(el);

const $canvas = $('canvas');
const $ctx = $canvas.getContext('2d');
const $input = $('input[type=color]');
const $corX = $('.cor-x');
const $corY = $('.cor-y');
const $lupa = $('.magnificentGlass');
const $container = $('.container');
const $containerRight = $('.right');

const MODES = {
  DASHED: 'dashed',
  SELECT: 'select',
  ERASE: 'erase',
  COLORIZE: 'colorize',
  EYE_DROPPER: 'eye-dropper',
  LUPA: 'lupa',
  DRAW_SOLID: 'draw-solid',
  BROCHA: 'brocha',
  SPRITE: 'sprite',
  LETTERS: 'letters',
  SIMPLE_LINES: 'simple-lines',
  CURVA: 'curva',
  RECTANGLE: 'rectangle',
  FREESTYLE: 'free-style',
  ELLIPSE: 'ellipse',
  RECTANGLE_RADIUS: 'rectangle-radius'
};

let startX, startY;
let lastX, lastY;
let previousMode = null;
let isDrawing = false;
let mode = MODES.DRAW_SOLID;
let imageData = null;
let imageData2 = 0;
let isShiftPressed = false;
let freeStyleOnlyFirstTime = false;
let lastCoordFreeStyle = { x: 0, y: 0 };

let start = null;
let end = null;
let control = null;
let drawingStep = 0;

let sprayRadius = 20;
let sprayDensity = 50;

const zoomFactor = 1.4;
const lupaSize = 80;

let textaAreaImageData = null;
let oneTextareCreated = false;
let textareaOption = { x: 0, y: 0, width: 0, height: 0 };

$canvas.addEventListener('pointerdown', startDrawing);
$canvas.addEventListener('pointermove', draw);
$canvas.addEventListener('pointerleave', stopDrawing);
$canvas.addEventListener('pointerup', stopDrawing);
$canvas.addEventListener('pointerup', addTextarea);

$input.addEventListener('change', ({ target }) => {
  const { value } = target;
  $ctx.strokeStyle = value;
  $ctx.fillStyle = value;
});

document.addEventListener('keydown', ({ key }) => {
  isShiftPressed = key === 'Shift';
});

document.addEventListener('keyup', ({ key }) => {
  if (key === 'Shift') isShiftPressed = false;
});

document.addEventListener('click', e => {
  previousMode = mode;

  if (e.target.matches('canvas')) {
    const { offsetX, offsetY } = e;

    if (mode === MODES.FREESTYLE) {
      if (!freeStyleOnlyFirstTime) return;

      $ctx.lineWidth = 1;
      $ctx.beginPath();
      $ctx.moveTo(offsetX, offsetY);
      $ctx.lineTo(lastCoordFreeStyle.x, lastCoordFreeStyle.y);
      $ctx.stroke();
      $ctx.closePath();
      lastCoordFreeStyle.x = offsetX;
      lastCoordFreeStyle.y = offsetY;
      return;
    }

    if (mode === MODES.COLORIZE) {
      fillBucket(offsetX, offsetY, $ctx.fillStyle);
    }
  }

  if (e.target.matches('.option-button')) {
    $$('.active').forEach(el => el.classList.remove('active'));
    e.target.classList.add('active');

    if (!e.target.matches('.lupa')) {
      $lupa.classList.remove('open');
    }

    if (e.target.matches('.dashed')) {
      initialCompositeOperation();
      mode = MODES.DASHED;
      return;
    }

    if (e.target.matches('.select')) {
      initialCompositeOperation();
      mode = MODES.SELECT;
      return;
    }

    if (e.target.matches('.erase')) {
      $ctx.globalCompositeOperation = 'destination-out';
      mode = MODES.ERASE;
      return;
    }

    if (e.target.matches('.colorize')) {
      initialCompositeOperation();
      mode = MODES.COLORIZE;
      return;
    }

    if (e.target.matches('.eye-dropper')) {
      initialCompositeOperation();
      mode = MODES.EYE_DROPPER;
      openEyeDropper();
      return;
    }

    if (e.target.matches('.lupa')) {
      initialCompositeOperation();
      $lupa.classList.add('open');
      mode = MODES.LUPA;
      return;
    }

    if (e.target.matches('.draw-solid')) {
      initialCompositeOperation();
      mode = MODES.DRAW_SOLID;
      return;
    }

    if (e.target.matches('.brocha')) {
      initialCompositeOperation();
      mode = MODES.BROCHA;
      return;
    }

    if (e.target.matches('.sprite')) {
      initialCompositeOperation();
      mode = MODES.SPRITE;
      return;
    }

    if (e.target.matches('.letters')) {
      initialCompositeOperation();
      mode = MODES.LETTERS;
      return;
    }

    if (e.target.matches('.simple-lines')) {
      initialCompositeOperation();
      mode = MODES.SIMPLE_LINES;
      return;
    }

    if (e.target.matches('.curva')) {
      initialCompositeOperation();
      mode = MODES.CURVA;
      return;
    }

    if (e.target.matches('.rectangle')) {
      initialCompositeOperation();
      mode = MODES.RECTANGLE;
      return;
    }

    if (e.target.matches('.free-style')) {
      initialCompositeOperation();
      mode = MODES.FREESTYLE;
      return;
    }

    if (e.target.matches('.ellipse')) {
      initialCompositeOperation();
      mode = MODES.ELLIPSE;
      return;
    }

    if (e.target.matches('.rectangle-radius')) {
      initialCompositeOperation();
      mode = MODES.RECTANGLE_RADIUS;
      return;
    }
  }

  if (e.target.matches('.download-canvas')) {
    const anchor = e.target;
    anchor.href = $canvas.toDataURL();
    anchor.download = 'image.png';
  }
});

function initialCompositeOperation() {
  $ctx.globalCompositeOperation = 'source-over';
}

function startDrawing(e) {
  isDrawing = true;
  $canvas.setPointerCapture(e.pointerId);

  const { offsetX, offsetY } = e;
  imageData = $ctx.getImageData(0, 0, $canvas.width, $canvas.height);

  if (mode === MODES.CURVA) {
    if (drawingStep === 0) drawingStep++;
    else if (drawingStep === 1) drawingStep++;
    else if (drawingStep === 2) drawingStep = 1;
  }

  [startX, startY] = [offsetX, offsetY];
  [lastX, lastY] = [offsetX, offsetY];
}

function stopDrawing(e) {
  isDrawing = false;
  try {
    $canvas.releasePointerCapture(e.pointerId);
  } catch {}
}

function draw(e) {
  const { offsetX, offsetY } = e;
  $corX.innerHTML = ~~offsetX;
  $corY.innerHTML = ~~offsetY;
  if (!isDrawing) return;

  if (
    mode === MODES.DRAW_SOLID ||
    mode === MODES.DASHED ||
    mode === MODES.BROCHA ||
    mode === MODES.ERASE
  ) {
    $ctx.beginPath();
    if (mode === MODES.DASHED) {
      $ctx.setLineDash([5, 15]);
      $ctx.lineWidth = 1;
    } else if (mode === MODES.BROCHA) {
      $ctx.setLineDash([]);
      $ctx.lineWidth = 5;
    } else if (mode === MODES.ERASE) {
      $ctx.setLineDash([]);
      $ctx.lineWidth = 15;
    } else {
      $ctx.setLineDash([]);
      $ctx.lineWidth = 1;
    }
    $ctx.moveTo(lastX, lastY);
    $ctx.lineTo(offsetX, offsetY);
    $ctx.stroke();
  }

  if (mode === MODES.LETTERS) {
    if (oneTextareCreated) return;
    $ctx.putImageData(imageData, 0, 0);
    textaAreaImageData = $ctx.getImageData(0, 0, $canvas.width, $canvas.height);

    let width = offsetX - startX;
    let height = offsetY - startY;

    if (isShiftPressed) {
      let size = Math.min(Math.abs(width), Math.abs(height));
      width = width > 0 ? size : -size;
      height = height > 0 ? size : -size;
    }

    $ctx.beginPath();
    $ctx.setLineDash([3, 5]);
    $ctx.rect(startX, startY, width, height);
    $ctx.stroke();
    textareaOption = { width, height, x: startX, y: startY };
  }

  if (
    mode === MODES.RECTANGLE ||
    mode === MODES.SELECT ||
    mode === MODES.ELLIPSE ||
    mode === MODES.RECTANGLE_RADIUS
  ) {
    $ctx.putImageData(imageData, 0, 0);

    let width = offsetX - startX;
    let height = offsetY - startY;

    if (isShiftPressed) {
      let size = Math.min(Math.abs(width), Math.abs(height));
      width = width > 0 ? size : -size;
      height = height > 0 ? size : -size;
    }

    $ctx.beginPath();
    if (mode === MODES.SELECT) $ctx.setLineDash([3, 6]);
    else $ctx.setLineDash([]);

    if (mode === MODES.ELLIPSE) {
      $ctx.ellipse(startX, startY, width, height, 0, 0, Math.PI * 2);
    } else if (mode === MODES.RECTANGLE_RADIUS) {
      $ctx.roundRect(startX, startY, width, height, [10]);
    } else {
      $ctx.rect(startX, startY, width, height);
    }
    $ctx.stroke();
  }

  if (mode === MODES.FREESTYLE) {
    [lastX, lastY] = [offsetX, offsetY];
    if (freeStyleOnlyFirstTime) return;
    $ctx.putImageData(imageData, 0, 0);
    $ctx.beginPath();
    $ctx.moveTo(startX, startY);
    $ctx.lineTo(lastX, lastY);
    lastCoordFreeStyle = { x: lastX, y: lastY };
    $ctx.stroke();
    setTimeout(() => (freeStyleOnlyFirstTime = true), 300);
  }

  if (mode === MODES.SIMPLE_LINES) {
    $ctx.putImageData(imageData, 0, 0);
    $ctx.beginPath();
    $ctx.moveTo(startX, startY);
    $ctx.lineTo(lastX, lastY);
    $ctx.stroke();
  }

  if (mode === MODES.CURVA) {
    $ctx.putImageData(imageData, 0, 0);

    if (drawingStep < 2) {
      start = { x: startX, y: startY };
      end = { x: lastX, y: lastY };
      control = { x: (startX + lastX) / 2, y: (startY + lastY) / 2 };
      imageData2 = $ctx.getImageData(0, 0, $canvas.width, $canvas.height);
      drawCurve();
    } else {
      $ctx.putImageData(imageData, 0, 0);
      $ctx.putImageData(imageData2, 0, 0);
      control = { x: offsetX, y: offsetY };
      drawCurve();
    }
  }

  if (mode === MODES.SPRITE) {
    drawSpray(offsetX, offsetY);
  }

  [lastX, lastY] = [offsetX, offsetY];
}

function addTextarea() {
  if (mode === MODES.LETTERS && !oneTextareCreated) {
    oneTextareCreated = true;
    $ctx.putImageData(textaAreaImageData, 0, 0);
    const $textarea = document.createElement('textarea');
    $textarea.classList.add('am-textarea');
    $textarea.spellcheck = false;
    $textarea.style.width = `${
      textareaOption.width > 50 ? textareaOption.width + 10 : 150
    }px`;
    $textarea.style.height = `${
      textareaOption.height > 50 ? textareaOption.height + 10 : 100
    }px`;
    $textarea.style.left = `${textareaOption.x}px`;
    $textarea.style.top = `${textareaOption.y}px`;
    $containerRight.appendChild($textarea);
    $textarea.onblur = () => {
      $textarea.classList.add('solidify');
      setTimeout(() => {
        oneTextareCreated = false;
        textareaOption = { x: 0, y: 0, width: 0, height: 0 };
      }, 500);
    };
  }
}

function drawCurve() {
  $ctx.beginPath();
  $ctx.moveTo(start.x, start.y);
  $ctx.quadraticCurveTo(control.x, control.y, end.x, end.y);
  $ctx.stroke();
}

function drawSpray(x, y) {
  for (let i = 0; i < sprayDensity; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.random() * sprayRadius;
    const sprayX = x + Math.cos(angle) * radius;
    const sprayY = y + Math.sin(angle) * radius;
    $ctx.fillRect(sprayX, sprayY, 1, 1);
  }
}

function getLimitedPosition(x, y) {
  const radius = lupaSize / 2;
  return {
    x: Math.min(Math.max(x - radius, 10), $canvas.width - lupaSize + 10),
    y: Math.min(Math.max(y - radius, 10), $canvas.height - lupaSize + 10)
  };
}

$containerRight.addEventListener('pointermove', e => {
  if (mode !== MODES.LUPA) return;
  const rect = $canvas.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;
  const { x, y } = getLimitedPosition(offsetX, offsetY);
  $lupa.style.display = 'block';
  $lupa.style.left = `${x}px`;
  $lupa.style.top = `${y}px`;
  $lupa.style.backgroundImage = `url(${$canvas.toDataURL()})`;
  $lupa.style.backgroundSize = `${$canvas.width * zoomFactor}px ${
    $canvas.height * zoomFactor
  }px`;
  const backgroundX = (x / $canvas.width) * 100;
  const backgroundY = (y / $canvas.height) * 100;
  $lupa.style.backgroundPosition = `${backgroundX}% ${backgroundY}%`;
});

$containerRight.addEventListener('pointerleave', () => {
  $lupa.style.display = 'none';
});

$ctx.fillStyle = '#e9e9e9';
$ctx.fillRect(0, 0, $canvas.width, $canvas.height);
$ctx.fillStyle = '#000';
$ctx.font = '20px Arial';
$ctx.fillText('Draw...', 10, 50);

function fillBucket(x, y, fillColor) {
  const imageData = $ctx.getImageData(0, 0, $canvas.width, $canvas.height);
  const pixels = imageData.data;
  const width = $canvas.width;
  const height = $canvas.height;

  const fillRGB = hexToRgb(fillColor);
  const startIdx = getPixelIndex(x, y, width);
  const startColor = getColorAt(startIdx, pixels);

  if (colorsMatch(startColor, fillRGB)) return;

  const toProcess = [{ x, y }];
  const processed = new Set();

  while (toProcess.length > 0) {
    const { x, y } = toProcess.pop();
    let idx = getPixelIndex(x, y, width);

    if (colorsMatch(getColorAt(idx, pixels), startColor)) {
      fillPixel(idx, pixels, fillRGB);
      processed.add(`${x},${y}`);

      if (x > 0 && !processed.has(`${x - 1},${y}`))
        toProcess.push({ x: x - 1, y });

      if (x < width - 1 && !processed.has(`${x + 1},${y}`))
        toProcess.push({ x: x + 1, y });

      if (y > 0 && !processed.has(`${x},${y - 1}`))
        toProcess.push({ x, y: y - 1 });

      if (y < height - 1 && !processed.has(`${x},${y + 1}`))
        toProcess.push({ x, y: y + 1 });
    }
  }

  $ctx.putImageData(imageData, 0, 0);
}

function getPixelIndex(x, y, width) {
  return (y * width + x) * 4;
}

function getColorAt(idx, pixels) {
  return {
    r: pixels[idx],
    g: pixels[idx + 1],
    b: pixels[idx + 2],
    a: pixels[idx + 3]
  };
}

function fillPixel(idx, pixels, color) {
  pixels[idx] = color.r;
  pixels[idx + 1] = color.g;
  pixels[idx + 2] = color.b;
  pixels[idx + 3] = 255;
}

function colorsMatch(c1, c2) {
  return c1.r === c2.r && c1.g === c2.g && c1.b === c2.b && c1.a === c2.a;
}

function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

async function openEyeDropper() {
  const picker = new EyeDropper();
  try {
    const result = await picker.open();
    const { sRGBHex } = result;
    $ctx.strokeStyle = sRGBHex;
    $input.value = sRGBHex;
    $ctx.strokeStyle = sRGBHex;
    $ctx.fillStyle = sRGBHex;
  } catch (e) {
    $input.value = '#000000';
    $ctx.strokeStyle = '#000000';
    $ctx.fillStyle = '#000000';
  } finally {
    let clase = `.${previousMode}`;
    $(clase).click();
  }
}
