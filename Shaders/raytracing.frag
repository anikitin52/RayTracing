#version 430
out vec4 FragColor;
in vec3 gPosition;

#define EPSILON = 0.001 
#define BIG = 1000000.0 
const int DIFFUSE = 1; 
const int REFLECTION = 2; 
const int REFRACTION = 3; 


 
struct SSphere 
{ 
    vec3 Center; 
    float Radius; 
    int MaterialIdx; 
}; 
struct STriangle 
{ 
    vec3 v1; 
    vec3 v2; 
    vec3 v3; 
    int MaterialIdx; 
}; 

STriangle triangles[10]; 
SSphere spheres[2]; 

struct SCamera 
{ 
    vec3 Position; 
    vec3 View; 
    vec3 Up; 
    vec3 Side; 
    vec2 Scale; 
}; 

struct SRay 
{ 
    vec3 Origin; 
    vec3 Direction; 
};

SRay GenerateRay(SCamera uCamera) 
{ 
    vec2 coords = gPosition.xy * uCamera.Scale; 
    vec3 direction = uCamera.View + uCamera.Side * coords.x + uCamera.Up * coords.y; 
    return SRay(uCamera.Position, normalize(direction)); 
} 

SCamera initializeDefaultCamera() 
{ 
    SCamera uCamera;
    uCamera.Position = vec3(0.0, 0.0, -8.0); 
    uCamera.View = vec3(0.0, 0.0, 1.0); 
    uCamera.Up = vec3(0.0, 1.0, 0.0); 
    uCamera.Side = vec3(1.0, 0.0, 0.0); 
    uCamera.Scale = vec2(1.0); 
    return uCamera;
} 

void main(void) 
{ 
    SCamera uCamera = initializeDefaultCamera(); 
    SRay ray = GenerateRay(uCamera); 
    FragColor = vec4(abs(ray.Direction.xy), 0.0, 1.0); 
}