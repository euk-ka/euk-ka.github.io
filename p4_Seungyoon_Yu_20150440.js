let system;
let slider;

function setup() {
  createCanvas(windowWidth, windowHeight);
  system = new ParticleSystem(createVector(-50, 100));
  slider = createSlider(0,0.1,0.02,0);
  slider.position(10, 10);
  slider.style('width', '100px');
}

function draw() {
  background(40);
  system.addParticle();
  system.run();

}

let Particle = function(position) {
    let sv = slider.value();
  this.acceleration = createVector(0.02, sv);
  this.velocity = createVector(random(-2, 1), random(-1, 0));
  this.position = position.copy();
  this.lifespan = 255;
};

Particle.prototype.run = function() {
  this.update();
  this.display();
};


Particle.prototype.update = function(){
  this.velocity.add(this.acceleration);
  this.position.add(this.velocity);
};

//Particle Display
Particle.prototype.display = function() {
  colorMode(RGB, 255);
  strokeWeight(1);
  stroke(random(0,255),random(0,255),random(0,255));
  rect(this.position.x, this.position.y, 1, 10);

};


//system def.
let ParticleSystem = function(position) {
  this.origin = position.copy();
  this.particles = [];
};

ParticleSystem.prototype.addParticle = function() {
  this.particles.push(new Particle(this.origin));
};

ParticleSystem.prototype.run = function() {
  for (let i = this.particles.length-1; i >= 0; i--) {
    let p = this.particles[i];
    p.run();
  }
};
