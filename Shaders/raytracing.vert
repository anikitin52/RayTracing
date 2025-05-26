#version 430
in vec3 vPosition;
out vec3 gPosition;

void main() {
    gl_Position = vec4(vPosition, 1.0);
    gPosition = vPosition;
}