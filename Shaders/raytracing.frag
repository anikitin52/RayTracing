#version 430

out vec4 FragColor;
in vec3 gPosition;

#define EPSILON 0.001
#define BIG 1000000.0
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

struct SCamera {
    vec3 Position;
    vec3 View;
    vec3 Up;
    vec3 Side;
    vec2 Scale;
};

struct SRay {
    vec3 Origin;
    vec3 Direction;
};

struct SIntersection {
    float Time;
    vec3 Point;
    vec3 Normal;
    vec3 Color;
    vec4 LightCoeffs;
    float ReflectionCoef;
    float RefractionCoef;
    int MaterialType;
};

struct SMaterial {
    vec3 Color;
    vec4 LightCoeffs;
    float ReflectionCoef;
    float RefractionCoef;
    int MaterialType;
};

STriangle triangles[10];
SSphere spheres[2];
SMaterial materials[2];

SRay GenerateRay(SCamera uCamera) {
    vec2 coords = gPosition.xy * uCamera.Scale;
    vec3 direction = uCamera.View + uCamera.Side * coords.x + uCamera.Up * coords.y;
    return SRay(uCamera.Position, normalize(direction));
}

SCamera initializeDefaultCamera() {
    SCamera uCamera;
    uCamera.Position = vec3(0.0, 0.0, -8.0);
    uCamera.View = vec3(0.0, 0.0, 1.0);
    uCamera.Up = vec3(0.0, 1.0, 0.0);
    uCamera.Side = vec3(1.0, 0.0, 0.0);
    uCamera.Scale = vec2(1.0);
    return uCamera;
}

bool IntersectSphere(SSphere sphere, SRay ray, float start, float final, out float time) {
    ray.Origin -= sphere.Center;
    float A = dot(ray.Direction, ray.Direction);
    float B = dot(ray.Direction, ray.Origin);
    float C = dot(ray.Origin, ray.Origin) - sphere.Radius * sphere.Radius;
    float D = B * B - A * C;
    if(D > 0.0) {
        D = sqrt(D);
        float t1 = (-B - D) / A;
        float t2 = (-B + D) / A;
        if(t1 < 0 && t2 < 0)
            return false;
            
        if(min(t1, t2) < 0) {
            time = max(t1, t2);
            return true;
        }
        time = min(t1, t2);
        return true;
    }
    return false;
}

bool IntersectTriangle(SRay ray, vec3 v1, vec3 v2, vec3 v3, out float time) {
    time = -1;
    vec3 A = v2 - v1;
    vec3 B = v3 - v1;
    vec3 N = cross(A, B);
    float NdotRayDirection = dot(N, ray.Direction);
    if(abs(NdotRayDirection) < 0.001)
        return false;
    float d = dot(N, v1);
    float t = -(dot(N, ray.Origin) - d) / NdotRayDirection;
    if(t < 0)
        return false;
    vec3 P = ray.Origin + t * ray.Direction;
    vec3 C;
    vec3 edge1 = v2 - v1;
    vec3 VP1 = P - v1;
    C = cross(edge1, VP1);
    if(dot(N, C) < 0)
        return false;
    vec3 edge2 = v3 - v2;
    vec3 VP2 = P - v2;
    C = cross(edge2, VP2);
    if(dot(N, C) < 0)
        return false;
    vec3 edge3 = v1 - v3;
    vec3 VP3 = P - v3;
    C = cross(edge3, VP3);
    if(dot(N, C) < 0)
        return false;
    time = t;
    return true;
}

bool Raytrace(SRay ray, float start, float final, inout SIntersection intersect) {
    bool result = false;
    float test = start;
    intersect.Time = final;

    for(int i = 0; i < 2; i++) {
        SSphere sphere = spheres[i];
        if(IntersectSphere(sphere, ray, start, final, test) && test < intersect.Time) {
            intersect.Time = test;
            intersect.Point = ray.Origin + ray.Direction * test;
            intersect.Normal = normalize(intersect.Point - sphere.Center);
            intersect.Color = materials[sphere.MaterialIdx].Color;
            intersect.LightCoeffs = materials[sphere.MaterialIdx].LightCoeffs;
            intersect.ReflectionCoef = materials[sphere.MaterialIdx].ReflectionCoef;
            intersect.RefractionCoef = materials[sphere.MaterialIdx].RefractionCoef;
            intersect.MaterialType = materials[sphere.MaterialIdx].MaterialType;
            result = true;
        }
    }

    for(int i = 0; i < 10; i++) {
        STriangle triangle = triangles[i];
        if(IntersectTriangle(ray, triangle.v1, triangle.v2, triangle.v3, test) && test < intersect.Time) {
            intersect.Time = test;
            intersect.Point = ray.Origin + ray.Direction * test;
            intersect.Normal = normalize(cross(triangle.v2 - triangle.v1, triangle.v3 - triangle.v1));
            intersect.Color = materials[triangle.MaterialIdx].Color;
            intersect.LightCoeffs = materials[triangle.MaterialIdx].LightCoeffs;
            intersect.ReflectionCoef = materials[triangle.MaterialIdx].ReflectionCoef;
            intersect.RefractionCoef = materials[triangle.MaterialIdx].RefractionCoef;
            intersect.MaterialType = materials[triangle.MaterialIdx].MaterialType;
            result = true;
        }
    }
    return result;
}

void initializeDefaultScene() {
    triangles[0].v1 = vec3(-5.0,-5.0,-5.0);
    triangles[0].v2 = vec3(-5.0, 5.0, 5.0);
    triangles[0].v3 = vec3(-5.0, 5.0,-5.0);
    triangles[0].MaterialIdx = 0;


    spheres[0].Center = vec3(-1.0,-1.0,-2.0);
    spheres[0].Radius = 2.0;
    spheres[0].MaterialIdx = 0;

    spheres[1].Center = vec3(2.0,1.0,2.0);
    spheres[1].Radius = 1.0;
    spheres[1].MaterialIdx = 0;

    materials[0].Color = vec3(1.0, 0.0, 0.0);
    materials[0].LightCoeffs = vec4(0.4, 0.9, 0.0, 512.0);
    materials[0].ReflectionCoef = 0.5;
    materials[0].RefractionCoef = 1.0;
    materials[0].MaterialType = DIFFUSE;

    materials[1].Color = vec3(0.0, 1.0, 0.0); 
    materials[1].LightCoeffs = vec4(0.4, 0.9, 0.0, 512.0);
    materials[1].ReflectionCoef = 0.5;
    materials[1].RefractionCoef = 1.0;
    materials[1].MaterialType = DIFFUSE;
}

void main(void) {
    float start = 0;
    float final = BIG;

    SCamera uCamera = initializeDefaultCamera();
    SRay ray = GenerateRay(uCamera);
    SIntersection intersect;
    intersect.Time = BIG;
    vec3 resultColor = vec3(0,0,0);

    initializeDefaultScene();

    if(Raytrace(ray, start, final, intersect)) {
        resultColor = vec3(1,0,0);
    }

    FragColor = vec4(resultColor, 1.0);
}