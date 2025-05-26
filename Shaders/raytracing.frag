#version 430

#define EPSILON 0.001
#define BIG 1000000.0

const int MATERIAL_DIFFUSE = 1;
const int MATERIAL_MIRROR = 2;
const int MATERIAL_REFRACTION = 3;

#define MAX_RAY_DEPTH 5
#define MAX_STACK_SIZE 128

out vec4 FragColor;
in vec3 glPosition;

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

struct SSphere {
    vec3 Center;
    float Radius;
    int MaterialIdx;
};

struct STriangle {
    vec3 v1;
    vec3 v2;
    vec3 v3;
    int MaterialIdx;
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

struct SLight {
    vec3 Position;
};

struct SMaterial {
    vec3 Color;
    vec4 LightCoeffs;
    float ReflectionCoef;
    float RefractionCoef;
    int MaterialType;
};

struct STracingRay {
    SRay ray;
    float contribution;
    int depth;
};

STriangle triangles[12];
SSphere spheres[2];
SLight light;
SMaterial materials[5];
SCamera uCamera;

STracingRay rayStack[MAX_STACK_SIZE];
int stackPtr;

void pushRay(STracingRay trRay) {
    if (stackPtr < MAX_STACK_SIZE && trRay.depth < MAX_RAY_DEPTH) {
        rayStack[stackPtr] = trRay;
        stackPtr++;
    }
}

STracingRay popRay() {
    stackPtr--;
    return rayStack[stackPtr];
}

bool isEmpty() {
    return stackPtr == 0;
}

bool Raytrace(SRay ray, float start, float final, inout SIntersection intersect);

void initializeDefaultScene() {
    triangles[0].v1 = vec3(-5.0,-5.0,-5.0);
    triangles[0].v2 = vec3(-5.0,5.0,5.0);
    triangles[0].v3 = vec3(-5.0,5.0,-5.0);
    triangles[0].MaterialIdx = 1;

    triangles[1].v1 = vec3(-5.0,-5.0,-5.0);
    triangles[1].v2 = vec3(-5.0,-5.0,5.0);
    triangles[1].v3 = vec3(-5.0,5.0,5.0);
    triangles[1].MaterialIdx = 1;

    triangles[2].v1 = vec3(-5.0,-5.0,5.0);
    triangles[2].v2 = vec3(5.0,-5.0,5.0);
    triangles[2].v3 = vec3(-5.0,5.0,5.0);
    triangles[2].MaterialIdx = 3;

    triangles[3].v1 = vec3(5.0,5.0,5.0);
    triangles[3].v2 = vec3(-5.0,5.0,5.0);
    triangles[3].v3 = vec3(5.0,-5.0,5.0);
    triangles[3].MaterialIdx = 3;

    triangles[4].v1 = vec3(-5.0,-5.0,5.0);
    triangles[4].v2 = vec3(5.0,-5.0,5.0);
    triangles[4].v3 = vec3(-5.0,-5.0,-5.0);
    triangles[4].MaterialIdx = 2;

    triangles[5].v1 = vec3(5.0,-5.0,-5.0);
    triangles[5].v2 = vec3(-5.0,-5.0,-5.0);
    triangles[5].v3 = vec3(5.0,-5.0,5.0);
    triangles[5].MaterialIdx = 2;

    triangles[6].v1 = vec3(5.0,-5.0,-5.0);
    triangles[6].v2 = vec3(5.0,5.0,5.0);
    triangles[6].v3 = vec3(5.0,5.0,-5.0);
    triangles[6].MaterialIdx = 0;

    triangles[7].v1 = vec3(5.0,-5.0,-5.0);
    triangles[7].v2 = vec3(5.0,-5.0,5.0);
    triangles[7].v3 = vec3(5.0,5.0,5.0);
    triangles[7].MaterialIdx = 0;

    triangles[8].v1 = vec3(-5.0,5.0,-5.0);
    triangles[8].v2 = vec3(5.0,5.0,-5.0);
    triangles[8].v3 = vec3(-5.0,5.0,5.0);
    triangles[8].MaterialIdx = 2;

    triangles[9].v1 = vec3(5.0,5.0,5.0);
    triangles[9].v2 = vec3(-5.0,5.0,5.0);
    triangles[9].v3 = vec3(5.0,5.0,-5.0);
    triangles[9].MaterialIdx = 2;

    spheres[0].Center = vec3(-1.0,-1.0,-2.0);
    spheres[0].Radius = 2.0;
    spheres[0].MaterialIdx = 4;

    spheres[1].Center = vec3(2.0,1.0,2.0);
    spheres[1].Radius = 1.0;
    spheres[1].MaterialIdx = 4;
}

void initializeDefaultLightMaterials() {
    light.Position = vec3(5.0, 2.0, -4.0);

    vec4 lightCoefs = vec4(0.4, 0.9, 0.0, 512.0);

    materials[0].Color = vec3(0.0, 1.0, 0.0);
    materials[0].LightCoeffs = lightCoefs;
    materials[0].ReflectionCoef = 0.0;
    materials[0].RefractionCoef = 1.0;
    materials[0].MaterialType = MATERIAL_DIFFUSE;

    materials[1].Color = vec3(1.0, 0.0, 0.0);
    materials[1].LightCoeffs = lightCoefs;
    materials[1].ReflectionCoef = 0.0;
    materials[1].RefractionCoef = 1.0;
    materials[1].MaterialType = MATERIAL_DIFFUSE;

    materials[2].Color = vec3(1.0);
    materials[2].LightCoeffs = lightCoefs;
    materials[2].ReflectionCoef = 0.0;
    materials[2].RefractionCoef = 1.0;
    materials[2].MaterialType = MATERIAL_DIFFUSE;

    materials[3].Color = vec3(0.0, 1.0, 1.0);
    materials[3].LightCoeffs = lightCoefs;
    materials[3].ReflectionCoef = 0.0;
    materials[3].RefractionCoef = 1.0;
    materials[3].MaterialType = MATERIAL_DIFFUSE;

    materials[4].Color = vec3(0.8);
    materials[4].LightCoeffs = lightCoefs;
    materials[4].ReflectionCoef = 0.3;
    materials[4].RefractionCoef = 1.5;
    materials[4].MaterialType = MATERIAL_REFRACTION;
}

bool IntersectSphere(SSphere sphere, SRay ray, float start, float final, out float time) {
    vec3 relativeOrigin = ray.Origin - sphere.Center;
    float A = dot(ray.Direction, ray.Direction);
    float B = dot(ray.Direction, relativeOrigin);
    float C = dot(relativeOrigin, relativeOrigin) - sphere.Radius * sphere.Radius;
    float D = B * B - A * C;
    if (D > 0.0) {
        D = sqrt(D);
        float t1 = (-B - D) / A;
        float t2 = (-B + D) / A;
        if (t1 > start && t1 < final) { time = t1; return true; }
        if (t2 > start && t2 < final) { time = t2; return true; }
    }
    return false;
}

bool IntersectTriangle(SRay ray, vec3 v1, vec3 v2, vec3 v3, out float time) {
    time = -1;
    vec3 A = v2 - v1;
    vec3 B = v3 - v1;
    vec3 N = cross(A, B);
    float NdotRay = dot(N, ray.Direction);
    if (abs(NdotRay) < EPSILON) return false;
    float d = dot(N, v1);
    float t = -(dot(N, ray.Origin) - d) / NdotRay;
    if (t < EPSILON) return false;
    vec3 P = ray.Origin + t * ray.Direction;
    vec3 edge1 = v2 - v1, VP1 = P - v1;
    if (dot(N, cross(edge1, VP1)) < 0) return false;
    vec3 edge2 = v3 - v2, VP2 = P - v2;
    if (dot(N, cross(edge2, VP2)) < 0) return false;
    vec3 edge3 = v1 - v3, VP3 = P - v3;
    if (dot(N, cross(edge3, VP3)) < 0) return false;
    time = t;
    return true;
}

vec3 Phong(SIntersection intersect, SLight currLight, float shadowing) {
    vec3 lightDir = normalize(currLight.Position - intersect.Point);
    float diffuse = max(dot(lightDir, intersect.Normal), 0.0);
    vec3 viewDir = normalize(uCamera.Position - intersect.Point);
    vec3 reflectDir = reflect(-viewDir, intersect.Normal);
    float specular = pow(max(dot(reflectDir, lightDir), 0.0), intersect.LightCoeffs.w);
    vec3 ambient = intersect.LightCoeffs.x * intersect.Color;
    vec3 direct = shadowing * (intersect.LightCoeffs.y * diffuse * intersect.Color + intersect.LightCoeffs.z * specular);
    return ambient + direct;
}

float Shadow(SLight currLight, SIntersection intersect) {
    vec3 dir = normalize(currLight.Position - intersect.Point);
    float dist = distance(currLight.Position, intersect.Point);
    SRay shadowRay = SRay(intersect.Point + dir * EPSILON, dir);
    SIntersection shadowIntersect;
    shadowIntersect.Time = BIG;
    return Raytrace(shadowRay, 0.0, dist, shadowIntersect) ? 0.0 : 1.0;
}

SRay GenerateRay(SCamera camera) {
    vec2 coords = glPosition.xy * camera.Scale;
    vec3 dir = camera.View + camera.Side * coords.x + camera.Up * coords.y;
    return SRay(camera.Position, normalize(dir));
}

SCamera initializeDefaultCamera() {
    SCamera cam;
    cam.Position = vec3(0.0, 0.0, -8.0);
    cam.View = vec3(0.0, 0.0, 1.0);
    cam.Up = vec3(0.0, 1.0, 0.0);
    cam.Side = vec3(1.0, 0.0, 0.0);
    cam.Scale = vec2(1.0);
    return cam;
}

bool Raytrace(SRay ray, float start, float final, inout SIntersection intersect) {
    bool hit = false;
    float t = start;
    intersect.Time = final;

    for (int i = 0; i < 2; i++) {
        if (IntersectSphere(spheres[i], ray, start, final, t) && t < intersect.Time) {
            intersect.Time = t;
            intersect.Point = ray.Origin + ray.Direction * t;
            intersect.Normal = normalize(intersect.Point - spheres[i].Center);
            SMaterial mat = materials[spheres[i].MaterialIdx];
            intersect.Color = mat.Color;
            intersect.LightCoeffs = mat.LightCoeffs;
            intersect.ReflectionCoef = mat.ReflectionCoef;
            intersect.RefractionCoef = mat.RefractionCoef;
            intersect.MaterialType = mat.MaterialType;
            hit = true;
        }
    }

    for (int i = 0; i < 10; i++) {
        if (IntersectTriangle(ray, triangles[i].v1, triangles[i].v2, triangles[i].v3, t) && t < intersect.Time) {
            intersect.Time = t;
            intersect.Point = ray.Origin + ray.Direction * t;
            intersect.Normal = normalize(cross(triangles[i].v1 - triangles[i].v2, triangles[i].v3 - triangles[i].v2));
            SMaterial mat = materials[triangles[i].MaterialIdx];
            intersect.Color = mat.Color;
            intersect.LightCoeffs = mat.LightCoeffs;
            intersect.ReflectionCoef = mat.ReflectionCoef;
            intersect.RefractionCoef = mat.RefractionCoef;
            intersect.MaterialType = mat.MaterialType;
            hit = true;
        }
    }
    return hit;
}

void main() {
    stackPtr = 0;
    vec3 resultColor = vec3(0);

    uCamera = initializeDefaultCamera();
    initializeDefaultScene();
    initializeDefaultLightMaterials();

    SRay primaryRay = GenerateRay(uCamera);
    pushRay(STracingRay(primaryRay, 1.0, 0));

    while (!isEmpty()) {
        STracingRay trRay = popRay();
        SRay ray = trRay.ray;
        SIntersection intersect;
        intersect.Time = BIG;

        if (Raytrace(ray, EPSILON, BIG, intersect)) {
            switch (intersect.MaterialType) {
                case MATERIAL_DIFFUSE: {
                    float shadow = Shadow(light, intersect);
                    resultColor += trRay.contribution * Phong(intersect, light, shadow);
                    break;
                }
                case MATERIAL_REFRACTION: {
                    vec3 refractDir = refract(normalize(ray.Direction), intersect.Normal, 1.0 / intersect.RefractionCoef);
                    if (length(refractDir) > 0.0) {
                        SRay refractRay = SRay(intersect.Point + refractDir * EPSILON, refractDir);
                        pushRay(STracingRay(refractRay, trRay.contribution, trRay.depth + 1));
                    }
                    break;
                }
            }
        } else {
            resultColor += trRay.contribution * vec3(0.1, 0.1, 0.2);
        }
    }

    FragColor = vec4(resultColor, 1.0);
}