let bgSprite; // 儲存背景圖片 bg/bg1.png
let bgOffsetX = 0; // 儲存背景水平偏移量（0 為初始置中位置）
let characterSprite; // 儲存角色一的站立精靈圖
let walkSprite; // 儲存角色一的走路精靈圖
let magicSprite; // 儲存角色一的施法精靈圖
let magicEffectSprite; // 儲存角色一的魔法特效精靈圖
let characterX; // 儲存角色一目前的水平中心位置
let isWalking = false; // 記錄角色是否正在走路
let facingDirection = 1; // 記錄角色朝向（1 為右，-1 為左）
let isCasting = false; // 記錄角色是否正在播放施法動畫
let magicStartFrame = 0; // 記錄施法動畫開始時的 frameCount
let magicDirection = 1; // 記錄施法時鎖定的方向
let spaceIsDown = false; // 記錄空白鍵是否按住避免連發
let activeEffects = []; // 儲存目前飛行中的魔法特效

const frameCountInSprite = 10; // 站立精靈圖影格數
const frameWidth = 139.5; // 站立單格寬度（1395 / 10）
const frameHeight = 196; // 站立單格高度
const walkFrameCount = 9; // 走路精靈圖影格數
const walkFrameWidth = 1246 / walkFrameCount; // 走路單格寬度
const walkFrameHeight = 198; // 走路單格高度
const magicFrameCount = 4; // 施法精靈圖影格數
const magicFrameWidth = 1039 / magicFrameCount; // 施法單格寬度
const magicFrameHeight = 146; // 施法單格高度
const effectFrameCount = 5; // 特效精靈圖影格數
const effectFrameWidth = 740 / effectFrameCount; // 特效單格寬度
const effectFrameHeight = 19; // 特效單格高度
const framesPerStep = 8; // 每幾個畫面切換一格動畫

function preload() {
  bgSprite = loadImage("bg/bg1.png");
  characterSprite = loadImage("1/stop/stop.png");
  walkSprite = loadImage("1/walk/walk.png");
  magicSprite = loadImage("1/magic/magic.png");
  magicEffectSprite = loadImage("1/magic_effect/magic_effect.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  characterX = (width * 2) / 3;
  frameRate(60);
}

function draw() {
  background("#87CEEB");

  // 1. 計算背景與三張串接範圍
  const hasBg = bgSprite && bgSprite.width > 0 && bgSprite.height > 0;
  const bgScale = hasBg ? height / bgSprite.height : 1;
  const bgDrawWidth = hasBg ? bgSprite.width * bgScale : width;
  const bgDrawHeight = height;

  // 三張串接背景（i = -1, 0, 1）的水平範圍為 [bgOffsetX - bgDrawWidth, bgOffsetX + 2 * bgDrawWidth]
  // 背景往左移（bgOffsetX 變小）直到最右邊緣對齊畫布右緣：bgOffsetX + 2 * bgDrawWidth = width
  const minBgOffsetX = width - 2 * bgDrawWidth;
  // 背景往右移（bgOffsetX 變大）直到最左邊緣對齊畫布左緣：bgOffsetX - bgDrawWidth = 0
  const maxBgOffsetX = bgDrawWidth;

  bgOffsetX = constrain(bgOffsetX, minBgOffsetX, maxBgOffsetX);

  // 2. 計算角色 1 尺寸（高度為畫布 1/3，寬度依原圖比例）
  const targetCharacterHeight = height / 3;
  const characterScale = targetCharacterHeight / frameHeight;
  const characterWidth = frameWidth * characterScale;
  const characterHeight = targetCharacterHeight;

  // 3. 處理左右鍵移動：先捲動背景，抵達邊界後改由角色 1 移動
  const movingRight = keyIsDown(RIGHT_ARROW);
  const movingLeft = keyIsDown(LEFT_ARROW);
  const movementStep = constrain(width * 0.004, 2, 8);

  isWalking = false;

  if (movingRight && !movingLeft) {
    isWalking = true;
    facingDirection = 1;
    if (bgOffsetX > minBgOffsetX) {
      bgOffsetX = max(minBgOffsetX, bgOffsetX - movementStep);
    } else {
      characterX += movementStep;
    }
  } else if (movingLeft && !movingRight) {
    isWalking = true;
    facingDirection = -1;
    if (bgOffsetX < maxBgOffsetX) {
      bgOffsetX = min(maxBgOffsetX, bgOffsetX + movementStep);
    } else {
      characterX -= movementStep;
    }
  }

  characterX = constrain(characterX, characterWidth / 2, width - characterWidth / 2);

  // 4. 繪製三張串接背景（左：-1、中：0、右：+1）
  if (hasBg) {
    push();
    imageMode(CORNER);
    for (let i = -1; i <= 1; i++) {
      const drawX = bgOffsetX + i * bgDrawWidth;
      image(bgSprite, drawX, 0, bgDrawWidth, bgDrawHeight);
    }
    pop();
  }

  // 5. 施法與魔法特效
  if (isCasting && frameCount - magicStartFrame >= magicFrameCount * framesPerStep) {
    isCasting = false;
    activeEffects.push({
      x: characterX + (magicDirection * characterWidth) / 2,
      y: height - characterHeight * 0.58,
      direction: magicDirection
    });
  }

  const activeSprite = isCasting ? magicSprite : isWalking ? walkSprite : characterSprite;
  const activeFrameCount = isCasting ? magicFrameCount : isWalking ? walkFrameCount : frameCountInSprite;
  const activeFrameWidth = isCasting ? magicFrameWidth : isWalking ? walkFrameWidth : frameWidth;
  const activeFrameHeight = isCasting ? magicFrameHeight : isWalking ? walkFrameHeight : frameHeight;

  const frameIndex = isCasting
    ? min(activeFrameCount - 1, floor((frameCount - magicStartFrame) / framesPerStep))
    : floor(frameCount / framesPerStep) % activeFrameCount;
  const sourceX = frameIndex * activeFrameWidth;

  // 依目前影格原圖寬高比計算顯示高與寬
  const activeHeight = targetCharacterHeight * (activeFrameHeight / frameHeight);
  const activeWidth = activeHeight * (activeFrameWidth / activeFrameHeight);
  const characterY = height - activeHeight / 2;

  push();
  imageMode(CENTER);
  translate(characterX, characterY);
  scale(isCasting ? magicDirection : facingDirection, 1);
  image(activeSprite, 0, 0, activeWidth, activeHeight, sourceX, 0, activeFrameWidth, activeFrameHeight);
  pop();

  const effectScale = characterScale;
  const effectWidth = effectFrameWidth * effectScale;
  const effectHeight = effectFrameHeight * effectScale;
  const effectSpeed = max(6, width * 0.008);

  for (let i = activeEffects.length - 1; i >= 0; i--) {
    const effect = activeEffects[i];
    effect.x += effect.direction * effectSpeed;
    if (effect.x > width + effectWidth || effect.x < -effectWidth) {
      activeEffects.splice(i, 1);
      continue;
    }
    const effectFrameIndex = floor(frameCount / framesPerStep) % effectFrameCount;
    push();
    imageMode(CENTER);
    translate(effect.x, effect.y);
    scale(effect.direction, 1);
    image(
      magicEffectSprite,
      0,
      0,
      effectWidth,
      effectHeight,
      effectFrameIndex * effectFrameWidth,
      0,
      effectFrameWidth,
      effectFrameHeight
    );
    pop();
  }
}

function keyPressed() {
  if (keyCode === RIGHT_ARROW) {
    facingDirection = 1;
    return false;
  }
  if (keyCode === LEFT_ARROW) {
    facingDirection = -1;
    return false;
  }
  if (keyCode === 32) {
    if (!spaceIsDown && !isCasting) {
      isCasting = true;
      magicStartFrame = frameCount;
      magicDirection = facingDirection;
    }
    spaceIsDown = true;
    return false;
  }
}

function keyReleased() {
  if (keyCode === 32) {
    spaceIsDown = false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  characterX = constrain(characterX, 1, width - 1);
}