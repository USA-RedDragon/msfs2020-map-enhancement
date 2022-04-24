
namespace MapServices
{
    using System;
    using System.Diagnostics;
    using System.IO;
    using System.ServiceProcess;
    public class ImageServerService : System.ServiceProcess.ServiceBase
    {
        protected Process process;

        static void Main()
        {
            System.ServiceProcess.ServiceBase[] ServicesToRun = new System.ServiceProcess.ServiceBase[] { new ImageServerService() };
            System.ServiceProcess.ServiceBase.Run(ServicesToRun);
        }

        protected override void OnStart(string[] args)
        {
            try
            {
                this.process = new Process();
                string serverDir = Directory.GetParent(
                    Directory.GetParent(
                        System.Reflection.Assembly.GetExecutingAssembly().Location
                    ).ToString()
                ).ToString();
                this.process.StartInfo.UseShellExecute = false;
                this.process.StartInfo.FileName =  serverDir + "/python/python.exe";
                this.process.StartInfo.Arguments = "server.py";
                this.process.StartInfo.CreateNoWindow = true;
                this.process.StartInfo.WorkingDirectory = serverDir;
                if (!this.process.Start()) {
                    Environment.FailFast("Image Server has exited.");
                }

                // Wait 2 seconds after requesting start
                System.Threading.Thread.Sleep(2000);

                // If server has died, we've failed.
                if (this.process.HasExited) {
                    Environment.FailFast("Image Server has exited.");
                }
            }
            catch (Exception e)
            {
                Environment.FailFast("Failed to start Image Server.\n" + e.Message);
            }
        }
        protected override void OnStop()
        {
            try {
                if (!this.process.HasExited) {
                    this.process.Kill();
                    this.process.WaitForExit();
                    this.process.Close();
                    this.process.Dispose();
                }
            } catch (Exception e) {
                Environment.FailFast("Failed to stop Image Server.\n" + e.Message);
            }
        }
    }
}
