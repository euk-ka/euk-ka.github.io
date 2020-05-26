let img, font, gun;
let cam;
var x, y, z, theta;
var mx, my;
var delta, prev_mouseX;
var score, isHit, dispTime, isDisp, dispX, dispY;

let boxX = 100;
let boxY = 300;
let boxZ = 100;
var granite;
var floor;

let cam_x, cam_y, cam_z;
let cam_cx, cam_cy, cam_cz; //cam_cx -1 ~ 1
let cam_dx, cam_dy, cam_dz;
let pan, tilt;
let panM, tiltM;

var fireAngle;

let Targets = [];
class Target {
  constructor(tx, tz) {
    this.tx = tx;
    this.tz = tz;
    this.tr = random(0, HALF_PI);
    this.ts = 70;
  }
  render() {
    push();
    translate(this.tx+x, 30, this.tz+z);
    texture(img);
    rotateY(this.tr);
    plane(this.ts);
    pop();
  }
}

function preload() {
  img = loadImage('assets/target.png');
  myFont = loadFont('assets/font.TTF');
  gun = loadModel('assets/gun.obj');
  granite = loadImage('src/granite01.jpg');
  floor = loadImage('src/floor.jpg');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  perspective(HALF_PI+ HALF_PI/2, width / height, 10, 1000);
  colorMode(RGB);
  textFont(myFont);
  textSize(windowHeight/20);
  textAlign(CENTER, CENTER);
  score = 0;
  isHit = false;
  dispTime = 0;
  isDisp = false;
  dispX = 0;
  dispY = 0;
  x = -240;
  y = 50;
  z = -100;
  cam_x = 0;
  cam_y = 0;
  cam_z = 0;
  cam_dx = 0;
  cam_dy = -1;
  cam_dz = 0;
  pan = 0;
  tilt = 0;
  panM = 0;
  tiltM = 0;
  updateCamCenter();
  fireAngle = 0;
  for (let i = 0; i < 20; i++) {
    let tx = random(0, 1500);
    let tz = random(0, 1500);
    let t = new Target(tx, tz);
    Targets.push(t);
  }
}


function draw() {
  if (keyIsDown(87)) {
    x-=cos(panM)*3;
    z-=sin(panM)*3;
  }
  if (keyIsDown(83)) {
    x+=cos(panM)*3;
    z+=sin(panM)*3;
  }
  if (keyIsDown(65)) {
    x-=sin(panM)*3;
    z+=cos(panM)*3;
  }
  if (keyIsDown(68)) {
    x+=sin(panM)*3;
    z-=cos(panM)*3;
  }
  if (keyIsDown(81)) {
   y+=1;
   }
   if (keyIsDown(69)) {
   y-=1;
   }
   
  lights();
  directionalLight(1, 1, 1, 1, 1, 0);
  background(125);

  text('score '+score, 0, -windowHeight/4);
  if (isHit==true) {
    dispTime = millis();
    isHit = false;
    isDisp = true;
    dispX = random(-windowWidth/3, windowWidth/3);
    dispY = random(-windowHeight/8, -windowHeight/3);
  } 
  if (millis()-dispTime<1000&&isDisp == true) {
    fill(0, 255, 255);
    text('Hit', dispX, dispY);
  } else {
    isDisp = false;
  }
  camera(cam_x, cam_y, cam_z, cam_cx, cam_cy, cam_cz, 0, 0, -1);
  perspective(radians(60), width / height, 1, 10000);
  cursor(CROSS);

  updateCamCenter(); // cam update without keyboard
  normalMaterial();

  push();
  scale(0.1);
  translate(30*cos(panM), 30*sin(panM), -10); //xy coordinates
  rotateZ(panM); //rotate here
  if (fireAngle<0) { 
    fireAngle += 0.1;
  }
  rotateY(fireAngle);
  rotateX(HALF_PI); 
  model(gun);
  pop();

  push();
  fill(25);
  rotateX(-HALF_PI);
  mazeGrid();
  for (let t of Targets) {
      t.render();
    }
  pop();
}


function mousePressed() {
  fireAngle = -0.4;
  for(let t of Targets) {
    theta = atan((t.tz+z)/t.tx+x)-panM;
    if (sqrt(sq(t.tx+x)+sq(t.tz+z))*sin(abs(theta))<5) {
      score++;
      t.tx = random(0, 1500);
      t.tz = random(0, 1500);
    }
  }
}


function updateCamCenter() {
  panM = 10 * (mouseX) / windowWidth - 10;
  tiltM = 10 * (mouseY) / windowHeight - 10;
  cam_dx = cos(panM) * cos(tiltM);
  cam_dy = sin(panM) * cos(tiltM);
  cam_dz = -sin(tiltM);
  // compute scene center position
  cam_cx = cam_x + cam_dx;
  cam_cy = cam_y + cam_dy;
  cam_cz = cam_z + cam_dz;
}

function mazeGrid() {
  //translate: x, y, z, number of boxes, direction

  boxGenerator(x, y, z, 16, 1); //left wall
  boxGenerator(x, y, z, 16, 0); //top wall
  boxGenerator(x+boxX * 15, y, z, 16, 1); //right wall
  boxGenerator(x, y, z+boxZ * 15, 9, 0); // bottom wall 1
  boxGenerator(x+boxX * 10, y, z+boxZ * 15, 5, 0); // bottom wall 2

  //second row
  boxGenerator(x+boxX * 3, y, z+boxZ, 1, 0);
  boxGenerator(x+boxX * 10, y, z+boxZ, 1, 0);

  //third row
  boxGenerator(x+boxX * 2, y, z+boxZ * 2, 2, 0); 
  boxGenerator(x+boxX * 5, y, z+boxZ * 2, 2, 0); 
  boxGenerator(x+boxX * 9, y, z+boxZ * 2, 2, 0); 
  boxGenerator(x+boxX * 13, y, z+boxZ * 2, 1, 0); 

  //fourth row
  boxGenerator(x+boxX * 2, y, z+boxZ * 3, 1, 0); 
  boxGenerator(x+boxX * 5, y, z+boxZ * 3, 1, 0); 
  boxGenerator(x+boxX * 9, y, z+boxZ * 3, 1, 0); 
  boxGenerator(x+boxX * 13, y, z+boxZ * 3, 1, 0); 

  //fifth row
  boxGenerator(x+boxX * 4, y, z+boxZ * 4, 2, 0); 
  boxGenerator(x+boxX * 7, y, z+boxZ * 4, 3, 0); 
  boxGenerator(x+boxX * 12, y, z+boxZ * 4, 3, 0); 

  //sixth row
  boxGenerator(x+boxX * 1, y, z+boxZ * 5, 3, 0); 

  //seventh row
  boxGenerator(x+boxX * 5, y, z+boxZ * 6, 1, 0); 
  boxGenerator(x+boxX * 7, y, z+boxZ * 6, 7, 0); 

  //eighth row
  boxGenerator(x+boxX * 2, y, z+boxZ * 7, 4, 0); 
  boxGenerator(x+boxX * 8, y, z+boxZ * 7, 1, 0); 

  //nineth row
  boxGenerator(x+boxX * 5, y, z+boxZ * 8, 1, 0); 
  boxGenerator(x+boxX * 8, y, z+boxZ * 8, 1, 0); 
  boxGenerator(x+boxX * 11, y, z+boxZ * 8, 4, 0); 

  //tenth row
  boxGenerator(x+boxX * 2, y, z+boxZ * 9, 2, 0); 
  boxGenerator(x+boxX * 4, y, z+boxZ * 9, 5, 0); 

  //eleventh row
  boxGenerator(x+boxX * 2, y, z+boxZ * 10, 1, 0); 
  boxGenerator(x+boxX * 5, y, z+boxZ * 10, 1, 0); 
  boxGenerator(x+boxX * 9, y, z+boxZ * 10, 5, 0); 

  //twelveth row
  boxGenerator(x+boxX * 2, y, z+boxZ * 11, 1, 0); 
  boxGenerator(x+boxX * 4, y, z+boxZ * 11, 2, 0); 
  boxGenerator(x+boxX * 8, y, z+boxZ * 11, 2, 0); 
  boxGenerator(x+boxX * 13, y, z+boxZ * 11, 1, 0); 

  //thirteenth row
  boxGenerator(x+boxX * 2, y, z+boxZ * 12, 1, 0); 
  boxGenerator(x+boxX * 8, y, z+boxZ * 12, 1, 0); 
  boxGenerator(x+boxX * 11, y, z+boxZ * 12, 1, 0); 

  //fourteenth row
  boxGenerator(x+boxX * 2, y, z+boxZ * 13, 4, 0); 
  boxGenerator(x+boxX * 8, y, z+boxZ * 13, 1, 0); 
  boxGenerator(x+boxX * 10, y, z+boxZ * 13, 2, 0); 
  boxGenerator(x+boxX * 13, y, z+boxZ * 13, 1, 0); 

  //fifteenth row
  boxGenerator(x+boxX * 8, y, z+boxZ * 14, 1, 0); 
  boxGenerator(x+boxX * 10, y, z+boxZ * 14, 1, 0); 
  boxGenerator(x+boxX * 13, y, z+boxZ * 14, 1, 0); 

  //floor
  boxGeneratorFloor(x+boxX * -1, y+boxY, z+boxZ * (-1), 18, 0);
  boxGeneratorFloor(x+boxX * -1, y+boxY, z+boxZ * (0), 18, 0);
  boxGeneratorFloor(x+boxX * -1, y+boxY, z+boxZ * (1), 18, 0);
  boxGeneratorFloor(x+boxX * -1, y+boxY, z+boxZ * (2), 18, 0);
  boxGeneratorFloor(x+boxX * -1, y+boxY, z+boxZ * (3), 18, 0);
  boxGeneratorFloor(x+boxX * -1, y+boxY, z+boxZ * (4), 18, 0);
  boxGeneratorFloor(x+boxX * -1, y+boxY, z+boxZ * (5), 18, 0);
  boxGeneratorFloor(x+boxX * -1, y+boxY, z+boxZ * (6), 18, 0);
  boxGeneratorFloor(x+boxX * -1, y+boxY, z+boxZ * (7), 18, 0);
  boxGeneratorFloor(x+boxX * -1, y+boxY, z+boxZ * (8), 18, 0);
  boxGeneratorFloor(x+boxX * -1, y+boxY, z+boxZ * (9), 18, 0);
  boxGeneratorFloor(x+boxX * -1, y+boxY, z+boxZ * (10), 18, 0);
  boxGeneratorFloor(x+boxX * -1, y+boxY, z+boxZ * (11), 18, 0);
  boxGeneratorFloor(x+boxX * -1, y+boxY, z+boxZ * (12), 18, 0);
  boxGeneratorFloor(x+boxX * -1, y+boxY, z+boxZ * (13), 18, 0);
  boxGeneratorFloor(x+boxX * -1, y+boxY, z+boxZ * (14), 18, 0);
  boxGeneratorFloor(x+boxX * -1, y+boxY, z+boxZ * (15), 18, 0);
  boxGeneratorFloor(x+boxX * -1, y+boxY, z+boxZ * (16), 18, 0);
}

function boxGenerator(x, y, z, n, d) { //translate: x, y, z, number of boxes, direction
  for (i = 0; i < n; i++) {
    push();
    if (d == 0) { // create boxes in X direction
      translate(x + i * boxX, y, z);
    } else if (d == 1) { // create boxes in Z direction
      translate(x, y, z + i * boxZ);
    } 
    texture(granite);
    box(boxX, boxY, boxZ);
    pop();
  }
}

function boxGeneratorFloor(x, y, z, n, d) { //translate: x, y, z, number of boxes, direction
  for (i = 0; i < n; i++) {
    push();
    if (d == 0) { // create boxes in X direction
      translate(x + i * boxX, y, z);
    } else if (d == 1) { // create boxes in Z direction
      translate(x, y, z + i * boxZ);
    } 
    texture(floor);
    box(boxX, boxY, boxZ);
    pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight, WEBGL);
  prev_mouseX = windowWidth/2;
}
