<template>
  <n-message-provider>
    <n-layout content-style="padding: 24px;" style="height: 100%">
      <n-layout-content>
        <n-card v-bind:title="'MSFS2020 Map Replacement v' + appVersion" style="margin-bottom: 16px">
          <UpdateNotification />
          <n-tabs type="line" @before-leave="handleBeforeLeave">
            <n-tab-pane name="Mod Control" tab="Mod Control">
              <n-space vertical size="medium">
                <n-space horizontal size="large">
                  <n-switch
                    @update:value="handleServerToggle"
                    :loading="serverStatus===SERVER_STATUS.Starting || serverStatus===SERVER_STATUS.Stopping"
                    size="large"
                    v-model:value="serverStarted"
                  >
                    <template #checked>Back to Bing Map</template>
                    <template #unchecked>Inject Map</template>
                  </n-switch>
                </n-space>
                <n-space>
                  <n-checkbox v-model:checked="autoInject">Auto Inject</n-checkbox>
                  <n-checkbox v-model:checked="autoStartGame">Auto Start Game</n-checkbox>
                  <n-text>Game Store</n-text>
                  <n-radio-group
                    v-model:value="distributor"
                    name="radiogroup"
                  >
                    <n-space>
                      <n-radio
                        v-for="dist in distributors"
                        :key="dist"
                        :value="dist"
                      >
                        {{ dist }}
                      </n-radio>
                    </n-space>
                  </n-radio-group>
                </n-space>
                <FirstTime />
                <Important v-if="!serverStarted" />
                <ServerCheck v-if="serverStarted"
                             v-bind:image-access-health-check-result="imageAccessHealthCheckResult"
                             v-bind:nginx-server-health-check-result="nginxServerHealthCheckResult" />
                <RuntimeInfo v-if="healthCheckPassed" />
              </n-space>
            </n-tab-pane>
            <n-tab-pane name="Map Options" tab="Map Options">
              <ServerSelection v-bind:server-started="serverStarted" />
            </n-tab-pane>
            <n-tab-pane name="System Tray" tab="System Tray">
              <SystemTray />
            </n-tab-pane>
            <n-tab-pane name="Cache" tab="Cache">
              <CacheSetting />
            </n-tab-pane>
            <n-tab-pane name="Proxy Settings" tab="Proxy Settings">
              <ProxySettings v-bind:server-started="serverStarted" />
            </n-tab-pane>
            <n-tab-pane name="Debug" tab="Trouble Shooting">
              <Debug />
            </n-tab-pane>
          </n-tabs>
        </n-card>
      </n-layout-content>
      <Footer />
    </n-layout>
  </n-message-provider>
</template>

<script>
import { defineComponent } from "vue";
import { EVENT_START_GAME, EVENT_START_SERVER, EVENT_STOP_SERVER } from "@/consts/custom-events";
import got from "got";
import Store from "electron-store";

import log from "electron-log";

const store = new Store();
import { useMessage } from "naive-ui";
import { HEALTH_CHECK, SERVER_STATUS } from "@/consts/constants";
import Footer from "@/components/Footer";
import FirstTime from "@/components/FirstTime";
import UpdateNotification from "@/components/UpdateNotification";
import Important from "@/components/Important";
import ProxySettings from "@/components/ProxySettings";
import RuntimeInfo from "@/components/RuntimeInfo";
import Debug from "@/components/Debug";
import ServerSelection from "@/components/ServerSelection";
import ServerCheck from "@/components/ServerCheck";
import CacheSetting from "@/components/CacheSetting";
import SystemTray from "@/components/SystemTray";

const messageOptions = { keepAliveOnHover: true, closable: true };

export default defineComponent({
  name: "Home",
  components: {
    ServerCheck,
    ServerSelection,
    Debug,
    RuntimeInfo,
    ProxySettings,
    Important,
    FirstTime,
    Footer,
    UpdateNotification,
    CacheSetting,
    SystemTray,
  },
  data() {
    return {
      serverStarted: false,
      serverStatus: SERVER_STATUS.Stopped,
      imageAccessHealthCheckResult: null,
      nginxServerHealthCheckResult: null,
      HEALTH_CHECK: HEALTH_CHECK,
      SERVER_STATUS: SERVER_STATUS,
      appVersion: window.require("electron").remote.app.getVersion(),
      autoInject: store.get("autoInject", false),
      autoStartGame: store.get("autoStartGame", false),
      distributors: ["MS Store", "Steam"],
      distributor: store.get("distributor", "MS Store")
    };
  },
  setup() {
    window.$message = useMessage();
  },
  watch: {
    autoInject: function(val) {
      store.set("autoInject", val);
    },
    autoStartGame: function(val) {
      store.set("autoStartGame", val);
    },
    distributor: function(val) {
      store.set("distributor", val);
    }
  },
  computed: {
    healthCheckPassed() {
      return this.nginxServerHealthCheckResult === HEALTH_CHECK.Passed && this.imageAccessHealthCheckResult === HEALTH_CHECK.Passed;
    }
  },
  async mounted() {
    await this.startHealthCheck();
    if (this.autoInject) {
      this.serverStarted = true;
      await this.handleServerToggle(true);
    }
  },
  methods: {
    async handleServerToggle(value) {
      if (value) {
        await this.startServer();
      } else {
        await this.stopServer();
      }
    },
    async startHealthCheck() {
      if (this.imageAccessHealthCheckResult !== HEALTH_CHECK.Checking) {
        this.imageAccessHealthCheckResult = HEALTH_CHECK.Checking;
        setTimeout(await this.checkImageAccess);
      }
      if (this.nginxServerHealthCheckResult !== HEALTH_CHECK.Checking) {
        this.nginxServerHealthCheckResult = HEALTH_CHECK.Checking;
        setTimeout(await this.checkNginxServer);
      }
    },
    async startServer() {
      log.info("Starting mod");
      this.serverStatus = SERVER_STATUS.Starting;

      window.ipcRenderer.invoke(EVENT_START_SERVER).then(() => {
        log.info("Start mod");
        this.startHealthCheck();
        this.serverStatus = SERVER_STATUS.Started;

        this.firstTime = false;
        store.set("firstTime", this.firstTime);

        setTimeout(this.startGame);
      }).catch((e) => {
        this.serverStatus = SERVER_STATUS.Stopped;

        window.$message.error(
          "Start server failed, error: " + e, messageOptions
        );
        log.error("Start mod failed: " + e)
      });
    },
    async stopServer() {
      log.info("Stopping mod");

      this.imageAccessHealthCheckResult = HEALTH_CHECK.NotStarted;
      this.nginxServerHealthCheckResult = HEALTH_CHECK.NotStarted;

      this.serverStatus = SERVER_STATUS.Stopping;
      const result = await window.ipcRenderer.invoke(EVENT_STOP_SERVER);
      this.serverStatus = SERVER_STATUS.Stopped;

      if (!result.success) {
        window.$message.error("Stop server failed, error: " + result.error, messageOptions);
        log.info("Stop mod failed, error", result.error);
      }
    },
    async checkNginxServer() {
      const url = "https://khstorelive.azureedge.net/results/v1.20.0/coverage_maps/lod_8/12202100.cov?version=3";

      let options = {
        timeout: {
          request: 15 * 1000
        },
        rejectUnauthorized: false
      };

      try {
        log.info("Checking nginx server");
        await got(url, options);
      } catch (ex) {
        if (ex instanceof got.HTTPError) {
          log.info("Nginx server check result", ex.response.statusCode);
          if (ex.response.statusCode === 404) {
            log.info("Nginx server check passed");
            this.nginxServerHealthCheckResult = HEALTH_CHECK.Passed;
          } else {
            this.nginxServerHealthCheckResult = HEALTH_CHECK.Failed;
          }
        } else {
          log.error("Nginx server check result", ex);
          this.nginxServerHealthCheckResult = HEALTH_CHECK.Failed;
        }
      }
    },
    async checkImageAccess() {
      const url = `http://localhost:39871/tiles/akh12101.jpeg?n=z&g=9580`;

      let options = {
        timeout: {
          request: 5 * 1000
        },
        rejectUnauthorized: false
      };
      try {
        log.info("Checking image access");
        const resp = await got(url, options);

        log.info("image server response", resp.statusCode);

        if (resp.statusCode === 200) {
          this.imageAccessHealthCheckResult = HEALTH_CHECK.Passed;
          got.get("http://localhost:39871/config").then((serverConfigReq) => {
            store.set("serverConfig", JSON.parse(serverConfigReq.body));
          });
        } else {
          this.imageAccessHealthCheckResult = HEALTH_CHECK.Failed;
        }
      } catch (ex) {
        log.error("Image server error", ex);
        this.imageAccessHealthCheckResult = HEALTH_CHECK.Failed;
      }
    },
    async startGame() {
      if (store.get("autoStartGame", false)) {
        await window.ipcRenderer
          .invoke(EVENT_START_GAME, {
            distributor: this.distributor
          });
      }
    },
    handleBeforeLeave(tabName) {
        switch (tabName) {
          case 'Cache':
          case 'Map Options':
          case 'Proxy Settings':
            if (this.imageAccessHealthCheckResult != HEALTH_CHECK.Passed) {
              window.$message.error('Some options unavailable until server starts.')
              return false
            }
            return true
          default:
            return true
        }
      },
  }
});
</script>

<style scoped>
</style>
