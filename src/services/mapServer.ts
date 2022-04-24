import { fork, execFile, spawn, ChildProcess } from "child_process";
import path from "path";
import log from "electron-log";
import util from "util";

const sudo = require('sudo-prompt');
const options = {
  name: 'MSFS2020 Map Enhancement',
};

export async function startMapServer(): Promise<void> {
  log.info("Starting image server");

  return new Promise((resolve, reject) => {
    sudo.exec('net start MSFS2020MapEnhancementImageServer & net start MSFS2020MapEnhancementNginx', options,
      function(error: Error, stdout: string, stderr: string) {
        if (error) {
          reject(error);
          return;
        }
        resolve();
        log.info("Started servers");
      }
    );
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
    sudo.exec('net stop MSFS2020MapEnhancementImageServer & net stop MSFS2020MapEnhancementNginx', options,
      function(error: Error, stdout: string, stderr: string) {
        if (error) {
          reject(error);
          return;
        }
        resolve();
        log.info("Stopped servers");
      }
    );
  })
}
