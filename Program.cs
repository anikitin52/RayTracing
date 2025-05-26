using OpenTK.Windowing.Desktop;
using OpenTK.Mathematics;
using OpenTK.Graphics.OpenGL4;
using OpenTK.Windowing.Common;

namespace RayTracing
{

    internal static class Program
    {
        static void Main(string[] args)
        {
            var nativeWindowSettings = new NativeWindowSettings()
            {
                Size = new Vector2i(800, 600),
            };

            using (var window = new GameWindow(GameWindowSettings.Default, nativeWindowSettings))
            {
                var view = new View(window);

                window.Load += () => view.Initialize();
                window.RenderFrame += (e) =>
                {
                    view.Render();
                    window.SwapBuffers();
                };

                // Обработка изменения размера окна
                window.Resize += (e) =>
                {
                    GL.Viewport(0, 0, window.Size.X, window.Size.Y);
                    // Здесь можно обновить uniform-переменные с aspect ratio
                };

                window.Run();
            }
        }
    }
}
