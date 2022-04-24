module.exports = {
  configureWebpack: {
    devtool: 'source-map'
  },
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      builderOptions: {
        extraResources: ["./extra/server/**", "./extra/nginx/**", "./public/icon.png", "!**/logs/**", "!**/*.cs", "!**/*.ps1", "!**/*.gitignore"],
        productName: "MSFS2020 Map Enhancement",
        appId: "com.april1985.msfs2020-map-enhancement",
        win: {
          target: "nsis",
          requestedExecutionLevel: "requireAdministrator",
          icon: "./public/icon.png",
        },
        nsis: {
          guid: "6fd47695-9ae0-492c-a3a2-db9be0a547d4",
          oneClick: false,
          allowElevation: true,
          allowToChangeInstallationDirectory: true,
          perMachine: true,
          deleteAppDataOnUninstall: true,
          license: "LICENSE"
        },
        publish: ["github"],
      },
      preload: "src/preload.js",
    },
  },
};
