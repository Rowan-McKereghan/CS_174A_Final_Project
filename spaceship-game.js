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
    };

    this.materials = {
      basic: new Material(new defs.Basic_Shader()),
    };

    this.initial_camera_location = Mat4.look_at(
      vec3(0, 3, 20),
      vec3(0, 0, 0),
      vec3(0, 1, 0)
    );
  }

  draw_cube(context, program_state, model_transform, time, row, column) {
    model_transform = model_transform.times(
      Mat4.translation(-8 + column * 4, 11 - row * 4, -300 + 30 * time)
    );
    this.shapes.cube_outline.draw(
      context,
      program_state,
      model_transform,
      this.materials.basic,
      'LINES'
    );
  }

  draw_cube_set(context, program_state, model_transform, time) {
    for (let i = 0; i < 5; ++i) {
      for (let j = 0; j < 5; ++j) {
        this.draw_cube(context, program_state, model_transform, time, i, j);
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

    let obstacle_transforms = [];
    for (let i = 0; i < 3; ++i) {
      obstacle_transforms[i] = Mat4.identity().times(
        Mat4.translation(0, 0, -100 * i)
      );
      // console.log(i, obstacle_transforms[i]);
      console.log(Mat4.translation(0, 0, -100 * i));
      this.draw_cube_set(context, program_state, obstacle_transforms[i], t);
    }
  }
}