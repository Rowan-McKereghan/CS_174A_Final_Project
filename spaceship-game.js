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
  }

  draw_cube(context, program_state, model_transform, time, row, column) {
    model_transform = model_transform.times(
      Mat4.translation(-8 + column * 4, 11 - row * 4, 30 * time)
    );
    this.shapes.cube.draw(
      context,
      program_state,
      // model_transform.times(Mat4.scale(0.5, 0.5, 0.5)),
      model_transform,
      this.materials.color.override({ color: hex_color('#222222') })
    );
    this.shapes.cube_outline.draw(
      context,
      program_state,
      model_transform,
      this.materials.basic,
      'LINES'
    );
  }

  draw_cube_set(context, program_state, model_transform, reset, time) {
    reset = 1;
    for (let i = 0; i < 5; ++i) {
      for (let j = 0; j < 5; ++j) {
        // if (time * 30 >= 350 * reset) {
        //   // ++reset;
        //   reset = 1;
        // }
        this.draw_cube(
          context,
          program_state,
          model_transform.times(Mat4.translation(0, 0, -300 * reset)),
          time,
          i,
          j
        );
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

    let testTransform = Mat4.identity().times(Mat4.translation(0, 0, 200));;

    const t = program_state.animation_time / 1000,
      dt = program_state.animation_delta_time / 1000;

    

    //not where to put light, can't tell because the cubes don't reflect light in any way yet

    //const light_position = vec4(0, 0, 1000, 0);

    //program_state.lights = [light_position, color(1, 1, 1, 1), 1000**5];

    //this.shapes.testCube.draw(context, program_state, testTransform, this.materials.test);

    
    program_state.lights = [];


    let obstacle_transforms = [];
    let resets = [];
    for (let i = 0; i < 10; ++i) {
      obstacle_transforms[i] = Mat4.identity().times(
        Mat4.translation(0, 0, -100 * i)
      );
      resets[i] = 0;
      this.draw_cube_set(
        context,
        program_state,
        obstacle_transforms[i],
        resets[i],
        t
      );
    }
  }
}
