import { defs, tiny } from './common.js';
import { Shape_From_File } from './shape-from-file.js';
import { Obstacle } from './obstacle.js';
import { Board } from './obstacle_board.js';

const {
  Vector,
  Vector3,
  vec,
  vec3,
  vec4,
  color,
  hex_color,
  Shader,
  Texture,
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
      square: new defs.Square(),
      skybox: new defs.Square(),
      text: new defs.Text_Line(30),
      cube: new defs.Cube(),
      cube_outline: new defs.Cube_Outline(),
      testCube: new defs.Cube(),
      ship: new defs.Square_Pyramid_Outline(),
      ship_model: new Shape_From_File('assets/spaceship.obj'),
    };
    this.shapes.skybox.arrays.texture_coord.forEach((v) => {
      v[0] *= 5;
      v[1] *= 5;
    });

    this.materials = {
      basic: new Material(new defs.Basic_Shader()),
      color: new Material(new defs.Phong_Shader(), {
        color: hex_color('#000000'),
      }),
      transparent: new Material(new defs.Phong_Shader(), {
        color: hex_color('#00000000'),
      }),
      metal: new Material(new defs.Textured_Phong(1), {
        color: color(0.5, 0.5, 0.5, 1),
        ambient: 0.3,
        diffusivity: 1,
        specularity: 1,
        texture: new Texture('assets/metal.jpg'),
      }),
      spotlight: new Material(new defs.Spotlight_Shader(), {
        color: hex_color('#000000'),
        ambient: 0.1,
      }),
      text_image: new Material(new defs.Textured_Phong(), {
        ambient: 1,
        diffusivity: 0,
        speculatrity: 0,
        texture: new Texture('assets/text.png'),
      }),
      //uncomment for stationary stars
      // space_skybox: new Material(new defs.Textured_Phong(), {
      //   ambient: 0.5,
      //   diffusivity: 0,
      //   specularity: 0,
      //   texture: new Texture('assets/space.jpg'),
      // }),
      //uncomment for falling stars
      space_skybox: new Material(new defs.Texture_Zoom(), {
        ambient: 0.5,
        diffusivity: 0,
        specularity: 0,
        texture: new Texture('assets/space.jpg'),
      }),
    };

    this.initial_camera_location = Mat4.look_at(
      vec3(0, 3, 35),
      vec3(0, 0, 0),
      vec3(0, 1, 0)
    );

    this.game_over = false;
    this.game_speed = 80;

    /****** TEST ******/
    this.boards = [];
    for (let i = 0; i < 3; i++) {
      this.boards.push(new Board(-300 - 100 * i));
    }

    this.w_pressed = false;
    this.s_pressed = false;
    this.a_pressed = false;
    this.d_pressed = false;
    this.ship_speed = 30;
    this.ship_turn_speed = 3;
    // this.ship_translation = Mat4.identity();
    this.ship_position = { x: 0, y: 0, z: 0 };
    this.ship_rotation = { horizontal: 0, vertical: 0, tilt: 0 };
    this.ship_collision_velocity = {};

    this.text_position = { x: 0, y: 8, z: 25 };
    this.text_scale = { x: 0.75, y: 0.75, z: 1 };

    this.score = 0;
  }

  make_control_panel() {
    // move up
    this.key_triggered_button(
      'Up',
      ['w'],
      () => {
        this.w_pressed = true;
      },
      '#6E6460',
      () => {
        this.w_pressed = false;
      }
    );

    // move down
    this.key_triggered_button(
      'Down',
      ['s'],
      () => {
        this.s_pressed = true;
      },
      '#6E6460',
      () => {
        this.s_pressed = false;
      }
    );

    // move left
    this.key_triggered_button(
      'Left',
      ['a'],
      () => {
        this.a_pressed = true;
      },
      '#6E6460',
      () => {
        this.a_pressed = false;
      }
    );

    // move right
    this.key_triggered_button(
      'Right',
      ['d'],
      () => {
        this.d_pressed = true;
      },
      '#6E6460',
      () => {
        this.d_pressed = false;
      }
    );
  }

  display(context, program_state) {
    let camera_inverse = Mat4.inverse(
      // this.ship_rotation.times(
      Mat4.translation(this.ship_position.x, this.ship_position.y, 0).times(
        Mat4.inverse(program_state.camera_inverse)
      )
      // )
    );

    program_state.set_camera(this.initial_camera_location);
    program_state.projection_transform = Mat4.perspective(
      Math.PI / 4,
      context.width / context.height,
      0.1,
      1000
    );

    const t = program_state.animation_time / 1000,
      dt = program_state.animation_delta_time / 1000;

    program_state.lights = [
      new Light(
        vec4(
          this.ship_position.x,
          this.ship_position.y,
          this.game_over ? this.ship_position.z + 50 : this.ship_position.z,
          1
        ),
        vec3(
          -Math.sin(this.ship_rotation.horizontal),
          Math.sin(this.ship_rotation.vertical),
          -5
        ),
        this.game_over ? color(1.0, 0, 0, 1.0) : color(1.0, 1.0, 1.0, 1.0),
        this.game_over ? 100000 : 3500,
        this.game_over ? 0 : Math.PI / 3.155
      ),
    ];

    this.shapes.text.set_string(this.score.toString(), context.context);
    this.shapes.text.draw(
      context,
      program_state,
      Mat4.translation(
        this.text_position.x,
        this.text_position.y,
        this.text_position.z
      )
        .times(
          Mat4.scale(this.text_scale.x, this.text_scale.y, this.text_scale.z)
        )
        .times(
          Mat4.translation((this.score.toString().length - 1) * -0.75, 0, 0)
        ),
      this.materials.text_image
    );

    program_state.set_camera(
      this.initial_camera_location.map((x, i) =>
        Vector.from(camera_inverse[i]).mix(x, 0.6)
      )
    );

    /****** TEST ******/
    // iterate through each board
    for (let i = 0; i < 3; i++) {
      this.boards[i].draw(context, program_state, this.game_speed, dt); // draw the board

      if (this.game_over) continue; // skip the collision check if the game is over

      // collision will hold an obstacle that collided with the ship
      let collision = this.boards[i].check_collision(this.ship_position);

      // if any obstacle has collided
      if (collision != null) {
        collision.fracture_at(this.ship_position); // fracture the collided obstacle
        this.game_over = true; // end the game
      }
    }

    /* SETUP SHIP */
    let ship_transform = Mat4.identity()
      .times(
        Mat4.translation(
          this.ship_position.x,
          this.ship_position.y,
          this.ship_position.z
        )
      )
      .times(Mat4.rotation(this.ship_rotation.horizontal, 0, 1, 0))
      .times(Mat4.rotation(this.ship_rotation.vertical, 1, 0, 0))
      .times(Mat4.rotation(this.ship_rotation.tilt, 0, 0, 1))
      .times(Mat4.rotation(Math.PI / 2, 0, 1, 0));

    this.shapes.ship.draw(
      context,
      program_state,
      ship_transform,
      this.materials.color.override({
        color: hex_color('#ffffff'),
        ambient: 1.0,
      })
    );
    this.shapes.ship_model.draw(
      context,
      program_state,
      ship_transform,
      // .times(Mat4.rotation(Math.PI, 0, 1, 0)),
      this.materials.metal
    );

    this.shapes.skybox.draw(
      context,
      program_state,
      Mat4.translation(0, 0, -300).times(Mat4.scale(400, 400, 1)),
      this.materials.space_skybox
    );

    if (!this.game_over) {
      this.game_speed += dt * 2;
      if (this.w_pressed) {
        if (this.ship_rotation.vertical < Math.PI / 4)
          this.ship_rotation.vertical +=
            (Math.PI / 4) * this.ship_turn_speed * dt;
      }
      if (this.s_pressed) {
        if (this.ship_rotation.vertical > -Math.PI / 4)
          this.ship_rotation.vertical -=
            (Math.PI / 4) * this.ship_turn_speed * dt;
      }
      if (!this.w_pressed && !this.s_pressed) {
        if (Math.abs(this.ship_rotation.vertical) < 0.01)
          this.ship_rotation.vertical = 0;
        else
          this.ship_rotation.vertical -= this.ship_rotation.vertical * 5 * dt;
      }
      if (this.a_pressed) {
        if (this.ship_rotation.horizontal < Math.PI / 4) {
          this.ship_rotation.horizontal +=
            (Math.PI / 4) * this.ship_turn_speed * dt;
          this.ship_rotation.tilt += (Math.PI / 12) * this.ship_turn_speed * dt;
        }
      }
      if (this.d_pressed) {
        if (this.ship_rotation.horizontal > -Math.PI / 4) {
          this.ship_rotation.horizontal -=
            (Math.PI / 4) * this.ship_turn_speed * dt;
          this.ship_rotation.tilt -= (Math.PI / 12) * this.ship_turn_speed * dt;
        }
      }
      if (!this.a_pressed && !this.d_pressed) {
        if (Math.abs(this.ship_rotation.horizontal) < 0.01)
          this.ship_rotation.horizontal = 0;
        else
          this.ship_rotation.horizontal -=
            this.ship_rotation.horizontal * 5 * dt;
        if (Math.abs(this.ship_rotation.tilt) < 0.01)
          this.ship_rotation.tilt = 0;
        else this.ship_rotation.tilt -= this.ship_rotation.tilt * 4 * dt;
      }
      this.ship_position.x -=
        this.ship_speed * Math.sin(this.ship_rotation.horizontal) * dt;
      this.ship_position.x = Math.max(this.ship_position.x, -8.5);
      this.ship_position.x = Math.min(this.ship_position.x, 8.5);
      this.ship_position.y +=
        this.ship_speed * Math.sin(this.ship_rotation.vertical) * dt;
      this.ship_position.y = Math.max(this.ship_position.y, -6.5);
      this.ship_position.y = Math.min(this.ship_position.y, 12.0);
    } else {
      this.game_speed > 1
        ? (this.game_speed *= 0.15 ** dt)
        : (this.game_speed = 0);
    }
  }
}
