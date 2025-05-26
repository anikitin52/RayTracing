#version 430
out vec4 FragColor;
in vec3 gPosition;

void main() {
    FragColor = vec4(abs(gPosition.xy), 0.0, 1.0);
}