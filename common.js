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
