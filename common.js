import { tiny } from './tiny-graphics.js';
import { widgets } from './tiny-graphics-widgets.js';

const {
  Vector,
  Vector3,
  vec,
  vec3,
  vec4,
  color,
  Matrix,
  Mat4,
  Light,
  Shape,
  Material,
  Shader,
  Texture,
  Scene,
} = tiny;

Object.assign(tiny, widgets);

const defs = {};

export { tiny, defs };

const Square = (defs.Square = class Square extends Shape {
  // **Square** demonstrates two triangles that share vertices.  On any planar surface, the
  // interior edges don't make any important seams.  In these cases there's no reason not
  // to re-use data of the common vertices between triangles.  This makes all the vertex
  // arrays (position, normals, etc) smaller and more cache friendly.
  constructor() {
    super('position', 'normal', 'texture_coord');
    // Specify the 4 square corner locations, and match those up with normal vectors:
    this.arrays.position = Vector3.cast(
      [-1, -1, 0],
      [1, -1, 0],
      [-1, 1, 0],
      [1, 1, 0]
    );
    this.arrays.normal = Vector3.cast(
      [0, 0, 1],
      [0, 0, 1],
      [0, 0, 1],
      [0, 0, 1]
    );
    // Arrange the vertices into a square shape in texture space too:
    this.arrays.texture_coord = Vector.cast([0, 0], [1, 0], [0, 1], [1, 1]);
    // Use two triangles this time, indexing into four distinct vertices:
    this.indices.push(0, 1, 2, 1, 3, 2);
  }
});

const Text_Line = (defs.Text_Line = class Text_Line extends Shape {
  constructor(max_size) {
    super('position', 'normal', 'texture_coord');
    this.max_size = max_size;
    var object_transform = Mat4.identity();
    for (var i = 0; i < max_size; i++) {
      // Each quad is a separate Square instance:
      defs.Square.insert_transformed_copy_into(this, [], object_transform);
      object_transform.post_multiply(Mat4.translation(1.5, 0, 0));
    }
  }

  set_string(line, context) {
    // set_string():  Call this to overwrite the texture coordinates buffer with new
    // values per quad, which enclose each of the string's characters.
    this.arrays.texture_coord = [];
    for (var i = 0; i < this.max_size; i++) {
      var row = Math.floor(
          (i < line.length ? line.charCodeAt(i) : ' '.charCodeAt()) / 16
        ),
        col = Math.floor(
          (i < line.length ? line.charCodeAt(i) : ' '.charCodeAt()) % 16
        );

      var skip = 3,
        size = 32,
        sizefloor = size - skip;
      var dim = size * 16,
        left = (col * size + skip) / dim,
        top = (row * size + skip) / dim,
        right = (col * size + sizefloor) / dim,
        bottom = (row * size + sizefloor + 5) / dim;

      this.arrays.texture_coord.push(
        ...Vector.cast(
          [left, 1 - bottom],
          [right, 1 - bottom],
          [left, 1 - top],
          [right, 1 - top]
        )
      );
    }
    if (!this.existing) {
      this.copy_onto_graphics_card(context);
      this.existing = true;
    } else this.copy_onto_graphics_card(context, ['texture_coord'], false);
  }
});

const Cube = (defs.Cube = class Cube extends Shape {
  // **Cube** A closed 3D shape, and the first example of a compound shape (a Shape constructed
  // out of other Shapes).  A cube inserts six Square strips into its own arrays, using six
  // different matrices as offsets for each square.
  constructor() {
    super('position', 'normal', 'texture_coord');
    // Loop 3 times (for each axis), and inside loop twice (for opposing cube sides):
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 2; j++) {
        const square_transform = Mat4.rotation(
          i == 0 ? Math.PI / 2 : 0,
          1,
          0,
          0
        )
          .times(
            Mat4.rotation(Math.PI * j - (i == 1 ? Math.PI / 2 : 0), 0, 1, 0)
          )
          .times(Mat4.translation(0, 0, 1));
        // Calling this function of a Square (or any Shape) copies it into the specified
        // Shape (this one) at the specified matrix offset (square_transform):
        Square.insert_transformed_copy_into(this, [], square_transform);
      }
  }
});

const Cube_Outline = (defs.Cube_Outline = class Cube_Outline extends Shape {
  constructor() {
    super('position', 'color');
    //  TODO (Requirement 5).
    // When a set of lines is used in graphics, you should think of the list entries as
    // broken down into pairs; each pair of vertices will be drawn as a line segment.
    // Note: since the outline is rendered with Basic_shader, you need to redefine the position and color of each vertex
    this.arrays.position = Vector3.cast(
      [-1, 1, -1],
      [-1, 1, 1],
      [-1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, -1],
      [1, 1, -1],
      [-1, 1, -1],
      [-1, 1, -1],
      [-1, -1, -1],
      [-1, -1, -1],
      [-1, -1, 1],
      [-1, -1, 1],
      [-1, 1, 1],
      [-1, -1, 1],
      [1, -1, 1],
      [1, -1, 1],
      [1, 1, 1],
      [1, -1, 1],
      [1, -1, -1],
      [1, -1, -1],
      [1, 1, -1],
      [1, -1, -1],
      [-1, -1, -1]
    );
    this.arrays.color = [
      color(1, 1, 1, 1),
      color(1, 1, 1, 1),
      color(1, 1, 1, 1),
      color(1, 1, 1, 1),
      color(1, 1, 1, 1),
      color(1, 1, 1, 1),
      color(1, 1, 1, 1),
      color(1, 1, 1, 1),
      color(1, 1, 1, 1),
      color(1, 1, 1, 1),
      color(1, 1, 1, 1),
      color(1, 1, 1, 1),
      color(1, 1, 1, 1),
      color(1, 1, 1, 1),
      color(1, 1, 1, 1),
      color(1, 1, 1, 1),
      color(1, 1, 1, 1),
      color(1, 1, 1, 1),
      color(1, 1, 1, 1),
      color(1, 1, 1, 1),
      color(1, 1, 1, 1),
      color(1, 1, 1, 1),
      color(1, 1, 1, 1),
      color(1, 1, 1, 1),
    ];
    this.indices = false;
  }
});

const Square_Pyramid_Outline =
  (defs.Square_Pyramid_Outline = class Square_Pyramid_Outline extends Shape {
    constructor() {
      super('position', 'color');

      this.arrays.position = Vector3.cast(
        [0, 1, 0],
        [-1, -1, -1],
        [0, 1, 0],
        [-1, -1, 1],
        [0, 1, 0],
        [1, -1, -1],
        [0, 1, 0],
        [1, -1, 1],
        [-1, -1, -1],
        [-1, -1, 1],
        [-1, -1, -1],
        [1, -1, -1],
        [1, -1, 1],
        [-1, -1, 1],
        [1, -1, 1],
        [1, -1, -1]
      );

      for (let i = 0; i < 16; i++) {
        this.arrays.color.push(color(1, 1, 1, 1));
      }
    }
  });

const Basic_Shader = (defs.Basic_Shader = class Basic_Shader extends Shader {
  // **Basic_Shader** is nearly the simplest example of a subclass of Shader, which stores and
  // maanges a GPU program.  Basic_Shader is a trivial pass-through shader that applies a
  // shape's matrices and then simply samples literal colors stored at each vertex.
  update_GPU(
    context,
    gpu_addresses,
    graphics_state,
    model_transform,
    material
  ) {
    // update_GPU():  Defining how to synchronize our JavaScript's variables to the GPU's:
    const [P, C, M] = [
        graphics_state.projection_transform,
        graphics_state.camera_inverse,
        model_transform,
      ],
      PCM = P.times(C).times(M);
    context.uniformMatrix4fv(
      gpu_addresses.projection_camera_model_transform,
      false,
      Matrix.flatten_2D_to_1D(PCM.transposed())
    );
  }

  shared_glsl_code() {
    // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    return `precision mediump float;
                varying vec4 VERTEX_COLOR;
            `;
  }

  vertex_glsl_code() {
    // ********* VERTEX SHADER *********
    return (
      this.shared_glsl_code() +
      `
                attribute vec4 color;
                attribute vec3 position;                            
                // Position is expressed in object coordinates.
                uniform mat4 projection_camera_model_transform;
        
                void main(){
                    // Compute the vertex's final resting place (in NDCS), and use the hard-coded color of the vertex:
                    gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                    VERTEX_COLOR = color;
                }`
    );
  }

  fragment_glsl_code() {
    // ********* FRAGMENT SHADER *********
    return (
      this.shared_glsl_code() +
      `
                void main(){
                    // The interpolation gets done directly on the per-vertex colors:
                    gl_FragColor = VERTEX_COLOR;
                }`
    );
  }
});

const Phong_Shader = (defs.Phong_Shader = class Phong_Shader extends Shader {
  // **Phong_Shader** is a subclass of Shader, which stores and maanges a GPU program.
  // Graphic cards prior to year 2000 had shaders like this one hard-coded into them
  // instead of customizable shaders.  Phong-Blinn" Shading here is a process of
  // determining brightness of pixels via vector math.  It compares the normal vector
  // at that pixel with the vectors toward the camera and light sources.

  constructor(num_lights = 2) {
    super();
    this.num_lights = num_lights;
  }

  shared_glsl_code() {
    // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    return (
      ` precision mediump float;
                const int N_LIGHTS = ` +
      this.num_lights +
      `;
                uniform float ambient, diffusivity, specularity, smoothness;
                uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
                uniform float light_attenuation_factors[N_LIGHTS];
                uniform vec4 shape_color;
                uniform vec3 squared_scale, camera_center;
        
                // Specifier "varying" means a variable's final value will be passed from the vertex shader
                // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
                // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
                varying vec3 N, vertex_worldspace;
                // ***** PHONG SHADING HAPPENS HERE: *****                                       
                vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace ){                                        
                    // phong_model_lights():  Add up the lights' contributions.
                    vec3 E = normalize( camera_center - vertex_worldspace );
                    vec3 result = vec3( 0.0 );
                    for(int i = 0; i < N_LIGHTS; i++){
                        // Lights store homogeneous coords - either a position or vector.  If w is 0, the 
                        // light will appear directional (uniform direction from all points), and we 
                        // simply obtain a vector towards the light by directly using the stored value.
                        // Otherwise if w is 1 it will appear as a point light -- compute the vector to 
                        // the point light's location from the current surface point.  In either case, 
                        // fade (attenuate) the light as the vector needed to reach it gets longer.  
                        vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                                                       light_positions_or_vectors[i].w * vertex_worldspace;                                             
                        float distance_to_light = length( surface_to_light_vector );
        
                        vec3 L = normalize( surface_to_light_vector );
                        vec3 H = normalize( L + E );
                        // Compute the diffuse and specular components from the Phong
                        // Reflection Model, using Blinn's "halfway vector" method:
                        float diffuse  =      max( dot( N, L ), 0.0 );
                        float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                        float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                        
                        vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                                  + light_colors[i].xyz * specularity * specular;
                        result += attenuation * light_contribution;
                      }
                    return result;
                  } `
    );
  }

  vertex_glsl_code() {
    // ********* VERTEX SHADER *********
    return (
      this.shared_glsl_code() +
      `
                attribute vec3 position, normal;                            
                // Position is expressed in object coordinates.
                
                uniform mat4 model_transform;
                uniform mat4 projection_camera_model_transform;
        
                void main(){                                                                   
                    // The vertex's final resting place (in NDCS):
                    gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                    // The final normal vector in screen space.
                    N = normalize( mat3( model_transform ) * normal / squared_scale);
                    vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
                  } `
    );
  }

  fragment_glsl_code() {
    // ********* FRAGMENT SHADER *********
    // A fragment is a pixel that's overlapped by the current triangle.
    // Fragments affect the final image or get discarded due to depth.
    return (
      this.shared_glsl_code() +
      `
                void main(){                                                           
                    // Compute an initial (ambient) color:
                    gl_FragColor = vec4( shape_color.xyz * ambient, shape_color.w );
                    // Compute the final color with contributions from lights:
                    gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
                  } `
    );
  }

  send_material(gl, gpu, material) {
    // send_material(): Send the desired shape-wide material qualities to the
    // graphics card, where they will tweak the Phong lighting formula.
    gl.uniform4fv(gpu.shape_color, material.color);
    gl.uniform1f(gpu.ambient, material.ambient);
    gl.uniform1f(gpu.diffusivity, material.diffusivity);
    gl.uniform1f(gpu.specularity, material.specularity);
    gl.uniform1f(gpu.smoothness, material.smoothness);
  }

  send_gpu_state(gl, gpu, gpu_state, model_transform) {
    // send_gpu_state():  Send the state of our whole drawing context to the GPU.
    const O = vec4(0, 0, 0, 1),
      camera_center = gpu_state.camera_transform.times(O).to3();
    gl.uniform3fv(gpu.camera_center, camera_center);
    // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
    const squared_scale = model_transform
      .reduce((acc, r) => {
        return acc.plus(vec4(...r).times_pairwise(r));
      }, vec4(0, 0, 0, 0))
      .to3();
    gl.uniform3fv(gpu.squared_scale, squared_scale);
    // Send the current matrices to the shader.  Go ahead and pre-compute
    // the products we'll need of the of the three special matrices and just
    // cache and send those.  They will be the same throughout this draw
    // call, and thus across each instance of the vertex shader.
    // Transpose them since the GPU expects matrices as column-major arrays.
    const PCM = gpu_state.projection_transform
      .times(gpu_state.camera_inverse)
      .times(model_transform);
    gl.uniformMatrix4fv(
      gpu.model_transform,
      false,
      Matrix.flatten_2D_to_1D(model_transform.transposed())
    );
    gl.uniformMatrix4fv(
      gpu.projection_camera_model_transform,
      false,
      Matrix.flatten_2D_to_1D(PCM.transposed())
    );

    // Omitting lights will show only the material color, scaled by the ambient term:
    if (!gpu_state.lights.length) return;

    const light_positions_flattened = [],
      light_colors_flattened = [];
    for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
      light_positions_flattened.push(
        gpu_state.lights[Math.floor(i / 4)].position[i % 4]
      );
      light_colors_flattened.push(
        gpu_state.lights[Math.floor(i / 4)].color[i % 4]
      );
    }

    gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
    gl.uniform4fv(gpu.light_colors, light_colors_flattened);
    gl.uniform1fv(
      gpu.light_attenuation_factors,
      gpu_state.lights.map((l) => l.attenuation)
    );
  }

  update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
    // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
    // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
    // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
    // program (which we call the "Program_State").  Send both a material and a program state to the shaders
    // within this function, one data field at a time, to fully initialize the shader for a draw.

    // Fill in any missing fields in the Material object with custom defaults for this shader:
    const defaults = {
      color: color(0, 0, 0, 1),
      ambient: 0,
      diffusivity: 1,
      specularity: 1,
      smoothness: 40,
    };
    material = Object.assign({}, defaults, material);

    this.send_material(context, gpu_addresses, material);
    this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
  }
});

const Textured_Phong = (defs.Textured_Phong = class Textured_Phong extends (
  Phong_Shader
) {
  // **Textured_Phong** is a Phong Shader extended to addditionally decal a
  // texture image over the drawn shape, lined up according to the texture
  // coordinates that are stored at each shape vertex.
  vertex_glsl_code() {
    // ********* VERTEX SHADER *********
    return (
      this.shared_glsl_code() +
      `
                varying vec2 f_tex_coord;
                attribute vec3 position, normal;                            
                // Position is expressed in object coordinates.
                attribute vec2 texture_coord;
                
                uniform mat4 model_transform;
                uniform mat4 projection_camera_model_transform;
        
                void main(){                                                                   
                    // The vertex's final resting place (in NDCS):
                    gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                    // The final normal vector in screen space.
                    N = normalize( mat3( model_transform ) * normal / squared_scale);
                    vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
                    // Turn the per-vertex texture coordinate into an interpolated variable.
                    f_tex_coord = texture_coord;
                  } `
    );
  }

  fragment_glsl_code() {
    // ********* FRAGMENT SHADER *********
    // A fragment is a pixel that's overlapped by the current triangle.
    // Fragments affect the final image or get discarded due to depth.
    return (
      this.shared_glsl_code() +
      `
                varying vec2 f_tex_coord;
                uniform sampler2D texture;
                uniform float animation_time;
        
                void main(){
                    // Sample the texture image in the correct place:
                    vec4 tex_color = texture2D( texture, f_tex_coord );
                    if( tex_color.w < .01 ) discard;
                                                                             // Compute an initial (ambient) color:
                    gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                                                                             // Compute the final color with contributions from lights:
                    gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
                  } `
    );
  }

  update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
    // update_GPU(): Add a little more to the base class's version of this method.
    super.update_GPU(
      context,
      gpu_addresses,
      gpu_state,
      model_transform,
      material
    );

    context.uniform1f(
      gpu_addresses.animation_time,
      gpu_state.animation_time / 1000
    );
    if (material.texture && material.texture.ready) {
      // Select texture unit 0 for the fragment shader Sampler2D uniform called "texture":
      context.uniform1i(gpu_addresses.texture, 0);
      // For this draw, use the texture image from correct the GPU buffer:
      material.texture.activate(context);
    }
  }
});

const Texture_Zoom = (defs.Texture_Zoom = class Texture_Zoom extends (
  Textured_Phong
) {
  fragment_glsl_code() {
    return (
      this.shared_glsl_code() +
      `
        varying vec2 f_tex_coord;
        uniform sampler2D texture;
        uniform float animation_time;
        void main() {
          float x_coord = f_tex_coord.x;
          float y_coord = f_tex_coord.y;
          float new_x = x_coord;
          float new_y = mod(y_coord + animation_time / 10.0, 10.0);

          vec2 new_coord = vec2(new_x, new_y);
          vec4 tex_color = texture2D(texture, new_coord);

          if (tex_color.w < .01) discard;
          gl_FragColor = vec4((tex_color.xyz + shape_color.xyz) * ambient, shape_color.w * tex_color.w);
          gl_FragColor.xyz += phong_model_lights(normalize(N), vertex_worldspace);
        }
      `
    );
  }
});

const Spotlight_Shader =
  (defs.Spotlight_Shader = class SpotLight_Shader extends Shader {
    constructor(num_lights = 1) {
      super();
      this.num_lights = num_lights;
    }

    shared_glsl_code() {
      // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
      return (
        ` precision mediump float;
                const int N_LIGHTS = ` +
        this.num_lights +
        `;
                uniform float ambient, diffusivity, specularity, smoothness;
                uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
                uniform vec3 light_rotations[N_LIGHTS];
                uniform float light_attenuation_factors[N_LIGHTS], limit_angles[N_LIGHTS];
                uniform vec4 shape_color;
                uniform vec3 squared_scale, camera_center;
        
                varying vec3 N, vertex_worldspace;
                vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace ){                                        
                    // phong_model_lights():  Add up the lights' contributions.
                    vec3 E = normalize( camera_center - vertex_worldspace );
                    vec3 result = vec3( 0.0 );
                    for(int i = 0; i < N_LIGHTS; i++){
                        vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                                                       light_positions_or_vectors[i].w * vertex_worldspace;                                             
                        vec3 L = normalize( surface_to_light_vector );
                        vec3 light_direction_vector = normalize( -light_rotations[i]);
                        float angle = dot(L, light_direction_vector); 
                        float penumbra = 0.0045;

                        if (angle >= limit_angles[i]) {
                          float distance_to_light = length( surface_to_light_vector );
                          vec3 H = normalize( L + E );
                          float diffuse  =      max( dot( N, L ), 0.0 );
                          float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                          float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                        
                          vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                                    + light_colors[i].xyz * specularity * specular;
                          result += attenuation * light_contribution;
                        }
                        else if (angle + penumbra >= limit_angles[i]) {
                          float penumbra_factor = (limit_angles[i] - angle) / penumbra;
                          float distance_to_light = length( surface_to_light_vector );
                          vec3 H = normalize( L + E );
                          float diffuse  =      max( dot( N, L ), 0.0 );
                          float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                          float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                        
                          vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                                    + light_colors[i].xyz * specularity * specular;
                          result += (attenuation * light_contribution) * (1.0 - penumbra_factor);
                        }
                      }
                    return result;
                  } `
      );
    }

    vertex_glsl_code() {
      // ********* VERTEX SHADER *********
      return (
        this.shared_glsl_code() +
        `
                attribute vec3 position, normal;                            
                
                uniform mat4 model_transform;
                uniform mat4 projection_camera_model_transform;
        
                void main(){                                                                   
                    gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                    N = normalize( mat3( model_transform ) * normal / squared_scale);
                    vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
                  } `
      );
    }

    fragment_glsl_code() {
      // ********* FRAGMENT SHADER *********
      // A fragment is a pixel that's overlapped by the current triangle.
      // Fragments affect the final image or get discarded due to depth.
      return (
        this.shared_glsl_code() +
        `
                void main(){                                                           
                    gl_FragColor = vec4( shape_color.xyz * ambient, shape_color.w );
                    gl_FragColor.xyz += phong_model_lights( normalize( N ), vertex_worldspace );
                  } `
      );
    }
    

    send_material(gl, gpu, material) {
      // send_material(): Send the desired shape-wide material qualities to the
      // graphics card, where they will tweak the Phong lighting formula.
      gl.uniform4fv(gpu.shape_color, material.color);
      gl.uniform1f(gpu.ambient, material.ambient);
      gl.uniform1f(gpu.diffusivity, material.diffusivity);
      gl.uniform1f(gpu.specularity, material.specularity);
      gl.uniform1f(gpu.smoothness, material.smoothness);
    }

    send_gpu_state(gl, gpu, gpu_state, model_transform) {
      // send_gpu_state():  Send the state of our whole drawing context to the GPU.
      const O = vec4(0, 0, 0, 1),
        camera_center = gpu_state.camera_transform.times(O).to3();
      gl.uniform3fv(gpu.camera_center, camera_center);
      // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
      const squared_scale = model_transform
        .reduce((acc, r) => {
          return acc.plus(vec4(...r).times_pairwise(r));
        }, vec4(0, 0, 0, 0))
        .to3();
      gl.uniform3fv(gpu.squared_scale, squared_scale);
      // Send the current matrices to the shader.  Go ahead and pre-compute
      // the products we'll need of the of the three special matrices and just
      // cache and send those.  They will be the same throughout this draw
      // call, and thus across each instance of the vertex shader.
      // Transpose them since the GPU expects matrices as column-major arrays.
      const PCM = gpu_state.projection_transform
        .times(gpu_state.camera_inverse)
        .times(model_transform);
      gl.uniformMatrix4fv(
        gpu.model_transform,
        false,
        Matrix.flatten_2D_to_1D(model_transform.transposed())
      );
      gl.uniformMatrix4fv(
        gpu.projection_camera_model_transform,
        false,
        Matrix.flatten_2D_to_1D(PCM.transposed())
      );

      // Omitting lights will show only the material color, scaled by the ambient term:
      if (!gpu_state.lights.length) return;

      const light_positions_flattened = [],
        light_colors_flattened = [];
      for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
        light_positions_flattened.push(
          gpu_state.lights[Math.floor(i / 4)].position[i % 4]
        );
        light_colors_flattened.push(
          gpu_state.lights[Math.floor(i / 4)].color[i % 4]
        );
      }
      const light_rotations_flattened = [];
      for (let i = 0; i < 3 * gpu_state.lights.length; i++) {
        light_rotations_flattened.push(
          gpu_state.lights[Math.floor(i / 3)].rotation[i % 3]
        );
      }
      gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
      gl.uniform3fv(gpu.light_rotations, light_rotations_flattened);
      gl.uniform4fv(gpu.light_colors, light_colors_flattened);
      gl.uniform1fv(
        gpu.light_attenuation_factors,
        gpu_state.lights.map((l) => l.attenuation)
      );
      gl.uniform1fv(
        gpu.limit_angles,
        gpu_state.lights.map((l) => l.limit_angle)
      );
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
      // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
      // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
      // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
      // program (which we call the "Program_State").  Send both a material and a program state to the shaders
      // within this function, one data field at a time, to fully initialize the shader for a draw.

      // Fill in any missing fields in the Material object with custom defaults for this shader:
      const defaults = {
        color: color(0, 0, 0, 1),
        ambient: 0,
        diffusivity: 0.8,
        specularity: 0.8,
        smoothness: 40,
      };
      material = Object.assign({}, defaults, material);

      this.send_material(context, gpu_addresses, material);
      this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
    }
  });


  const Shadow_Spotlight_Shader =
  (defs.Shadow_Spotlight_Shader = class Shadow_SpotLight_Shader extends Shader {
    constructor(num_lights = 1) {
      super();
      this.num_lights = num_lights;
    }

    shared_glsl_code() {
      // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
      return (
        ` precision mediump float;
                const int N_LIGHTS = ` +
        this.num_lights +
        `;
                uniform float ambient, diffusivity, specularity, smoothness;
                uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
                uniform vec3 light_rotations[N_LIGHTS];
                uniform float light_attenuation_factors[N_LIGHTS], limit_angles[N_LIGHTS];
                uniform vec4 shape_color;
                uniform vec3 squared_scale, camera_center;
        
                varying vec3 N, vertex_worldspace;
                vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace, out vec3 light_diffuse_contribution, out vec3 light_specular_contribution){                                        
                    // phong_model_lights():  Add up the lights' contributions.
                    vec3 E = normalize( camera_center - vertex_worldspace );
                    vec3 result = vec3( 0.0 );
                    light_diffuse_contribution = vec3( 0.0 );
                    light_specular_contribution = vec3( 0.0 );
                    for(int i = 0; i < N_LIGHTS; i++){
                        vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                                                       light_positions_or_vectors[i].w * vertex_worldspace;                                             
                        vec3 L = normalize( surface_to_light_vector );
                        vec3 light_direction_vector = normalize( -light_rotations[i]);
                        float angle = dot(L, light_direction_vector); 
                        float penumbra = 0.0045;

                        if (angle >= limit_angles[i]) {
                          float distance_to_light = length( surface_to_light_vector );
                          vec3 H = normalize( L + E );
                          float diffuse  =      max( dot( N, L ), 0.0 );
                          float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                          float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                        
                          vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                                    + light_colors[i].xyz * specularity * specular;
                          light_diffuse_contribution += attenuation * shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse;
                          light_specular_contribution += attenuation * shape_color.xyz * specularity * specular;
                          result += attenuation * light_contribution;
                        }
                        else if (angle + penumbra >= limit_angles[i]) {
                          float penumbra_factor = (limit_angles[i] - angle) / penumbra;
                          float distance_to_light = length( surface_to_light_vector );
                          vec3 H = normalize( L + E );
                          float diffuse  =      max( dot( N, L ), 0.0 );
                          float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                          float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                        
                          vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                                    + light_colors[i].xyz * specularity * specular;

                          light_diffuse_contribution += attenuation * shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse;
                          light_specular_contribution += attenuation * shape_color.xyz * specularity * specular;
                          result += (attenuation * light_contribution) * (1.0 - penumbra_factor);
                        }
                      }
                    return result;
                  } `
      );
    }

    vertex_glsl_code() {
      // ********* VERTEX SHADER *********
      return (
        this.shared_glsl_code() +
        `
                varying vec2 f_tex_coord;
                attribute vec3 position, normal;                            
                // Position is expressed in object coordinates.
                attribute vec2 texture_coord;
                
                uniform mat4 model_transform;
                uniform mat4 projection_camera_model_transform;
        
                void main(){                                                                   
                    // The vertex's final resting place (in NDCS):
                    gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                    // The final normal vector in screen space.
                    N = normalize( mat3( model_transform ) * normal / squared_scale);
                    vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
                    // Turn the per-vertex texture coordinate into an interpolated variable.
                    f_tex_coord = texture_coord;
                  } `
      );
    }

    fragment_glsl_code() {
      // ********* FRAGMENT SHADER *********
      // A fragment is a pixel that's overlapped by the current triangle.
      // Fragments affect the final image or get discarded due to depth.
      return (
        this.shared_glsl_code() +
        `
                varying vec2 f_tex_coord;
                uniform sampler2D texture;
                uniform sampler2D light_depth_texture;
                uniform mat4 light_view_mat;
                uniform mat4 light_proj_mat;
                uniform float animation_time;
                uniform float light_depth_bias;
                uniform bool use_texture;
                uniform bool draw_shadow;
                uniform float light_texture_size;
                
                float PCF_shadow(vec2 center, float projected_depth) {
                    float shadow = 0.0;
                    float texel_size = 1.0 / light_texture_size;
                    for(int x = -1; x <= 1; ++x)
                    {
                        for(int y = -1; y <= 1; ++y)
                        {
                            float light_depth_value = texture2D(light_depth_texture, center + vec2(x, y) * texel_size).r; 
                            shadow += projected_depth >= light_depth_value + light_depth_bias ? 1.0 : 0.0;        
                        }    
                    }
                    shadow /= 9.0;
                    return shadow;
                }
                
                void main(){
                    // Sample the texture image in the correct place:
                    vec4 tex_color = texture2D( texture, f_tex_coord );
                    if (!use_texture)
                        tex_color = vec4(0, 0, 0, 1);
                    if( tex_color.w < .01 ) discard;
                    
                    // Compute an initial (ambient) color:
                    gl_FragColor = vec4( ( tex_color.xyz + shape_color.xyz ) * ambient, shape_color.w * tex_color.w ); 
                    
                    // Compute the final color with contributions from lights:
                    vec3 diffuse, specular;
                    vec3 other_than_ambient = phong_model_lights( normalize( N ), vertex_worldspace, diffuse, specular );
                    
                    // Deal with shadow:
                    if (draw_shadow) {
                        vec4 light_tex_coord = (light_proj_mat * light_view_mat * vec4(vertex_worldspace, 1.0));
                        // convert NDCS from light's POV to light depth texture coordinates
                        light_tex_coord.xyz /= light_tex_coord.w; 
                        light_tex_coord.xyz *= 0.5;
                        light_tex_coord.xyz += 0.5;
                        float light_depth_value = texture2D( light_depth_texture, light_tex_coord.xy ).r;
                        float projected_depth = light_tex_coord.z;
                        
                        bool inRange =
                            light_tex_coord.x >= 0.0 &&
                            light_tex_coord.x <= 1.0 &&
                            light_tex_coord.y >= 0.0 &&
                            light_tex_coord.y <= 1.0;
                              
                        float shadowness = PCF_shadow(light_tex_coord.xy, projected_depth);
                        
                        if (inRange && shadowness > 0.3) {
                            diffuse *= 0.2 + 0.8 * (1.0 - shadowness);
                            specular *= 1.0 - shadowness;
                        }
                    }
                    
                    gl_FragColor.xyz += diffuse + specular;
                } `
      );
    }
    

    send_material(gl, gpu, material) {
      // send_material(): Send the desired shape-wide material qualities to the
      // graphics card, where they will tweak the Phong lighting formula.
      gl.uniform4fv(gpu.shape_color, material.color);
      gl.uniform1f(gpu.ambient, material.ambient);
      gl.uniform1f(gpu.diffusivity, material.diffusivity);
      gl.uniform1f(gpu.specularity, material.specularity);
      gl.uniform1f(gpu.smoothness, material.smoothness);
    }

    send_gpu_state(gl, gpu, gpu_state, model_transform) {
      // send_gpu_state():  Send the state of our whole drawing context to the GPU.
      const O = vec4(0, 0, 0, 1),
        camera_center = gpu_state.camera_transform.times(O).to3();
      gl.uniform3fv(gpu.camera_center, camera_center);
      // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
      const squared_scale = model_transform
        .reduce((acc, r) => {
          return acc.plus(vec4(...r).times_pairwise(r));
        }, vec4(0, 0, 0, 0))
        .to3();
      gl.uniform3fv(gpu.squared_scale, squared_scale);
      // Send the current matrices to the shader.  Go ahead and pre-compute
      // the products we'll need of the of the three special matrices and just
      // cache and send those.  They will be the same throughout this draw
      // call, and thus across each instance of the vertex shader.
      // Transpose them since the GPU expects matrices as column-major arrays.
      const PCM = gpu_state.projection_transform
        .times(gpu_state.camera_inverse)
        .times(model_transform);
      gl.uniformMatrix4fv(
        gpu.model_transform,
        false,
        Matrix.flatten_2D_to_1D(model_transform.transposed())
      );
      gl.uniformMatrix4fv(
        gpu.projection_camera_model_transform,
        false,
        Matrix.flatten_2D_to_1D(PCM.transposed())
      );

      // Omitting lights will show only the material color, scaled by the ambient term:
      if (!gpu_state.lights.length) return;

      const light_positions_flattened = [],
        light_colors_flattened = [];
      for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
        light_positions_flattened.push(
          gpu_state.lights[Math.floor(i / 4)].position[i % 4]
        );
        light_colors_flattened.push(
          gpu_state.lights[Math.floor(i / 4)].color[i % 4]
        );
      }
      const light_rotations_flattened = [];
      for (let i = 0; i < 3 * gpu_state.lights.length; i++) {
        light_rotations_flattened.push(
          gpu_state.lights[Math.floor(i / 3)].rotation[i % 3]
        );
      }
      gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
      gl.uniform3fv(gpu.light_rotations, light_rotations_flattened);
      gl.uniform4fv(gpu.light_colors, light_colors_flattened);
      gl.uniform1fv(
        gpu.light_attenuation_factors,
        gpu_state.lights.map((l) => l.attenuation)
      );
      gl.uniform1fv(
        gpu.limit_angles,
        gpu_state.lights.map((l) => l.limit_angle)
      );
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
      // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
      // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
      // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
      // program (which we call the "Program_State").  Send both a material and a program state to the shaders
      // within this function, one data field at a time, to fully initialize the shader for a draw.

      // Fill in any missing fields in the Material object with custom defaults for this shader:
      const defaults = {
        color: color(0, 0, 0, 1),
        ambient: 0,
        diffusivity: 0.8,
        specularity: 0.8,
        smoothness: 40,
      };
      material = Object.assign({}, defaults, material);

      this.send_material(context, gpu_addresses, material);
      this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
    }
  });
