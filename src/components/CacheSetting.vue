<template>
  <n-h4>Cache</n-h4>
  <n-p>
    The internal cache is used to speed up satellite image loading speed when in game "Rolling Cache" is disabled.
    "Rolling Cache" may cause issue when you sometimes fly with Bing map and sometimes with others.
  </n-p>
  <n-p>
    "Rolling Cache" can be turned on while the mod's cache is on if you stick to one server provider.
  </n-p>
  <n-p>
    To change any options, you need to restart the injection to take effect.
  </n-p>
  <n-checkbox v-model:checked="cacheEnabled">Enable Cache</n-checkbox>
  <n-h4>Path</n-h4>
  <n-tooltip trigger="hover">
    <template #trigger>
      <n-input-group>
        <n-input v-model:value="cacheLocation" />
        <n-button type="primary" ghost @click="resetPath">Reset To Default</n-button>
      </n-input-group>
    </template>
    The default cache location is under the installation path. You can put it to another location. When you change
    the cache location, the old cache file will still there. Please delete it manually.
    Cache location should not contains any blank space otherwise image server will not start
  </n-tooltip>
  <n-button @click="clearCache" v-bind:style="{marginTop: '20px'}">Clear Cache</n-button>
  <n-h4>Cache Size</n-h4>
  <n-input-number v-model:value="cacheSizeGB" placeholder="Cache size"
                  v-bind:style="{width:'min-content', minWidth:'20%'}"
                  :min="1"
                  :max="200"
  >
    <template #suffix>
      GB
    </template>
  </n-input-number>
</template>

<script>
import Store from "electron-store";
import electron from "electron";

const store = new Store();

import { defineComponent } from "vue";
import got from "got";

const getDirectory = (path) => {
  return path.substring(0, path.lastIndexOf("\\") + 1);
};

const getDefaultPath = () => {
  return ".\\cache";
};

export default defineComponent({
  name: "CacheSetting",
  data() {
    let cacheLocation = "";
    let cacheEnabled = false;
    let cacheSizeGB = 10;

    let serverConfig = store.get("serverConfig", undefined);
    if (serverConfig != undefined) {
      cacheLocation = serverConfig.cacheLocation;
      cacheEnabled = serverConfig.cacheEnabled;
      cacheSizeGB = serverConfig.cacheSizeGB;
    }

    return {
      cacheLocation,
      cacheEnabled,
      cacheSizeGB,
    };
  },
  methods: {
    resetPath() {
      this.cacheLocation = getDefaultPath();
    },
    async clearCache() {
      try {
        window.$message.info("Clearing cache, please wait");
        await got.delete("http://localhost:39871/cache");
        window.$message.info("Cache cleared");
      } catch (e) {
        window.$message.error("Please start injection and then clear cache");
      }
    },
    async reloadServer(serverConfig) {
      store.set("serverConfig", serverConfig);

      this.cacheLocation = serverConfig.cacheLocation;
      this.cacheEnabled = serverConfig.cacheEnabled;
      this.cacheSizeGB = serverConfig.cacheSizeGB;
    }
  },
  watch: {
    cacheEnabled: function(val, oldVal) {
      got.get("http://localhost:39871/config").then((res) => {
        let serverConfig = JSON.parse(res.body);
        serverConfig.cacheEnabled = val;

        got.post("http://localhost:39871/config", {
          json: serverConfig
        }).then((res) => {
          serverConfig = JSON.parse(res.body);
          this.reloadServer(serverConfig);
        })
      });
    },
    cacheLocation: function(val, oldVal) {
      got.get("http://localhost:39871/config").then((res) => {
        let serverConfig = JSON.parse(res.body);
        serverConfig.cacheLocation = val;

        got.post("http://localhost:39871/config", {
          json: serverConfig
        }).then((res) => {
          serverConfig = JSON.parse(res.body);
          this.reloadServer(serverConfig);
        })
      });
    },
    cacheSizeGB: function(val, oldVal){
      got.get("http://localhost:39871/config").then((res) => {
        let serverConfig = JSON.parse(res.body);
        serverConfig.cacheSizeGB = val;

        got.post("http://localhost:39871/config", {
          json: serverConfig
        }).then((res) => {
          serverConfig = JSON.parse(res.body);
          this.reloadServer(serverConfig);
        })
      });
    }
  }
});

</script>