let spriteSheetStay;
let spriteSheetWalk;
let spriteSheetJump;
let spriteSheetHit;
let spriteSheetWeapon;
let currentFrame = 0;
let frameCount = 0;
const frameDelayStay = 5;  // stay 動畫每5幀更新一次
const frameDelayWalk = 5;  // walk 動畫每5幀更新一次
const frameDelayJump = 5;  // jump 動畫每5幀更新一次
const frameDelayHit = 5;   // hit 動畫每5幀更新一次
const frameDelayWeapon = 3;  // weapon 動畫每3幀更新一次
const scaleFactor = 2.5;  // 放大倍率

let state = 'stay';  // 'stay' 或 'walk' 或 'jump' 或 'hit'
let direction = 1;  // 1 for right, -1 for left
let characterX;  // 角色的 x 位置
let characterY;  // 角色的 y 位置
let characterBaseY;  // 角色的基準 y 位置（站立位置）
let moveSpeed = 3;  // 移動速度
let keysPressed = {};  // 追蹤目前按下的鍵
let jumpVelocity = 0;  // 跳躍速度（垂直）
const gravity = 0.5;  // 重力加速度
const jumpPower = 15;  // 跳躍初速度
let isJumping = false;  // 是否正在跳躍
let isAttacking = false;  // 是否正在攻擊
let weapons = [];  // 武器陣列
let weaponSpeed = 8;  // 武器移動速度

function preload() {
  spriteSheetStay = loadImage('Patrick/stay/stay.png');
  spriteSheetWalk = loadImage('Patrick/walk/walk.png');
  spriteSheetJump = loadImage('Patrick/jump/jump.png');
  spriteSheetHit = loadImage('Patrick/hit/hit.png');
  spriteSheetWeapon = loadImage('Patrick/hit/hit--.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  characterX = width / 2;
  characterBaseY = height / 2;
  characterY = characterBaseY;
}

function draw() {
  background('#bde0fe');

  // 更新和繪製武器
  for (let i = weapons.length - 1; i >= 0; i--) {
    let weapon = weapons[i];
    weapon.x += weapon.vx;
    weapon.frameCount++;
    if (weapon.frameCount >= frameDelayWeapon) {
      weapon.frameCount = 0;
      weapon.currentFrame++;
    }

    // 如果武器超出視窗或動畫完成，移除
    if (weapon.x > width || weapon.x < 0 || weapon.currentFrame >= 15) {
      weapons.splice(i, 1);
      continue;
    }

    // 繪製武器
    drawWeapon(weapon);
  }

  // 處理跳躍的物理
  if (isJumping) {
    jumpVelocity += gravity;
    characterY += jumpVelocity;
    
    // 檢查是否落地
    if (characterY >= characterBaseY) {
      characterY = characterBaseY;
      isJumping = false;
      jumpVelocity = 0;
      if (state === 'jump') {
        state = 'stay';
        currentFrame = 0;
        frameCount = 0;
      }
    }
  }

  // 根據按下的鍵來決定移動和狀態
  let isMoving = false;
  if (keysPressed['d'] || keysPressed['D']) {
    if (state !== 'hit' && !isAttacking) {
      characterX += moveSpeed;
      direction = 1;
      if (state === 'stay' || state === 'walk') {
        state = 'walk';
      }
      isMoving = true;
    }
  }
  if (keysPressed['a'] || keysPressed['A']) {
    if (state !== 'hit' && !isAttacking) {
      characterX -= moveSpeed;
      direction = -1;
      if (state === 'stay' || state === 'walk') {
        state = 'walk';
      }
      isMoving = true;
    }
  }

  // 處理跳躍
  if ((keysPressed['w'] || keysPressed['W']) && !isJumping && state !== 'jump' && state !== 'hit' && !isAttacking) {
    isJumping = true;
    jumpVelocity = -jumpPower;
    state = 'jump';
    currentFrame = 0;
    frameCount = 0;
  }

  // 如果沒有移動，回到靜止狀態（但跳躍中除外）
  if (!isMoving && state === 'walk' && !isJumping) {
    state = 'stay';
    currentFrame = 0;
    frameCount = 0;
  }

  // 限制角色在視窗範圍內
  characterX = constrain(characterX, 50, width - 50);

  // 根據狀態選擇精靈圖和幀數
  let spriteSheet, totalFrames, frameWidth, frameHeight, frameDelay;

  if (state === 'hit') {
    spriteSheet = spriteSheetHit;
    totalFrames = 5;
    frameWidth = 190 / 5;  // 38
    frameHeight = 48;
    frameDelay = frameDelayHit;
  } else if (state === 'jump') {
    spriteSheet = spriteSheetJump;
    totalFrames = 8;
    frameWidth = 347 / 8;  // 43.375
    frameHeight = 50;
    frameDelay = frameDelayJump;
  } else if (state === 'walk') {
    spriteSheet = spriteSheetWalk;
    totalFrames = 10;
    frameWidth = 395 / 10;  // 39.5
    frameHeight = 50;
    frameDelay = frameDelayWalk;
  } else {
    spriteSheet = spriteSheetStay;
    totalFrames = 5;
    frameWidth = 175 / 5;  // 35
    frameHeight = 49;
    frameDelay = frameDelayStay;
  }

  // 控制動畫撥放速度
  frameCount++;
  if (frameCount >= frameDelay) {
    frameCount = 0;
    currentFrame = (currentFrame + 1) % totalFrames;
    
    // 檢查攻擊動畫是否完成
    if (state === 'hit' && currentFrame === 0) {
      isAttacking = false;
      // 產生武器
      let weapon = {
        x: characterX,
        y: characterY,
        vx: direction * weaponSpeed,
        currentFrame: 0,
        frameCount: 0
      };
      weapons.push(weapon);
      state = 'stay';
    }
  }

  // 計算當前幀的來源 X 位置
  let srcX = currentFrame * frameWidth;

  // 放大後的目標尺寸
  let dw = frameWidth * scaleFactor;
  let dh = frameHeight * scaleFactor;

  // 繪製角色
  push();
  translate(characterX, characterY);
  if (direction === -1) {
    // 向左時翻轉
    scale(-1, 1);
  }
  translate(-dw / 2, -dh / 2);

  if (spriteSheet) {
    image(spriteSheet, 0, 0, dw, dh, srcX, 0, frameWidth, frameHeight);
  }
  pop();
}

function keyPressed() {
  keysPressed[key] = true;
  
  // 處理空白鍵攻擊
  if (key === ' ' && !isAttacking && state !== 'hit') {
    isAttacking = true;
    state = 'hit';
    currentFrame = 0;
    frameCount = 0;
    return false;
  }
  
  // 防止 W 鍵在瀏覽器中觸發默認行為
  if (key === 'w' || key === 'W') {
    return false;
  }
}

function keyReleased() {
  keysPressed[key] = false;
  return false;
}

function drawWeapon(weapon) {
  let frameWidth = 310 / 15;  // 20.67
  let frameHeight = 16;
  let srcX = weapon.currentFrame * frameWidth;
  
  let dw = frameWidth * scaleFactor;
  let dh = frameHeight * scaleFactor;
  
  push();
  translate(weapon.x, weapon.y);
  if (weapon.vx < 0) {
    // 向左時翻轉
    scale(-1, 1);
  }
  translate(-dw / 2, -dh / 2);
  
  if (spriteSheetWeapon) {
    image(spriteSheetWeapon, 0, 0, dw, dh, srcX, 0, frameWidth, frameHeight);
  }
  pop();
}



function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

