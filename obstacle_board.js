import { defs, tiny } from '/common.js';
import { Obstacle } from './obstacle.js';

const {
  vec3,
  vec4,
  vec,
  color,
  Mat4,
  Light,
  Shape,
  Material,
  Shader,
  Texture,
  Scene,
} = tiny;

export class Board {
  // start_z represents the z-coordinate of the board at spawn
  constructor(start_z, transfer) {
    // this contains the grid pattern for each possible layer of obstacles
    this.patterns = [
      [
        1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1,
        1,
      ],
      [
        1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0,
        1,
      ],
      [
        1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1,
        1,
      ],
      [
        0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0,
        0,
      ],
      [
        1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0,
        1,
      ],
      [
        1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0,
        0,
      ],
      [
        0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1,
        1,
      ],
      [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0,
      ],
      [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1,
      ],
    ];

    // holds the index of the current pattern
    this.pattern_index = Math.floor(Math.random() * this.patterns.length);

    // holds the z-value of the board
    this.z = start_z;

    // create 25 obstacles that will form the board
    this.obstacles = [];
    for (let i = 0; i < 25; i++)
      this.obstacles.push(
        new Obstacle(
          Mat4.identity().times(
            Mat4.translation(
              -8 + (i % 5) * 4,
              11 - Math.floor(i / 5) * 4,
              this.z
            )
          ), transfer
        )
      );
  }

  // move the board
  move(speed, dt) {
    for (let i = 0; i < 25; i++) this.obstacles[i].move(speed, dt);
    this.z += speed * dt; // increment this.z
    if (this.z >= 50) this.reset(); // if this.z is at 100, we can reset
  }

  // sets up the board values
  reset() {
    this.z -= 300;
    this.pattern_index = Math.floor(Math.random() * this.patterns.length); // creates new board pattern
    for (let i = 0; i < 25; i++)
      this.obstacles[i].transform = this.obstacles[i].transform.times(
        Mat4.translation(0, 0, -300)
      );
  }

  // checks if any obstacle on the board has collided with the ship
  // if so, returns that obstacle. Otherwise, returns null
  check_collision(ship) {
    // if this.z isn't between -1 and 1, it isn't worth checking
    if (Math.abs(this.z) > 1) return null;

    for (let i = 0; i < 25; i++) {
      if (
        this.patterns[this.pattern_index][i] == 1 &&
        !this.obstacles[i].is_fractured &&
        this.obstacles[i].has_collided(ship)
      )
        return this.obstacles[i];
    }

    return null;
  }

  // draw the entire board on the screen
  draw(context, program_state, speed, dt, shadow_pass) {
    this.move(speed, dt); // move the obstacles
    for (let i = 0; i < 25; i++) {
      if (this.patterns[this.pattern_index][i] == 1)
        this.obstacles[i].draw(context, program_state, shadow_pass);
    }
  }
}
