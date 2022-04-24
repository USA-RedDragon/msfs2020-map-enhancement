import { fork, execFile, spawn, ChildProcess } from "child_process";
import path from "path";
import log from "electron-log";
import util from "util";

import { IMAGE_SERVER_SERVICE, NGINX_SERVICE } from "../consts/constants";

const execAsync = util.promisify(execFile);

import sudo from "sudo-prompt";
const options = {
  name: 'MSFS2020 Map Enhancement',
};

function isNginxRunning(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    execAsync(
      "sc.exe",
      [
        "query",
        NGINX_SERVICE,
        "type=service"
      ]
    ).then((ret: { stdout: string, stderr: string }) => {
      const stateLine = ret.stdout.split("\n").filter( e => e.trim().startsWith("STATE"));
      const splitLine = stateLine[0].split(" ").filter( e => e.trim().length > 0);
      resolve(splitLine[3].trim().startsWith("RUNNING"))
    }).catch((e) => {
      reject(e);
    });
  });
}

function isImageServerRunning(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    execAsync(
      "sc.exe",
      [
        "query",
        IMAGE_SERVER_SERVICE,
        "type=service"
      ]
    ).then((ret: { stdout: string, stderr: string }) => {
      const stateLine = ret.stdout.split("\n").filter( e => e.trim().startsWith("STATE"));
      const splitLine = stateLine[0].split(" ").filter( e => e.trim().length > 0);
      resolve(splitLine[3].trim().startsWith("RUNNING"))
    }).catch((e) => {
      reject(e);
    });
  });
}

export async function startMapServer(): Promise<void> {
  log.info("Starting image server if needed");

  return new Promise((resolve, reject) => {
    let startNginx = false;
    let startImageServer = false;
    isNginxRunning().then((res) => {
      startNginx = !res;

      isImageServerRunning().then((res) => {
        startImageServer = !res;

        const commandPrefix = "net start ";
        let command = commandPrefix;
        if(startNginx) {
          command += NGINX_SERVICE;
        }
        if(startNginx && startImageServer) {
          command += " & " + commandPrefix + IMAGE_SERVER_SERVICE;
        } else if(startImageServer) {
          command += IMAGE_SERVER_SERVICE;
        }

        if (startImageServer || startNginx) {
          sudo.exec(command, options,
            function(error: Error, stdout: string, stderr: string) {
              if (error) {
                reject(error);
                return;
              }
              log.info("Started servers");
              resolve();
            }
          );
        } else {
          resolve();
        }
      });
    });
  })
}

function setupLog(process: ChildProcess, name: string) {
  process.stdout!.setEncoding("utf8");
  process.stdout!.on("data", function (data) {
    log.info(`${name}:`, data);
  });

  process.stderr!.setEncoding("utf8");
  process.stderr!.on("error", function (data) {
    log.info(`${name}:`, data);
  });

  process.on("close", function (code) {
    log.log(`${name} Process closed`, code);
  });

  process.on("error", (err) => {
    log.error(`${name} Failed to start process`, err);
  });
}

export async function stopServer(): Promise<void> {
  log.info("Force killing server");

  return new Promise((resolve, reject) => {
    let stopNginx = false;
    let stopImageServer = false;

    isNginxRunning().then((res) => {
      stopNginx = res;

      isImageServerRunning().then((res) => {
        stopImageServer = res;

        const commandPrefix = "net stop ";
        let command = commandPrefix;
        if(stopNginx) {
          command += NGINX_SERVICE;
        }
        if(stopNginx && stopImageServer) {
          command += " & " + commandPrefix + IMAGE_SERVER_SERVICE;
        } else if(stopImageServer) {
          command += IMAGE_SERVER_SERVICE;
        }

        if (stopImageServer || stopNginx) {
          sudo.exec(command, options,
            function(error: Error, stdout: string, stderr: string) {
              if (error) {
                reject(error);
                return;
              }
              resolve();
              log.info("Stopped servers");
            }
          );
        } else {
          resolve();
        }
      }).catch((e) => {
        reject(e);
      });
    }).catch((e) => {
      reject(e);
    });
  });
}
