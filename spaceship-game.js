import { defs, tiny } from './common.js';
import { Shape_From_File } from './shape-from-file.js';
import { Obstacle } from './obstacle.js';
import { Board } from './obstacle_board.js';
import {Color_Phong_Shader, Shadow_Textured_Phong_Shader,
    Depth_Texture_Shader_2D, Buffered_Texture, LIGHT_DEPTH_TEX_SIZE} from './shadow-demo-shaders.js'

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

const {Axis_Arrows, Textured_Phong, Phong_Shader, Basic_Shader, Subdivision_Sphere} = defs

const Square =
    class Square extends tiny.Vertex_Buffer {
        constructor() {
            super("position", "normal", "texture_coord");
            this.arrays.position = [
                vec3(0, 0, 0), vec3(1, 0, 0), vec3(0, 1, 0),
                vec3(1, 1, 0), vec3(1, 0, 0), vec3(0, 1, 0)
            ];
            this.arrays.normal = [
                vec3(0, 0, 1), vec3(0, 0, 1), vec3(0, 0, 1),
                vec3(0, 0, 1), vec3(0, 0, 1), vec3(0, 0, 1),
            ];
            this.arrays.texture_coord = [
                vec(0, 0), vec(1, 0), vec(0, 1),
                vec(1, 1), vec(1, 0), vec(0, 1)
            ]
        }
    }

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
      square_2d: new Square(),

    };
    this.shapes.skybox.arrays.texture_coord.forEach((v) => {
      v[0] *= 10;
      v[1] *= 10;
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

    // this.game_start = false;
    // this.game_over = false;
    this.game_playing = false;
    // this.game_speed = 80;
    this.game_speed = 0;

    /****** TEST ******/
    this.boards = [];
    // for (let i = 0; i < 3; i++) {
    //   this.boards.push(new Board(-300 - 100 * i));
    // }

    this.w_pressed = false;
    this.s_pressed = false;
    this.a_pressed = false;
    this.d_pressed = false;
    this.ship_speed = 30;
    this.ship_turn_speed = 3;
    // this.ship_translation = Mat4.identity();
    this.ship_position = { x: 0, y: 0, z: 0 };
    this.ship_rotation = { horizontal: 0, vertical: 0, tilt: 0 };

    this.text_position = { x: 0, y: 8, z: 10 };
    this.text_scale = { x: 0.75, y: 0.75, z: 1 };

    this.score = 0;

    // For the floor or other plain objects
    this.floor = new Material(new Shadow_Textured_Phong_Shader(1), {
        color: color(1, 1, 1, 1), ambient: .3, diffusivity: 0.6, specularity: 0.4, smoothness: 64,
        color_texture: null,
        light_depth_texture: null
    })
    // For the first pass
    this.pure = new Material(new Color_Phong_Shader(), {
    })
    // For light source
    this.light_src = new Material(new Phong_Shader(), {
        color: color(1, 1, 1, 1), ambient: 1, diffusivity: 0, specularity: 0
    });
    // For depth texture display
    this.depth_tex =  new Material(new Depth_Texture_Shader_2D(), {
        color: color(0, 0, .0, 1),
        ambient: 1, diffusivity: 0, specularity: 0, texture: null
    });

    this.init_ok = false;
    this.high_score = 0;
  }

  make_control_panel() {
    this.key_triggered_button('Start', [' '], () => {
      // if (!this.game_start || this.game_over) {
      if (!this.game_playing) {
        // this.game_over = false;
        // this.game_start = true;
        this.game_playing = true;
        this.game_speed = 80;
        this.score = 0;
        this.ship_position = { x: 0, y: 0, z: 0 };
        this.ship_rotation = { horizontal: 0, vertical: 0, tilt: 0 };
        this.boards = [];
        for (let i = 0; i < 3; i++) {
          this.boards.push(new Board(-300 - 100 * i));
        }
      }
    });
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

   texture_buffer_init(gl) {
        // Depth Texture
        this.lightDepthTexture = gl.createTexture();
        // Bind it to TinyGraphics
        this.light_depth_texture = new Buffered_Texture(this.lightDepthTexture);
        this.floor.light_depth_texture = this.light_depth_texture

        this.lightDepthTextureSize = LIGHT_DEPTH_TEX_SIZE;
        gl.bindTexture(gl.TEXTURE_2D, this.lightDepthTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,      // target
            0,                  // mip level
            gl.DEPTH_COMPONENT, // internal format
            this.lightDepthTextureSize,   // width
            this.lightDepthTextureSize,   // height
            0,                  // border
            gl.DEPTH_COMPONENT, // format
            gl.UNSIGNED_INT,    // type
            null);              // data
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Depth Texture Buffer
        this.lightDepthFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightDepthFramebuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,       // target
            gl.DEPTH_ATTACHMENT,  // attachment point
            gl.TEXTURE_2D,        // texture target
            this.lightDepthTexture,         // texture
            0);                   // mip level
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // create a color texture of the same size as the depth texture
        // see article why this is needed_
        this.unusedTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.unusedTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            this.lightDepthTextureSize,
            this.lightDepthTextureSize,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null,
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // attach it to the framebuffer
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,        // target
            gl.COLOR_ATTACHMENT0,  // attachment point
            gl.TEXTURE_2D,         // texture target
            this.unusedTexture,         // texture
            0);                    // mip level
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }


  render_scene(context, program_state, shadow_pass, draw_light_source=false, draw_shadow=false) {
        // shadow_pass: true if this is the second pass that draw the shadow.
        // draw_light_source: true if we want to draw the light source.
        // draw_shadow: true if we want to draw the shadow

        let light_position = this.light_position;
        let light_color = this.light_color;
        const t = program_state.animation_time, dt = program_state.animation_delta_time / 1000;


        program_state.draw_shadow = draw_shadow;
    


       /****** TEST ******/
    // iterate through each board
    for (let i = 0; i < this.boards.length; i++) {

      this.boards[i].draw(context, program_state, this.game_speed, dt, shadow_pass, this.lightDepthTexture); // draw the board

      if (!this.game_playing) continue;
      let collision = this.boards[i].check_collision(this.ship_position);

      // if any obstacle has collided
      if (collision != null) {
        collision.fracture_at(this.ship_position); // fracture the collided obstacle
        // this.game_playing = false; // end the game
      }
    }
  } // skip the collision check if the game is over


  display(context, program_state) {
    let camera_inverse = Mat4.inverse(
      // this.ship_rotation.times(
      Mat4.translation(this.ship_position.x, this.ship_position.y, 0).times(
        Mat4.inverse(program_state.camera_inverse)
      )
      // )
    );

    const gl = context.context;

    if (!this.init_ok) {
            const ext = gl.getExtension('WEBGL_depth_texture');
            if (!ext) {
                return alert('need WEBGL_depth_texture');  // eslint-disable-line
            }
            this.texture_buffer_init(gl);

            this.init_ok = true;
        }

    program_state.set_camera(this.initial_camera_location);
    program_state.projection_transform = Mat4.perspective(
      Math.PI / 4,
      context.width / context.height,
      0.1,
      1000
    );




    const t = program_state.animation_time / 1000,
      dt = program_state.animation_delta_time / 1000;


    this.light_position = vec4(
          this.ship_position.x,
          this.ship_position.y,
          // this.game_over ? this.ship_position.z + 50 : this.ship_position.z,
          this.game_playing ? this.ship_position.z : this.ship_position.z + 50,
          1
        );

    program_state.lights = [
      new Light(this.light_position,
      
        vec3(
          -Math.sin(this.ship_rotation.horizontal),
          Math.sin(this.ship_rotation.vertical),
          -5
        ),
        // this.game_over ? color(1.0, 0, 0, 1.0) : color(1.0, 1.0, 1.0, 1.0),
        // this.game_over ? 100000 : 3500,
        // this.game_over ? 0 : Math.PI / 3.155
        this.game_playing ? color(1.0, 1.0, 1.0, 1.0) : color(1.0, 0, 0, 1.0),
        this.game_playing ? 3500 : 100000,
        this.game_playing ? Math.PI / 3.155 : 0
      ),
    ];

    let text;
    if (this.game_playing) text = Math.floor(this.score).toString();
    else text = 'PRESS SPACE TO BEGIN';
    this.shapes.text.set_string(text, context.context);
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
        .times(Mat4.translation((text.length - 1) * -0.75, 0, 0)),
      this.materials.text_image
    );
    if (!this.game_playing && this.high_score > 0) {
      (text = 'HIGH SCORE: ' + this.high_score),
        this.shapes.text.set_string(text, context.context);
      this.shapes.text.draw(
        context,
        program_state,
        Mat4.translation(
          this.text_position.x,
          this.text_position.y - 4,
          this.text_position.z
        )
          .times(
            Mat4.scale(this.text_scale.x, this.text_scale.y, this.text_scale.z)
          )
          .times(Mat4.translation((text.length - 1) * -0.75, 0, 0)),
        this.materials.text_image
      );
    }

    program_state.set_camera(
      this.initial_camera_location.map((x, i) =>
        Vector.from(camera_inverse[i]).mix(x, 0.6)
      )
    );

    //this.light_view_target = vec4(0, 0, 0, 1);
    this.light_field_of_view = 130 * Math.PI / 180; // 130 degree
  
    
    const light_view_mat = Mat4.look_at(
            vec3(this.light_position[0], this.light_position[1], this.light_position[2]),
            vec3(0, 0, 1),
            vec3(0, 1, 0), // assume the light to target will have a up dir of +y, maybe need to change according to your case
        );
    
    const light_proj_mat = Mat4.perspective(this.light_field_of_view, 1, 0.5, 500);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightDepthFramebuffer);
    gl.viewport(0, 0, this.lightDepthTextureSize, this.lightDepthTextureSize);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Prepare uniforms
    program_state.light_view_mat = light_view_mat;
    program_state.light_proj_mat = light_proj_mat;
    program_state.light_tex_mat = light_proj_mat;
    program_state.view_mat = light_view_mat;
    program_state.projection_transform = light_proj_mat;
    this.render_scene(context, program_state, false,false, false);


    
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    program_state.view_mat = program_state.camera_inverse;
    program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, 0.5, 500);
    this.render_scene(context, program_state, true,true, true);
    


    if (this.game_playing) {
      this.score += dt;
      this.high_score = Math.max(this.high_score, Math.floor(this.score));
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

