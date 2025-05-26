#version 430

out vec4 FragColor;
in vec3 glPosition;

#define EPSILON 0.001
#define BIG 1000000.0
#define MAX_STACK_DEPTH 5

const int DIFFUSE_REFLECTION = 1;
const int MIRROR_REFLECTION = 2;

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

struct SLight {
    vec3 Position;
};

struct STracingRay {
    SRay ray;
    float contribution;
    int depth;
};

STriangle triangles[10];
SSphere spheres[2];
SMaterial materials[6];
SLight light;

SCamera initializeDefaultCamera() {
    SCamera cam;
    cam.Position = vec3(0.0, 0.0, -8.0);
    cam.View = vec3(0.0, 0.0, 1.0);
    cam.Up = vec3(0.0, 1.0, 0.0);
    cam.Side = vec3(1.0, 0.0, 0.0);
    cam.Scale = vec2(1.0);
    return cam;
}

SRay GenerateRay(SCamera cam) {
    vec2 coords = glPosition.xy * cam.Scale;
    vec3 direction = cam.View + cam.Side * coords.x + cam.Up * coords.y;
    return SRay(cam.Position, normalize(direction));
}

void initializeDefaultScene() {
    triangles[0].v1 = vec3(-5.0,-5.0,-5.0);
    triangles[0].v2 = vec3(-5.0,5.0,5.0);
    triangles[0].v3 = vec3(-5.0,5.0,-5.0);
    triangles[0].MaterialIdx = 0;

    triangles[1].v1 = vec3(-5.0,-5.0,-5.0);
    triangles[1].v2 = vec3(-5.0,-5.0,5.0);
    triangles[1].v3 = vec3(-5.0,5.0,5.0);
    triangles[1].MaterialIdx = 0;

    spheres[0].Center = vec3(-1.0,-1.0,-2.0);
    spheres[0].Radius = 2.0;
    spheres[0].MaterialIdx = 0;

    spheres[1].Center = vec3(2.0,1.0,2.0);
    spheres[1].Radius = 1.0;
    spheres[1].MaterialIdx = 1;
}

void initializeDefaultLightMaterials() {
    light.Position = vec3(0.0, 5.0, -4.0);

    materials[0].Color = vec3(1.0, 0.0, 0.0);
    materials[0].LightCoeffs = vec4(0.4, 0.9, 0.0, 512.0);
    materials[0].ReflectionCoef = 0.5;
    materials[0].RefractionCoef = 1.0;
    materials[0].MaterialType = DIFFUSE_REFLECTION;

    materials[1].Color = vec3(0.0, 0.0, 1.0);
    materials[1].LightCoeffs = vec4(0.4, 0.9, 0.0, 512.0);
    materials[1].ReflectionCoef = 0.8;
    materials[1].RefractionCoef = 1.0;
    materials[1].MaterialType = MIRROR_REFLECTION;
}

bool IntersectSphere(SSphere sphere, SRay ray, float start, float final, out float time) {
    vec3 L = ray.Origin - sphere.Center;
    float A = dot(ray.Direction, ray.Direction);
    float B = dot(ray.Direction, L);
    float C = dot(L, L) - sphere.Radius * sphere.Radius;
    float D = B * B - A * C;
    if (D > 0.0) {
        D = sqrt(D);
        float t1 = (-B - D) / A;
        float t2 = (-B + D) / A;
        if (t1 < 0 && t2 < 0) return false;
        time = (min(t1, t2) < 0) ? max(t1, t2) : min(t1, t2);
        return true;
    }
    return false;
}

bool IntersectTriangle(SRay ray, vec3 v1, vec3 v2, vec3 v3, out float time) {
    vec3 A = v2 - v1;
    vec3 B = v3 - v1;
    vec3 N = cross(A, B);
    float NdotRay = dot(N, ray.Direction);
    if (abs(NdotRay) < 0.001) return false;
    float d = dot(N, v1);
    float t = -(dot(N, ray.Origin) - d) / NdotRay;
    if (t < 0.0) return false;
    vec3 P = ray.Origin + t * ray.Direction;

    vec3 edge, C;
    edge = v2 - v1; C = cross(edge, P - v1); if (dot(N, C) < 0.0) return false;
    edge = v3 - v2; C = cross(edge, P - v2); if (dot(N, C) < 0.0) return false;
    edge = v1 - v3; C = cross(edge, P - v3); if (dot(N, C) < 0.0) return false;

    time = t;
    return true;
}

bool Raytrace(SRay ray, float start, float final, inout SIntersection intersect) {
    bool hit = false;
    float t;
    intersect.Time = final;
    for (int i = 0; i < 2; i++) {
        if (IntersectSphere(spheres[i], ray, start, final, t) && t < intersect.Time) {
            intersect.Time = t;
            intersect.Point = ray.Origin + ray.Direction * t;
            intersect.Normal = normalize(intersect.Point - spheres[i].Center);
            int idx = spheres[i].MaterialIdx;
            intersect.Color = materials[idx].Color;
            intersect.LightCoeffs = materials[idx].LightCoeffs;
            intersect.ReflectionCoef = materials[idx].ReflectionCoef;
            intersect.RefractionCoef = materials[idx].RefractionCoef;
            intersect.MaterialType = materials[idx].MaterialType;
            hit = true;
        }
    }

    for (int i = 0; i < 10; i++) {
        if (IntersectTriangle(ray, triangles[i].v1, triangles[i].v2, triangles[i].v3, t) && t < intersect.Time) {
            intersect.Time = t;
            intersect.Point = ray.Origin + ray.Direction * t;
            intersect.Normal = normalize(cross(triangles[i].v2 - triangles[i].v1, triangles[i].v3 - triangles[i].v1));
            int idx = triangles[i].MaterialIdx;
            intersect.Color = materials[idx].Color;
            intersect.LightCoeffs = materials[idx].LightCoeffs;
            intersect.ReflectionCoef = materials[idx].ReflectionCoef;
            intersect.RefractionCoef = materials[idx].RefractionCoef;
            intersect.MaterialType = materials[idx].MaterialType;
            hit = true;
        }
    }
    return hit;
}

float Shadow(SLight light, SIntersection isect) {
    vec3 dir = normalize(light.Position - isect.Point);
    float dist = distance(light.Position, isect.Point);
    SRay ray = SRay(isect.Point + dir * EPSILON, dir);
    SIntersection tmp;
    tmp.Time = BIG;
    return Raytrace(ray, 0.0, dist, tmp) ? 0.0 : 1.0;
}

vec3 Phong(SIntersection isect, SLight light, SCamera cam, float shadow) {
    vec3 L = normalize(light.Position - isect.Point);
    float diff = max(dot(isect.Normal, L), 0.0);
    vec3 V = normalize(cam.Position - isect.Point);
    vec3 R = reflect(-V, isect.Normal);
    float spec = pow(max(dot(R, L), 0.0), isect.LightCoeffs.w);
    return isect.LightCoeffs.x * isect.Color +
           isect.LightCoeffs.y * diff * isect.Color * shadow +
           isect.LightCoeffs.z * spec * vec3(1.0) * shadow;
}

void main(void) {
    SCamera cam = initializeDefaultCamera();
    initializeDefaultScene();
    initializeDefaultLightMaterials();

    SRay primaryRay = GenerateRay(cam);
    STracingRay rayStack[MAX_STACK_DEPTH];
    int stackPtr = 0;
    rayStack[stackPtr] = STracingRay(primaryRay, 1.0, 0);

    vec3 resultColor = vec3(0.0);
    while (stackPtr >= 0) {
        STracingRay curr = rayStack[stackPtr--];
        if (curr.depth > MAX_STACK_DEPTH) continue;

        SIntersection hit;
        hit.Time = BIG;

        if (Raytrace(curr.ray, 0.0, BIG, hit)) {
            if (hit.MaterialType == DIFFUSE_REFLECTION) {
                float shadowing = Shadow(light, hit);
                resultColor += curr.contribution * Phong(hit, light, cam, shadowing);
            } else if (hit.MaterialType == MIRROR_REFLECTION) {
                if (hit.ReflectionCoef < 1.0) {
                    float direct = curr.contribution * (1.0 - hit.ReflectionCoef);
                    float shadowing = Shadow(light, hit);
                    resultColor += direct * Phong(hit, light, cam, shadowing);
                }
                vec3 reflDir = reflect(curr.ray.Direction, hit.Normal);
                SRay reflRay = SRay(hit.Point + reflDir * EPSILON, reflDir);
                if (stackPtr < MAX_STACK_DEPTH - 1) {
                    rayStack[++stackPtr] = STracingRay(reflRay, curr.contribution * hit.ReflectionCoef, curr.depth + 1);
                }
            }
        }
    }

    FragColor = vec4(clamp(resultColor, 0.0, 1.0), 1.0);
}
