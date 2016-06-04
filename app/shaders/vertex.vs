attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
attribute vec2 textureCoord;
uniform   mat4 mvpMatrix;
varying   vec3 vNormal;
varying   vec4 vColor;
varying   vec2 vTextureCoord;

void main(void){
    vNormal     = normal;
    vColor      = color;
    vTextureCoord = textureCoord;
    gl_Position = mvpMatrix * vec4(position, 1.0);
}