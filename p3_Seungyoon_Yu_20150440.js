let building_sl, rotate_sl, rotate2_sl;
let CITY_SIZE = 800;
let BUILDING_MAX_SIZE = 40;
let gridSz = CITY_SIZE / BUILDING_MAX_SIZE; let map = [];

function resetMap() {
for (let i = 0; i < gridSz; i++)
for (let j = 0; j < gridSz; j++) {
map[i][j] = false; }
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL); colorMode(RGB, 1);
// init map
  for (let i = 0; i < gridSz; i++) { map[i] = [];
  for (let j = 0; j < gridSz; j++) {
    map[i][j] = false; }
  } resetMap();
  building_sl = createSlider(10, 300, 10); building_sl.position(10, 30);
  rotate_sl = createSlider(0, 90, 45);
  rotate_sl.position(10, 50); 
  rotate2_sl = createSlider(-180,180,0); rotate2_sl.position(10,70);}

function draw() { background(0); randomSeed(0);
  lights();
  directionalLight(0.7,0.5,0.3,0.5,0.25,0);
  directionalLight(0,0.5,0.3,1,0,0);
  directionalLight(0,0,1,0,0,0.1);
  rotateX(radians(rotate_sl.value())); 
  rotateZ(radians(rotate2_sl.value()));
  plane(1000, 1000); fill(0.4); // draw ground fill(0.4);
  noStroke();
 
let nBuildings = building_sl.value(); translate(-CITY_SIZE / 2, -CITY_SIZE / 2);
  for (let i = 0; i < nBuildings; i++) { let foundEmptySpot = false;
  let x = 0, y = 0;
// loop until it finds an empty spot
while (foundEmptySpot == false) { x = floor(random(0, gridSz)); y = floor(random(0, gridSz)); if (map[x][y] == false) {
foundEmptySpot = true;
map[x][y] = true; }
}
// randomly determine building dimensions
let w = random(10, BUILDING_MAX_SIZE);
let h = random(10, BUILDING_MAX_SIZE);
let d = random(10, 100); // building height
// render a building
push();
translate(x * BUILDING_MAX_SIZE, y * BUILDING_MAX_SIZE, d / 2); box(w, h, d);
pop();
}
resetMap(); }
