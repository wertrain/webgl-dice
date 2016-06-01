attribute vec3 position;
attribute vec3 normal;
attribute vec4 color;
attribute vec2 textureCoord;
uniform   mat4 mvpMatrix;
uniform   mat4 invMatrix;
uniform   vec3 lightDirection;
uniform   vec4 ambientColor;
varying   vec4 vColor;
varying   vec2 vTextureCoord;

void main(void){
    vec3  invLight = normalize(invMatrix * vec4(lightDirection, 0.0)).xyz;
    float diffuse  = clamp(dot(normal, invLight), 0.01, 1.0);
    vColor         = color * vec4(vec3(diffuse), 1.0) + ambientColor;
    vTextureCoord = textureCoord;
    gl_Position   = mvpMatrix * vec4(position, 1.0);
}
