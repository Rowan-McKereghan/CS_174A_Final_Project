import { defs, tiny } from './common.js';

const {
  Vector,
  Vector3,
  vec,
  vec3,
  vec4,
  color,
  hex_color,
  Shader,
  Matrix,
  Mat4,
  Light,
  Shape,
  Material,
  Scene,
} = tiny;

export class SpaceshipGame extends Scene {
  constructor() {
    super();

    this.shapes = {
      cube: new defs.Cube(),
      cube_outline: new defs.Cube_Outline(),
      testCube: new defs.Cube(),
      ship: new defs.Square_Pyramid_Outline(),
    };

    this.materials = {
      basic: new Material(new defs.Basic_Shader()),
      color: new Material(new defs.Phong_Shader(), {
        color: hex_color('#000000'),
      }),
    };

    this.initial_camera_location = Mat4.look_at(
      vec3(0, 3, 50),
      vec3(0, 0, 0),
      vec3(0, 1, 0)
    );

    this.obstacle_patterns = [
      [
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 0, 0, 0, 0],
        [1, 1, 1, 1, 1],
      ],
      [
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
      ],
      [
        [1, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [1, 1, 1, 1, 1],
      ],
      [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 1, 0, 1, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0],
      ],
      [
        [1, 0, 0, 0, 1],
        [0, 1, 0, 1, 0],
        [0, 0, 1, 0, 0],
        [0, 1, 0, 1, 0],
        [1, 0, 0, 0, 1],
      ],
      [
        [1, 1, 0, 0, 0],
        [1, 1, 0, 0, 0],
        [1, 1, 0, 0, 0],
        [1, 1, 0, 0, 0],
        [1, 1, 0, 0, 0],
      ],
      [
        [0, 0, 0, 1, 1],
        [0, 0, 0, 1, 1],
        [0, 0, 0, 1, 1],
        [0, 0, 0, 1, 1],
        [0, 0, 0, 1, 1],
      ],
      [
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
      ],
    ];

    this.game_over = false;
    this.speed = 80;
    this.spawn_point = 400;
    this.obstacle_spacing = 100;
    this.obstacles = [];
    for (let i = 0; i < 100; ++i) {
      this.obstacles.push({ transform: null, pattern: null });
      this.obstacles[i].transform = Mat4.identity().times(
        Mat4.translation(
          0,
          0,
          -1 * (this.spawn_point + this.obstacle_spacing * i)
        )
      );
      this.obstacles[i].pattern =
        this.obstacle_patterns[
          Math.floor(Math.random() * this.obstacle_patterns.length)
        ];
    }

    this.w_pressed = false;
    this.s_pressed = false;
    this.a_pressed = false;
    this.d_pressed = false;
    this.ship_speed = 30;
    this.ship_turn_speed = 3;
    this.ship_translation = Mat4.identity();
    this.ship_rotation = Mat4.identity();
    this.ship_collision_velocity = {};
  }

  make_control_panel() {
    // move up
    this.key_triggered_button(
      'Up',
      ['w'],
      () => {
        // if (!this.game_over) {
        //   this.ship_translation = this.ship_translation.times(
        //     Mat4.translation(0, 0.5, 0)
        //   );
        //   this.ship_rotation = this.ship_rotation.map((x, i) =>
        //     Vector.from(Mat4.rotation(-Math.PI / 4, 1, 0, 0)[i]).mix(x, 0.5)
        //   );
        // }
        this.w_pressed = true;
      },
      '#6E6460',
      () => {
        // if (!this.game_over) {
        //   this.ship_rotation = Mat4.identity();
        // }
        this.w_pressed = false;
      }
    );

    // move down
    this.key_triggered_button(
      'Down',
      ['s'],
      () => {
        // if (!this.game_over) {
        //   this.ship_translation = this.ship_translation.times(
        //     Mat4.translation(0, -0.5, 0)
        //   );
        //   this.ship_rotation = Mat4.rotation(Math.PI / 4, 1, 0, 0);
        // }
        this.s_pressed = true;
      },
      '#6E6460',
      () => {
        // if (!this.game_over) {
        //   this.ship_rotation = Mat4.identity();
        // }
        this.s_pressed = false;
      }
    );

    // move left
    this.key_triggered_button(
      'Left',
      ['a'],
      () => {
        // if (!this.game_over) {
        //   this.ship_translation = this.ship_translation.times(
        //     Mat4.translation(-0.5, 0, 0)
        //   );
        //   this.ship_rotation = Mat4.rotation(-Math.PI / 4, 0, 1, 0);
        // }
        this.a_pressed = true;
      },
      '#6E6460',
      () => {
        // if (!this.game_over) {
        //   this.ship_rotation = Mat4.identity();
        // }
        this.a_pressed = false;
      }
    );

    // move right
    this.key_triggered_button(
      'Right',
      ['d'],
      () => {
        // if (!this.game_over) {
        //   this.ship_translation = this.ship_translation.times(
        //     Mat4.translation(0.5, 0, 0)
        //   );
        //   this.ship_rotation = Mat4.rotation(Math.PI / 4, 0, 1, 0);
        // }
        this.d_pressed = true;
      },
      '#6E6460',
      () => {
        // if (!this.game_over) {
        //   this.ship_rotation = Mat4.identity();
        // }
        this.d_pressed = false;
      }
    );
  }

  check_collision(cube_transform) {
    let shipX = this.ship_translation[0][3];
    let shipY = this.ship_translation[1][3];
    let cubeX = cube_transform[0][3];
    let cubeY = cube_transform[1][3];
    if (
      shipX + 1 >= cubeX - 1 &&
      shipX - 1 <= cubeX + 1 &&
      shipY + 1 >= cubeY - 1 &&
      shipY - 1 <= cubeY + 1
    ) {
      this.game_over = true;
      console.log(this.speed);
      this.speed *= 0.1;
      console.log('collision detected');
      this.ship_collision_velocity = {
        translation: {
          x: (shipX - cubeX) * (this.speed / 40),
          y: (shipY - cubeY) * (this.speed / 40),
          z: this.speed / 80,
        },
        rotation: {
          angle: Math.PI * (this.speed / 500),
          is_x: shipY > cubeY ? 1 : -1,
          is_y: shipX < cubeX ? 1 : -1,
          is_z: shipY > cubeY ? 1 : -1,
        },
      };
    }
  }

  draw_cube(context, program_state, idx, row, column) {
    let cube_transform = this.obstacles[idx].transform.times(
      Mat4.translation(-8 + column * 4, 11 - row * 4, 50)
    );
    if (
      cube_transform[2][3] >= -1 &&
      cube_transform[2][3] <= 1 &&
      !this.game_over
    ) {
      this.check_collision(cube_transform);
    }

    this.shapes.cube.draw(
      context,
      program_state,
      cube_transform,
      this.materials.color.override({ color: hex_color('#222222') })
    );
    // this.shapes.cube_outline.draw(
    //   context,
    //   program_state,
    //   cube_transform,
    //   this.materials.basic,
    //   'LINES'
    // );
  }

  draw_cube_set(context, program_state, idx, dt) {
    if (this.obstacles[idx].transform[2][3] >= -35 && !this.game_over) {
      this.obstacles[idx].transform = this.obstacles[idx].transform.times(
        Mat4.translation(0, 0, -1 * this.spawn_point)
      );
      this.obstacles[idx].pattern =
        this.obstacle_patterns[
          Math.floor(Math.random() * this.obstacle_patterns.length)
        ];
    }
    this.obstacles[idx].transform = this.obstacles[idx].transform.times(
      Mat4.translation(0, 0, this.speed * dt)
    );
    for (let i = 0; i < 5; ++i) {
      for (let j = 0; j < 5; ++j) {
        if (this.obstacles[idx].pattern[i][j] === 1)
          this.draw_cube(context, program_state, idx, i, j);
      }
    }
  }

  display(context, program_state) {
    let camera_inverse = Mat4.inverse(
      // this.ship_rotation.times(
      this.ship_translation.times(Mat4.inverse(program_state.camera_inverse))
      // )
    );
    program_state.set_camera(
      this.initial_camera_location.map((x, i) =>
        Vector.from(camera_inverse[i]).mix(x, 0.7)
      )
    );
    program_state.projection_transform = Mat4.perspective(
      Math.PI / 4,
      context.width / context.height,
      0.1,
      1000
    );

    const t = program_state.animation_time / 1000,
      dt = program_state.animation_delta_time / 1000;

    const light_position = vec4(0, 0, 15, 1);

    program_state.lights = [
      new Light(light_position, color(1.0, 1.0, 0.7, 0.8), 100 ** 2),
    ];

    for (let i = 0; i < 5; ++i) {
      this.draw_cube_set(context, program_state, i, dt);
    }

    /* SETUP SHIP */
    let ship_transform = Mat4.identity()
      .times(this.ship_translation)
      .times(this.ship_rotation)
      .times(Mat4.rotation(Math.PI / 2, 1, 0, 0));
    this.shapes.ship.draw(
      context,
      program_state,
      ship_transform,
      this.materials.basic,
      'LINES'
    );

    if (!this.game_over) {
      this.speed += dt * 3;
      if (this.w_pressed) {
        if (this.ship_translation[1][3] < 12) {
          this.ship_translation = this.ship_translation.times(
            Mat4.translation(0, this.ship_speed * dt, 0)
          );
          this.ship_rotation = this.ship_rotation.times(
            Mat4.rotation((Math.PI / -4) * this.ship_turn_speed * dt, 1, 0, 0)
          );
        }
      }
      if (this.s_pressed) {
        if (this.ship_translation[1][3] > -6.5) {
          this.ship_translation = this.ship_translation.times(
            Mat4.translation(0, this.ship_speed * -dt, 0)
          );
          this.ship_rotation = this.ship_rotation.times(
            Mat4.rotation((Math.PI / 4) * this.ship_turn_speed * dt, 1, 0, 0)
          );
        }
      }
      if (this.a_pressed) {
        if (this.ship_translation[0][3] > -8.5) {
          this.ship_translation = this.ship_translation.times(
            Mat4.translation(this.ship_speed * -dt, 0, 0)
          );
          this.ship_rotation = this.ship_rotation.times(
            Mat4.rotation((Math.PI / -4) * this.ship_turn_speed * dt, 0, 1, -1)
          );
        }
      }
      if (this.d_pressed) {
        if (this.ship_translation[0][3] < 8.5) {
          this.ship_translation = this.ship_translation.times(
            Mat4.translation(this.ship_speed * dt, 0, 0)
          );
          this.ship_rotation = this.ship_rotation.times(
            Mat4.rotation((Math.PI / 4) * this.ship_turn_speed * dt, 0, 1, -1)
          );
        }
      }
      if (
        !this.w_pressed &&
        !this.s_pressed &&
        !this.a_pressed &&
        !this.d_pressed
      ) {
        this.ship_rotation = Mat4.identity();
      }
    } else {
      if (this.speed > 0.5) {
        this.speed -= this.speed * 0.95 * dt;
        this.ship_translation = this.ship_translation.times(
          Mat4.translation(
            this.ship_collision_velocity.translation.x * dt * this.speed,
            this.ship_collision_velocity.translation.y * dt * this.speed,
            this.ship_collision_velocity.translation.z * dt * this.speed
          )
        );
        this.ship_rotation = this.ship_rotation.times(
          Mat4.rotation(
            this.ship_collision_velocity.rotation.angle * dt * this.speed,
            this.ship_collision_velocity.rotation.is_x,
            this.ship_collision_velocity.rotation.is_y,
            this.ship_collision_velocity.rotation.is_z
          )
        );
      } else this.speed = 0;
    }
  }
}
