#version 430
out vec4 FragColor;
in vec3 gPosition;

#define EPSILON = 0.001 
#define BIG = 1000000.0 
const int DIFFUSE = 1; 
const int REFLECTION = 2; 
const int REFRACTION = 3; 


 
struct STriangle {
    vec3 v1, v2, v3;
    int MaterialIdx;
};

struct SSphere {
    vec3 Center;
    float Radius;
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

void initializeDefaultScene() 
{
    triangles[0].v1 = vec3(-5.0,-5.0,-5.0); 
    triangles[0].v2 = vec3(-5.0, 5.0, 5.0); 
    triangles[0].v3 = vec3(-5.0, 5.0,-5.0); 
    triangles[0].MaterialIdx = 0; 

    triangles[1].v1 = vec3(-5.0,-5.0,-5.0); 
    triangles[1].v2 = vec3(-5.0,-5.0, 5.0); 
    triangles[1].v3 = vec3(-5.0, 5.0, 5.0); 
    triangles[1].MaterialIdx = 0; 

    triangles[2].v1 = vec3(-5.0,-5.0, 5.0); 
    triangles[2].v2 = vec3(5.0,-5.0, 5.0); 
    triangles[2].v3 = vec3(-5.0, 5.0, 5.0); 
    triangles[2].MaterialIdx = 0; 

    triangles[3].v1 = vec3(5.0, 5.0, 5.0); 
    triangles[3].v2 = vec3(-5.0, 5.0, 5.0); 
    triangles[3].v3 = vec3(5.0,-5.0, 5.0); 
    triangles[3].MaterialIdx = 0; 

    triangles[4].v1 = vec3(5.0,-5.0,-5.0); 
    triangles[4].v2 = vec3(5.0, 5.0,-5.0); 
    triangles[4].v3 = vec3(5.0, 5.0, 5.0); 
    triangles[4].MaterialIdx = 0; 

    triangles[5].v1 = vec3(5.0,-5.0,-5.0); 
    triangles[5].v2 = vec3(5.0, 5.0, 5.0); 
    triangles[5].v3 = vec3(5.0,-5.0, 5.0); 
    triangles[5].MaterialIdx = 0; 

    triangles[6].v1 = vec3(-5.0,-5.0,-5.0); 
    triangles[6].v2 = vec3(5.0,-5.0,-5.0); 
    triangles[6].v3 = vec3(5.0, 5.0,-5.0); 
    triangles[6].MaterialIdx = 0; 

    triangles[7].v1 = vec3(-5.0,-5.0,-5.0); 
    triangles[7].v2 = vec3(5.0, 5.0,-5.0); 
    triangles[7].v3 = vec3(-5.0, 5.0,-5.0); 
    triangles[7].MaterialIdx = 0; 

    triangles[8].v1 = vec3(-5.0,5.0,-5.0); 
    triangles[8].v2 = vec3(5.0,5.0,-5.0); 
    triangles[8].v3 = vec3(5.0,5.0,5.0); 
    triangles[8].MaterialIdx = 0; 

    triangles[9].v1 = vec3(-5.0,5.0,-5.0); 
    triangles[9].v2 = vec3(5.0,5.0,5.0); 
    triangles[9].v3 = vec3(-5.0,5.0,5.0); 
    triangles[9].MaterialIdx = 0; 

    spheres[0].Center = vec3(-1.0,-1.0,-2.0); 
    spheres[0].Radius = 2.0; 
    spheres[0].MaterialIdx = 0; 

    spheres[1].Center = vec3(2.0,1.0,2.0); 
    spheres[1].Radius = 1.0; 
    spheres[1].MaterialIdx = 0; 
}

void main(void) 
{ 
    SCamera uCamera = initializeDefaultCamera(); 
    SRay ray = GenerateRay(uCamera); 
    initializeDefaultScene();
    FragColor = vec4(abs(ray.Direction.xy), 0.0, 1.0); 
}

