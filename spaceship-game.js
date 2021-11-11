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
    };

    this.materials = {
      basic: new Material(new defs.Basic_Shader()),
      color: new Material(new defs.Phong_Shader(), {
        ambient: 1,
        color: hex_color('#000000'),
      }),
    };

    this.initial_camera_location = Mat4.look_at(
      vec3(0, 3, 50),
      vec3(0, 0, 0),
      vec3(0, 1, 0)
    );

    this.speed = 50;
    this.spawn_point = 400;
    this.obstacle_spacing = 100;
    this.obstacle_transforms = [];
    this.resets = [];
    this.resetTimers = [];
    for (let i = 0; i < 100; ++i) {
      this.obstacle_transforms[i] = Mat4.identity().times(
        Mat4.translation(
          0,
          0,
          -1 * (this.spawn_point + this.obstacle_spacing * i)
        )
      );
      this.resets[i] = 0;
      this.resetTimers[i] =
        (this.obstacle_spacing * i + this.spawn_point) / this.speed;
    }
  }

  draw_cube(context, program_state, idx, row, column) {
    this.shapes.cube.draw(
      context,
      program_state,
      this.obstacle_transforms[idx].times(
        Mat4.translation(-8 + column * 4, 11 - row * 4, 60)
      ),
      this.materials.color.override({ color: hex_color('#222222') })
    );
    this.shapes.cube_outline.draw(
      context,
      program_state,
      this.obstacle_transforms[idx].times(
        Mat4.translation(-8 + column * 4, 11 - row * 4, 60)
      ),
      this.materials.basic,
      'LINES'
    );
  }

  draw_cube_set(context, program_state, idx, dt) {
    if (this.resetTimers[idx] <= 0) {
      this.resetTimers[idx] = this.spawn_point / this.speed;
      this.obstacle_transforms[idx] = this.obstacle_transforms[idx].times(
        Mat4.translation(0, 0, -1 * this.spawn_point)
      );
    }
    this.resetTimers[idx] -= dt;
    this.obstacle_transforms[idx] = this.obstacle_transforms[idx].times(
      Mat4.translation(0, 0, this.speed * dt)
    );
    for (let i = 0; i < 5; ++i) {
      for (let j = 0; j < 5; ++j) {
        this.draw_cube(context, program_state, idx, i, j);
      }
    }
  }

  display(context, program_state) {
    program_state.set_camera(
      this.initial_camera_location.map((x, i) =>
        Vector.from(program_state.camera_inverse[i]).mix(x, 0.1)
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

    program_state.lights = [];

    for (let i = 0; i < 5; ++i) {
      this.draw_cube_set(context, program_state, i, dt);
    }
  }
}
