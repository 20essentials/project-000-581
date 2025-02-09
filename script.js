const $ = el => document.querySelector(el);
const $$ = el => document.querySelectorAll(el);

/****************************GLOBAL VARIABLES */
const $canvas = $('canvas');
const $ctx = $canvas.getContext('2d');
const $input = $('input[type=color]');
const $corX = $('.cor-x');
const $corY = $('.cor-y');
const $lupa = $('.magnificentGlass');
const $container = $('.container');
const $containerRight = $('.right');

/****************************MODES */
const MODES = {
  DASHED: 'dashed', //1
  SELECT: 'select', //2
  ERASE: 'erase', //3
  COLORIZE: 'colorize', //4
  EYE_DROPPER: 'eye-dropper', //5
  LUPA: 'lupa', //6
  DRAW_SOLID: 'draw-solid', //7
  BROCHA: 'brocha', //8
  SPRITE: 'sprite', //9
  LETTERS: 'letters', //10
  SIMPLE_LINES: 'simple-lines', //11
  CURVA: 'curva', //11
  RECTANGLE: 'rectangle', //13
  FREESTYLE: 'free-style', //14
  ELLIPSE: 'ellipse', //15
  RECTANGLE_RADIUS: 'rectangle-radius' //16
};

/****************************GLOBAL STATE */
let startX, startY;
let lastX, lastY;
let previousMode = null;
let isDrawing = false;
let mode = MODES.DRAW_SOLID;
let imageData = null;
let imageData2 = 0;
let isShiftPressed = false;
let freeStyleOnlyFirstTime = false;
let lastCoordFreeStyle = {
  x: 0,
  y: 0
};

//Curve
let start = null;
let end = null;
let control = null;
let drawingStep = 0;

//Spray
let sprayRadius = 20;
let sprayDensity = 50; // Quantity of point

//lupa
const zoomFactor = 1.4;
const lupaSize = 80;

//Textarea
let textaAreaImageData = null;
let oneTextareCreated = false;
let textareaOption = {
  x: 0,
  y: 0,
  width: 0,
  height: 0
};

/****************************EVENTS */
$canvas.addEventListener('mousedown', startDrawing);
$canvas.addEventListener('mousemove', draw);
$canvas.addEventListener('mouseleave', stopDrawing);
$canvas.addEventListener('mouseup', stopDrawing);
$canvas.addEventListener('mouseup', addTextarea);

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
      const { offsetX, offsetY } = e;
      fillBucket(offsetX, offsetY, $ctx.fillStyle);
    }
  }

  if (e.target.matches('.option-button')) {
    $$('.active').forEach(el => el.classList.remove('active'));
    e.target.classList.add('active');

    if (!e.target.matches('.lupa')) {
      $lupa.classList.remove('open');
    }

    //Button 1
    if (e.target.matches('.dashed')) {
      initialCompositeOperation();
      mode = MODES.DASHED;
      return;
    }

    //Button 2
    if (e.target.matches('.select')) {
      initialCompositeOperation();
      mode = MODES.SELECT;
      return;
    }

    //Button 3
    if (e.target.matches('.erase')) {
      $ctx.globalCompositeOperation = 'destination-out';
      mode = MODES.ERASE;
      return;
    }

    //Button 4
    if (e.target.matches('.colorize')) {
      initialCompositeOperation();
      mode = MODES.COLORIZE;
      return;
    }

    //Button 5
    if (e.target.matches('.eye-dropper')) {
      initialCompositeOperation();
      mode = MODES.EYE_DROPPER;
      openEyeDropper();
      return;
    }

    //Button 6
    if (e.target.matches('.lupa')) {
      initialCompositeOperation();
      $lupa.classList.add('open');
      mode = MODES.LUPA;
      return;
    }

    //Button 7
    if (e.target.matches('.draw-solid')) {
      initialCompositeOperation();
      mode = MODES.DRAW_SOLID;
      return;
    }

    //Button 8
    if (e.target.matches('.brocha')) {
      initialCompositeOperation();
      mode = MODES.BROCHA;
      return;
    }

    //Button 9
    if (e.target.matches('.sprite')) {
      initialCompositeOperation();
      mode = MODES.SPRITE;
      return;
    }

    //Button 10
    if (e.target.matches('.letters')) {
      initialCompositeOperation();
      mode = MODES.LETTERS;
      return;
    }

    //Button 11
    if (e.target.matches('.simple-lines')) {
      initialCompositeOperation();
      mode = MODES.SIMPLE_LINES;
      return;
    }

    //Button 12
    if (e.target.matches('.curva')) {
      initialCompositeOperation();
      mode = MODES.CURVA;
      return;
    }

    //Button 13
    if (e.target.matches('.rectangle')) {
      initialCompositeOperation();
      mode = MODES.RECTANGLE;
      return;
    }

    //Button 14
    if (e.target.matches('.free-style')) {
      initialCompositeOperation();
      mode = MODES.FREESTYLE;
      return;
    }

    //Button 15
    if (e.target.matches('.ellipse')) {
      initialCompositeOperation();
      mode = MODES.ELLIPSE;
      return;
    }

    //Button 16
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

/****************************FUNCTIONS */

function initialCompositeOperation() {
  $ctx.globalCompositeOperation = 'source-over';
}

function startDrawing(e) {
  isDrawing = true;
  const { offsetX, offsetY } = e;
  imageData = $ctx.getImageData(0, 0, $canvas.width, $canvas.height);

  if (mode === MODES.CURVA) {
    if (drawingStep === 0) {
      drawingStep++;
    } else if (drawingStep === 1) {
      drawingStep++;
    } else if (drawingStep === 2) {
      drawingStep = 1;
    }
  }

  [startX, startY] = [offsetX, offsetY];
  [lastX, lastY] = [offsetX, offsetY];
}

function draw(e) {
  const { offsetX, offsetY } = e;
  $corX.innerHTML = offsetX;
  $corY.innerHTML = offsetY;
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

    $ctx.lineWidth = 1;
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
    $ctx.lineWidth = 1;
    let width = offsetX - startX;
    let height = offsetY - startY;

    if (isShiftPressed) {
      let size = Math.min(Math.abs(width), Math.abs(height));
      width = width > 0 ? size : -size;
      height = height > 0 ? size : -size;
    }

    $ctx.beginPath();
    if (mode === MODES.SELECT) {
      $ctx.setLineDash([3, 6]);
    } else {
      $ctx.setLineDash([]);
    }

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
    $ctx.lineWidth = 1;
    [lastX, lastY] = [offsetX, offsetY];
    $corX.innerHTML = lastX;
    $corY.innerHTML = lastY;
    if (freeStyleOnlyFirstTime) return;
    $ctx.putImageData(imageData, 0, 0);
    $ctx.beginPath();
    $ctx.moveTo(startX, startY);
    $ctx.lineTo(lastX, lastY);
    lastCoordFreeStyle.x = lastX;
    lastCoordFreeStyle.y = lastY;
    $ctx.stroke();
    setTimeout(() => (freeStyleOnlyFirstTime = true), 300);
  }

  if (mode === MODES.SIMPLE_LINES) {
    $ctx.lineWidth = 1;
    $ctx.setLineDash([]);
    $ctx.putImageData(imageData, 0, 0);
    $ctx.beginPath();
    $ctx.moveTo(startX, startY);
    $ctx.lineTo(lastX, lastY);
    $ctx.stroke();
  }

  if (mode === MODES.CURVA) {
    $ctx.putImageData(imageData, 0, 0);
    const { offsetX, offsetY } = e;

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
    $textarea.onblur = function (e) {
      $textarea.classList.add('solidify');
      setTimeout(() => {
        oneTextareCreated = false;
        textareaOption = {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        };
      }, 500);
    };
  }
}

function stopDrawing() {
  isDrawing = false;
}

function drawCurve() {
  $ctx.lineWidth = 1;
  $ctx.beginPath();
  $ctx.moveTo(start.x, start.y);
  $ctx.quadraticCurveTo(control.x, control.y, end.x, end.y);
  $ctx.stroke();
  $ctx.closePath();
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

function getLimitedPosition(x, y) {
  const radius = lupaSize / 2;
  return {
    x: Math.min(Math.max(x - radius, 10), $canvas.width - lupaSize + 10),
    y: Math.min(Math.max(y - radius, 10), $canvas.height - lupaSize + 10)
  };
}

$containerRight.addEventListener('mousemove', e => {
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

$containerRight.addEventListener('mouseleave', () => {
  $lupa.style.display = 'none';
});

// Initial Content
$ctx.fillStyle = '#e9e9e9';
$ctx.fillRect(0, 0, $canvas.width, $canvas.height);
$ctx.fillStyle = '#000';
$ctx.font = '20px Arial';
$ctx.fillText('Draw...', 10, 50);

//Bucket Effect
function fillBucket(x, y, fillColor) {
  const imageData = $ctx.getImageData(0, 0, $canvas.width, $canvas.height);
  const pixels = imageData.data;
  const width = $canvas.width;
  const height = $canvas.height;

  const fillRGB = hexToRgb(fillColor);
  const startIdx = getPixelIndex(x, y, width);
  const startColor = getColorAt(startIdx, pixels);

  // Si el color inicial es igual al color de relleno, no hacer nada
  if (colorsMatch(startColor, fillRGB)) return;

  // Procedemos con el relleno, fila por fila, para evitar problemas de repintado
  const toProcess = [];

  // Añadimos el píxel inicial
  toProcess.push({ x, y });

  const processed = new Set(); // Este conjunto llevará un registro de los píxeles ya procesados

  while (toProcess.length > 0) {
    const { x, y } = toProcess.pop();
    let idx = getPixelIndex(x, y, width);

    // Si el color actual es igual al color de inicio, procedemos a pintarlo
    if (colorsMatch(getColorAt(idx, pixels), startColor)) {
      fillPixel(idx, pixels, fillRGB);

      // Marcar el píxel como procesado
      processed.add(`${x},${y}`);

      // Ahora procesamos los píxeles adyacentes: izquierda, derecha, arriba, abajo
      // Izquierda
      if (
        x > 0 &&
        colorsMatch(getColorAt(idx - 4, pixels), startColor) &&
        !processed.has(`${x - 1},${y}`)
      ) {
        toProcess.push({ x: x - 1, y });
      }

      // Derecha
      if (
        x < width - 1 &&
        colorsMatch(getColorAt(idx + 4, pixels), startColor) &&
        !processed.has(`${x + 1},${y}`)
      ) {
        toProcess.push({ x: x + 1, y });
      }

      // Arriba
      if (
        y > 0 &&
        colorsMatch(getColorAt(idx - width * 4, pixels), startColor) &&
        !processed.has(`${x},${y - 1}`)
      ) {
        toProcess.push({ x, y: y - 1 });
      }

      // Abajo
      if (
        y < height - 1 &&
        colorsMatch(getColorAt(idx + width * 4, pixels), startColor) &&
        !processed.has(`${x},${y + 1}`)
      ) {
        toProcess.push({ x, y: y + 1 });
      }
    }
  }

  $ctx.putImageData(imageData, 0, 0);
}

// Funciones auxiliares
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
  pixels[idx + 3] = 255; // Alpha opaco
}

function colorsMatch(color1, color2) {
  return (
    color1.r === color2.r &&
    color1.g === color2.g &&
    color1.b === color2.b &&
    color1.a === color2.a
  );
}

function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}
