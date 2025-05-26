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

struct SIntersection
{
    float Time;
    vec3 Point;
    vec3 Normal;
    vec3 Color;
    vec4 LightCoeffs;
    float ReflectionCoef;
    float RefractionCoef;
    int MaterialType;
};

struct SLight
{
    vec3 Position;
};

struct SMaterial
{
    vec3 Color;
    vec4 LightCoeffs;
    float ReflectionCoef;
    float RefractionCoef;
    int MaterialType;
};

struct STracingRay
{
    SRay ray;
    float contribution;
    int depth;
};


STriangle triangles[10];
SSphere spheres[2];
SLight light;
SMaterial materials[3]; // Increased size to accommodate more materials
SCamera uCamera;

STracingRay rayStack[MAX_STACK_SIZE];
int stackPtr;


void pushRay(STracingRay trRay)
{
    if (stackPtr < MAX_STACK_SIZE && trRay.depth < MAX_RAY_DEPTH)
    {
        rayStack[stackPtr] = trRay;
        stackPtr++;
    }
}

STracingRay popRay()
{
    stackPtr--;
    return rayStack[stackPtr];
}

bool isEmpty()
{
    return stackPtr == 0;
}

// Forward declaration for Raytrace function
bool Raytrace ( SRay ray, float start, float final, inout SIntersection intersect );


void initializeDefaultScene()
{
    // Left Wall (X=-5) - Red Material (MaterialIdx = 1)
    triangles[0].v1 = vec3(-5.0,-5.0,-5.0);
    triangles[0].v2 = vec3(-5.0, 5.0, 5.0);
    triangles[0].v3 = vec3(-5.0, 5.0,-5.0);
    triangles[0].MaterialIdx = 1;

    triangles[1].v1 = vec3(-5.0,-5.0,-5.0);
    triangles[1].v2 = vec3(-5.0,-5.0, 5.0);
    triangles[1].v3 = vec3(-5.0, 5.0, 5.0);
    triangles[1].MaterialIdx = 1;

    // Front Wall (Z=5) - Default Material (MaterialIdx = 0, Green)
    triangles[2].v1 = vec3(-5.0,-5.0, 5.0);
    triangles[2].v2 = vec3( 5.0,-5.0, 5.0);
    triangles[2].v3 = vec3(-5.0, 5.0, 5.0);
    triangles[2].MaterialIdx = 0;

    triangles[3].v1 = vec3( 5.0, 5.0, 5.0);
    triangles[3].v2 = vec3(-5.0, 5.0, 5.0);
    triangles[3].v3 = vec3( 5.0,-5.0, 5.0);
    triangles[3].MaterialIdx = 0;

    // Floor (Y=-5) - White Material (MaterialIdx = 2)
    triangles[4].v1 = vec3(-5.0, -5.0,  5.0);
    triangles[4].v2 = vec3( 5.0, -5.0,  5.0);
    triangles[4].v3 = vec3(-5.0, -5.0, -5.0);
    triangles[4].MaterialIdx = 2;

    triangles[5].v1 = vec3( 5.0, -5.0, -5.0);
    triangles[5].v2 = vec3(-5.0, -5.0, -5.0);
    triangles[5].v3 = vec3( 5.0, -5.0,  5.0);
    triangles[5].MaterialIdx = 2;

    // Right Wall (X=5) - Default Material (MaterialIdx = 0, Green)
    triangles[6].v1 = vec3( 5.0, -5.0, -5.0);
    triangles[6].v2 = vec3( 5.0,  5.0,  5.0);
    triangles[6].v3 = vec3( 5.0,  5.0, -5.0);
    triangles[6].MaterialIdx = 0;

    triangles[7].v1 = vec3( 5.0, -5.0, -5.0);
    triangles[7].v2 = vec3( 5.0, -5.0,  5.0);
    triangles[7].v3 = vec3( 5.0,  5.0,  5.0);
    triangles[7].MaterialIdx = 0;

    // Ceiling (Y=5) - White Material (MaterialIdx = 2)
    triangles[8].v1 = vec3(-5.0,  5.0, -5.0);
    triangles[8].v2 = vec3( 5.0,  5.0, -5.0);
    triangles[8].v3 = vec3(-5.0,  5.0,  5.0);
    triangles[8].MaterialIdx = 2;

    triangles[9].v1 = vec3( 5.0,  5.0,  5.0);
    triangles[9].v2 = vec3(-5.0,  5.0,  5.0);
    triangles[9].v3 = vec3( 5.0,  5.0, -5.0);
    triangles[9].MaterialIdx = 2;

    // Spheres - Default Material (MaterialIdx = 0, Green)
    spheres[0].Center = vec3(-1.0,-1.0,-2.0);
    spheres[0].Radius = 2.0;
    spheres[0].MaterialIdx = 0;
    spheres[1].Center = vec3(2.0,1.0,2.0);
    spheres[1].Radius = 1.0;
    spheres[1].MaterialIdx = 0;
}

void initializeDefaultLightMaterials()
{
    light.Position = vec3(0.0, 2.0, -4.0f);

    vec4 lightCoefs = vec4(0.4,0.9,0.0,512.0);

    // Material 0: Default Green
    materials[0].Color = vec3(0.0, 1.0, 0.0); // Green
    materials[0].LightCoeffs = vec4(lightCoefs);
    materials[0].ReflectionCoef = 0.0;
    materials[0].RefractionCoef = 1.0;
    materials[0].MaterialType = MATERIAL_DIFFUSE;

    // Material 1: Red for Left Wall
    materials[1].Color = vec3(1.0, 0.0, 0.0); // Red
    materials[1].LightCoeffs = vec4(lightCoefs);
    materials[1].ReflectionCoef = 0.0;
    materials[1].RefractionCoef = 1.0;
    materials[1].MaterialType = MATERIAL_DIFFUSE;

    // Material 2: White for Floor and Ceiling
    materials[2].Color = vec3(1.0, 1.0, 1.0); // White
    materials[2].LightCoeffs = vec4(lightCoefs);
    materials[2].ReflectionCoef = 0.0;
    materials[2].RefractionCoef = 1.0;
    materials[2].MaterialType = MATERIAL_DIFFUSE;
}

bool IntersectSphere ( SSphere sphere, SRay ray, float start, float final, out float time )
{
    vec3 relativeOrigin = ray.Origin - sphere.Center;
    float A = dot ( ray.Direction, ray.Direction );
    float B = dot ( ray.Direction, relativeOrigin );
    float C = dot ( relativeOrigin, relativeOrigin ) - sphere.Radius * sphere.Radius;
    float D = B * B - A * C;
    if ( D > 0.0 )
    {
        D = sqrt ( D );
        float t1 = ( -B - D ) / A;
        float t2 = ( -B + D ) / A;

        if (t1 > start && t1 < final) {
            time = t1;
            return true;
        }
        if (t2 > start && t2 < final) {
            time = t2;
            return true;
        }
    }
    return false;
}

bool IntersectTriangle (SRay ray, vec3 v1, vec3 v2, vec3 v3, out float time )
{
    time = -1;
    vec3 A = v2 - v1;
    vec3 B = v3 - v1;

    vec3 N = cross(A, B);

    float NdotRayDirection = dot(N, ray.Direction);
    if (abs(NdotRayDirection) < EPSILON)
        return false;

    float d = dot(N, v1);

    float t = -(dot(N, ray.Origin) - d) / NdotRayDirection;

    if (t < EPSILON)
        return false;

    vec3 P = ray.Origin + t * ray.Direction;

    vec3 C;

    vec3 edge1 = v2 - v1;
    vec3 VP1 = P - v1;
    C = cross(edge1, VP1);
    if (dot(N, C) < 0)
        return false;

    vec3 edge2 = v3 - v2;
    vec3 VP2 = P - v2;
    C = cross(edge2, VP2);
    if (dot(N, C) < 0)
        return false;

    vec3 edge3 = v1 - v3;
    vec3 VP3 = P - v3;
    C = cross(edge3, VP3);
    if (dot(N, C) < 0)
        return false;

    time = t;
    return true;
}

vec3 Phong ( SIntersection intersect, SLight currLight, float shadowing )
{
    vec3 lightDir = normalize ( currLight.Position - intersect.Point );
    float diffuse = max(dot(lightDir, intersect.Normal), 0.0);
    vec3 viewDir = normalize(uCamera.Position - intersect.Point);
    vec3 reflectedDir = reflect( -viewDir, intersect.Normal );
    float specular = pow(max(dot(reflectedDir, lightDir), 0.0), intersect.LightCoeffs.w);

    vec3 ambient = intersect.LightCoeffs.x * intersect.Color;
    vec3 directLight = shadowing * (intersect.LightCoeffs.y * diffuse * intersect.Color +
                                    intersect.LightCoeffs.z * specular * vec3(1.0, 1.0, 1.0));

    return ambient + directLight;
}

float Shadow(SLight currLight, SIntersection intersect)
{
    float shadowing = 1.0;
    vec3 direction = normalize(currLight.Position - intersect.Point);
    float distanceLight = distance(currLight.Position, intersect.Point);
    SRay shadowRay = SRay(intersect.Point + direction * EPSILON, direction);
    SIntersection shadowIntersect;
    shadowIntersect.Time = BIG;
    if(Raytrace(shadowRay, 0.0, distanceLight, shadowIntersect))
    {
        shadowing = 0.0;
    }
    return shadowing;
}

SRay GenerateRay ( SCamera camera )
{
    vec2 coords = glPosition.xy * camera.Scale;
    vec3 direction = camera.View + camera.Side * coords.x + camera.Up * coords.y;
    return SRay ( camera.Position, normalize(direction) );
}

SCamera initializeDefaultCamera()
{
    SCamera camera;
    camera.Position = vec3(0.0, 0.0, -8.0);
    camera.View = vec3(0.0, 0.0, 1.0);
    camera.Up = vec3(0.0, 1.0, 0.0);
    camera.Side = vec3(1.0, 0.0, 0.0);
    camera.Scale = vec2(1.0);
    return camera;
}

bool Raytrace ( SRay ray, float start, float final, inout SIntersection intersect )
{
    bool result = false;
    float test = start;
    intersect.Time = final;

    for(int i = 0; i < 2; i++)
    {
        SSphere sphere = spheres[i];
        if( IntersectSphere (sphere, ray, start, final, test ) && test < intersect.Time )
        {
            intersect.Time = test;
            intersect.Point = ray.Origin + ray.Direction * test;
            intersect.Normal = normalize ( intersect.Point - spheres[i].Center );
            intersect.Color = materials[sphere.MaterialIdx].Color;
            intersect.LightCoeffs = materials[sphere.MaterialIdx].LightCoeffs;
            intersect.ReflectionCoef = materials[sphere.MaterialIdx].ReflectionCoef;
            intersect.RefractionCoef = materials[sphere.MaterialIdx].RefractionCoef;
            intersect.MaterialType = materials[sphere.MaterialIdx].MaterialType;
            result = true;
        }
    }

    for(int i = 0; i < 10; i++)
    {
        STriangle triangle = triangles[i];

        if(IntersectTriangle(ray, triangle.v1, triangle.v2, triangle.v3, test)
           && test < intersect.Time)
        {
            intersect.Time = test;
            intersect.Point = ray.Origin + ray.Direction * test;
            intersect.Normal =
                 normalize(cross(triangle.v1 - triangle.v2, triangle.v3 - triangle.v2));
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

void main ( void )
{
    stackPtr = 0;
    vec3 resultColor = vec3(0,0,0);

    uCamera = initializeDefaultCamera();
    initializeDefaultScene();
    initializeDefaultLightMaterials();

    SRay primaryRay = GenerateRay(uCamera);
    STracingRay initialTrRay = STracingRay(primaryRay, 1.0, 0);
    pushRay(initialTrRay);

    while(!isEmpty())
    {
        STracingRay trRay = popRay();
        SRay currentRay = trRay.ray;
        SIntersection intersect;
        intersect.Time = BIG;
        float currentStart = EPSILON;
        float currentFinal = BIG;

        if (Raytrace(currentRay, currentStart, currentFinal, intersect))
        {
            switch(intersect.MaterialType)
            {
                case MATERIAL_DIFFUSE:
                {
                    float shadowing = Shadow(light, intersect);
                    resultColor += trRay.contribution * Phong ( intersect, light, shadowing );
                    break;
                }
                case MATERIAL_MIRROR:
                {
                    if(intersect.ReflectionCoef < 1.0)
                    {
                        float contribution = trRay.contribution * (1.0 - intersect.ReflectionCoef);
                        float shadowing = Shadow(light, intersect);
                        resultColor +=  contribution * Phong(intersect, light, shadowing);
                    }
                    vec3 reflectDirection = reflect(currentRay.Direction, intersect.Normal);
                    float newContribution = trRay.contribution * intersect.ReflectionCoef;
                    STracingRay reflectRay = STracingRay(
                        SRay(intersect.Point + reflectDirection * EPSILON, reflectDirection),
                        newContribution, trRay.depth + 1);
                    pushRay(reflectRay);
                    break;
                }
                case MATERIAL_REFRACTION:
                {
                    float shadowing = Shadow(light, intersect);
                    resultColor += trRay.contribution * Phong(intersect, light, shadowing);
                    break;
                }
                default:
                {
                    float shadowing = Shadow(light, intersect);
                    resultColor += trRay.contribution * Phong(intersect, light, shadowing);
                    break;
                }
            }
        } else {
            resultColor += trRay.contribution * vec3(0.1, 0.1, 0.2);
        }
    }
    FragColor = vec4 (resultColor, 1.0);
}