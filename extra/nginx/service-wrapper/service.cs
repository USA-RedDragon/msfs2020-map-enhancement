
namespace MapServices
{
    using System;
    using System.Diagnostics;
    using System.IO;
    using System.ServiceProcess;
    public class NginxService : System.ServiceProcess.ServiceBase
    {
        protected Process process;

        static void Main()
        {
            System.ServiceProcess.ServiceBase[] ServicesToRun = new System.ServiceProcess.ServiceBase[] { new NginxService() };
            System.ServiceProcess.ServiceBase.Run(ServicesToRun);
        }

        protected override void OnStart(string[] args)
        {
            try
            {
                this.process = new Process();
                string nginxDir = Directory.GetParent(
                    Directory.GetParent(
                        System.Reflection.Assembly.GetExecutingAssembly().Location
                    ).ToString()
                ).ToString();
                this.process.StartInfo.UseShellExecute = false;
                this.process.StartInfo.FileName = nginxDir + "/nginx.exe";
                this.process.StartInfo.CreateNoWindow = true;
                this.process.StartInfo.WorkingDirectory = nginxDir;
                if (!this.process.Start()) {
                    Environment.FailFast("Nginx has exited.");
                }

                // Wait 2 seconds after requesting start
                System.Threading.Thread.Sleep(2000);

                // If nginx has died, we've failed.
                if (this.process.HasExited) {
                    Environment.FailFast("Nginx has exited.");
                }
            }
            catch (Exception e)
            {
                Environment.FailFast("Failed to start Nginx.\n" + e.Message);
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
                foreach (Process nginxProcess in Process.GetProcessesByName("nginx")) {
                    nginxProcess.Kill();
                    nginxProcess.WaitForExit();
                    nginxProcess.Close();
                    nginxProcess.Dispose();
                }
            } catch (Exception e) {
                Environment.FailFast("Failed to stop Nginx.\n" + e.Message);
            }
        }
    }
}
