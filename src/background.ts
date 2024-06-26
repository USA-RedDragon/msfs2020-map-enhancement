"use strict";
import { autoUpdater } from "electron-updater";
import { app, protocol, BrowserWindow, ipcMain, shell } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS3_DEVTOOLS } from "electron-devtools-installer";
import {
  EVENT_CHECK_UPDATE,
  EVENT_START_GAME,
  EVENT_START_SERVER,
  EVENT_STOP_SERVER,
  EVENT_RELOAD_TRAY,
  EVENT_ADD_STARTUP,
  EVENT_REMOVE_STARTUP,
} from "@/consts/custom-events";
import {
  IMAGE_SERVER_SERVICE,
  NGINX_SERVICE,
} from "@/consts/constants";

import sudo from "sudo-prompt";
const options = {
  name: 'MSFS2020 Map Enhancement',
};

import { addCertificate } from "@/services/certificate";
import { startMapServer, stopServer } from "@/services/mapServer";

import log from "electron-log";
import got from "got";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import winlink from "winlink";

import path from "path";
import fs from "fs";

import Store from "electron-store";
import { startGame } from "@/services/game";
import Tray from "@/services/tray";

const isDevelopment = process.env.NODE_ENV !== "production";
let tray: Tray;

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

async function createWindow() {
  Store.initRenderer();
  const store = new Store();

  const win = new BrowserWindow({
    width: 920,
    height: 800,
    fullscreenable: false,
    fullscreen: false,
    maximizable: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: process.env
        .ELECTRON_NODE_INTEGRATION as unknown as boolean,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      preload: path.join(__dirname, "preload.js"),
      enableRemoteModule: true,
    },
  });

  if (store.get("startMinimized", false)) {
    win.hide();
  }

  tray = new Tray(win, app, store);
  tray.maybeShow();

  win.webContents.on("new-window", function (e, url) {
    e.preventDefault();
    shell.openExternal(url);
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol("app");
    win.loadURL("app://./index.html");
  }
}

app.on("window-all-closed", async () => {
  const store = new Store();
  try {
    if (!store.get("runOnBoot", false)) {
      await StopServer();
    }
  } catch (e) {
    log.info("Window closing, error", e);
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("ready", async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    try {
      await installExtension(VUEJS3_DEVTOOLS);
    } catch (e: unknown) {
      log.error("Vue Devtools failed to install:", (e as Error).toString());
    }
  }
  await createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}

ipcMain.handle(EVENT_START_SERVER, (_event, _arg) => {
  return new Promise<boolean>((resolve, reject) => {
    addCertificate().then(() => {
      startMapServer().then(() => {
        got.get("http://localhost:39871/patch-hosts").then(() => {
          log.info("Start map server success");
          resolve(true);
        }).catch((e) => {
          log.error(e);
          reject(e);
        });
      }).catch((e) => {
        log.error(e);
        reject(e);
      });
    }).catch((e) => {
      log.error(e);
      reject(e);
    });
  });
});

ipcMain.handle(EVENT_STOP_SERVER, async (_event, _arg) => {
  try {
    await StopServer();
    log.info("Stop server success");
    return { success: true };
  } catch (e) {
    log.error("Stop server failed", e);
    return { success: false, error: e };
  }
});

async function StopServer() {
  await got.get("http://localhost:39871/unpatch-hosts");
  await stopServer();
}

ipcMain.handle(EVENT_CHECK_UPDATE, async () => {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  const updateCheckResult = await autoUpdater.checkForUpdates();
  return updateCheckResult.updateInfo;
});

ipcMain.handle(EVENT_START_GAME, async (event, arg) => {
  await startGame(arg["distributor"]);
});

ipcMain.handle(EVENT_RELOAD_TRAY, async () => {
  tray.reloadConfig();
});

ipcMain.handle(EVENT_ADD_STARTUP, () => {
  const APPDATA = process.env['APPDATA'];

  winlink.writeFile(`${APPDATA}/Microsoft/Windows/Start Menu/Programs/Startup/MSFS2020 Map Enhancement.lnk`,
    path.join(__dirname, "../../MSFS2020 Map Enhancement.exe")).catch((error: unknown) => {
      log.error(error);
    })

  sudo.exec(`sc config ${IMAGE_SERVER_SERVICE} start=auto & sc config ${NGINX_SERVICE} start=auto`, options,
    function(error: Error | undefined, _stdout: string | Buffer | undefined, _stderr: string | Buffer | undefined) {
      if (error) {
        log.error(error);
      } else {
        startMapServer()
      }
    }
  );
});

ipcMain.handle(EVENT_REMOVE_STARTUP, () => {
  sudo.exec(`sc config ${IMAGE_SERVER_SERVICE} start=demand & sc config ${NGINX_SERVICE} start=demand`, options,
    function(error: Error | undefined, _stdout: string | Buffer | undefined, _stderr: string | Buffer | undefined) {
      if (error) {
        log.error(error);
      }
    }
  );

  const APPDATA = process.env['APPDATA'];
  fs.rmSync(`${APPDATA}/Microsoft/Windows/Start Menu/Programs/Startup/MSFS2020 Map Enhancement.lnk`)
});