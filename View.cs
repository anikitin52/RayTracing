using System;
using System.IO;
using OpenTK;
using OpenTK.Graphics.OpenGL4;
using OpenTK.Mathematics;
using OpenTK.Windowing.Common;
using OpenTK.Windowing.Desktop;
using OpenTK.Windowing.GraphicsLibraryFramework;

namespace RayTracing
{
    internal class View
    {
        private int BasicProgramID;
        private int BasicVertexShader;
        private int BasicFragmentShader;
        private int vbo_position;
        private int vao;
        private Vector3[] vertdata;
        private GameWindow window;
        private float aspectRatio;

        public View(GameWindow window)
        {
            this.window = window;
            aspectRatio = window.Size.X / (float)window.Size.Y;
        }

        public void Initialize()
        {
            GL.ClearColor(Color4.Black); // Изменили на черный фон

            InitShaders();
            SetupVBO();

            GL.GenVertexArrays(1, out vao);
            GL.BindVertexArray(vao);

            GL.BindBuffer(BufferTarget.ArrayBuffer, vbo_position);
            GL.EnableVertexAttribArray(0);
            GL.VertexAttribPointer(0, 3, VertexAttribPointerType.Float, false, 0, 0);

            // Устанавливаем uniform-переменные
            GL.UseProgram(BasicProgramID);
            var aspectLoc = GL.GetUniformLocation(BasicProgramID, "uAspect");
            GL.Uniform1(aspectLoc, aspectRatio);
        }

        private void InitShaders()
        {
            BasicProgramID = GL.CreateProgram();


            loadShader("..\\..\\..\\Shaders\\raytracing.vert", ShaderType.VertexShader, BasicProgramID, out BasicVertexShader);
            loadShader("..\\..\\..\\Shaders\\raytracing.frag", ShaderType.FragmentShader, BasicProgramID, out BasicFragmentShader);

            GL.LinkProgram(BasicProgramID);

            // Проверка ошибок
            GL.GetProgram(BasicProgramID, GetProgramParameterName.LinkStatus, out int status);
            if (status == 0)
            {
                string log = GL.GetProgramInfoLog(BasicProgramID);
                throw new Exception($"Program linking failed: {log}");
            }

            // Привязываем атрибуты
            GL.BindAttribLocation(BasicProgramID, 0, "vPosition");
        }

        private void loadShader(string filename, ShaderType type, int program, out int address)
        {
            address = GL.CreateShader(type);
            string path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, filename);

            if (!File.Exists(path))
                throw new FileNotFoundException($"Shader file not found: {path}");

            string shaderSource = File.ReadAllText(path);
            GL.ShaderSource(address, shaderSource);
            GL.CompileShader(address);

            // Проверка компиляции
            GL.GetShader(address, ShaderParameter.CompileStatus, out int success);
            if (success == 0)
            {
                string log = GL.GetShaderInfoLog(address);
                throw new Exception($"Shader compilation failed ({type}): {log}");
            }

            GL.AttachShader(program, address);
        }

        private void SetupVBO()
        {
            // Вершины полноэкранного квада (2 треугольника)
            vertdata = new Vector3[]
            {
                new Vector3(-1f, -1f, 0f),
                new Vector3(1f, -1f, 0f),
                new Vector3(1f, 1f, 0f),
                new Vector3(1f, 1f, 0f),
                new Vector3(-1f, 1f, 0f),
                new Vector3(-1f, -1f, 0f)
            };

            GL.GenBuffers(1, out vbo_position);
            GL.BindBuffer(BufferTarget.ArrayBuffer, vbo_position);
            GL.BufferData(BufferTarget.ArrayBuffer, vertdata.Length * Vector3.SizeInBytes, vertdata, BufferUsageHint.StaticDraw);
        }


        public void Render()
        {
            GL.Clear(ClearBufferMask.ColorBufferBit | ClearBufferMask.DepthBufferBit);
            GL.Enable(EnableCap.DepthTest);

            GL.UseProgram(BasicProgramID);
            GL.BindVertexArray(vao);

            // Обновляем aspect ratio если изменился размер окна
            float currentAspect = window.Size.X / (float)window.Size.Y;
            if (Math.Abs(currentAspect - aspectRatio) > 0.001f)
            {
                aspectRatio = currentAspect;
                var aspectLoc = GL.GetUniformLocation(BasicProgramID, "uAspect");
                GL.Uniform1(aspectLoc, aspectRatio);
            }

            GL.DrawArrays(PrimitiveType.Triangles, 0, 6);
        }
    }

    struct SCamera
    {
        vec3 Position;
        vec3 View;
        vec3 Up;
        vec3 Side;
        // отношение сторон выходного изображения 
        vec2 Scale;
    };

    struct SRay
    {
        vec3 Origin;
        vec3 Direction;
    };
}