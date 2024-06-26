<template>
  <n-p>The options on this page allow you to modify system tray behavior.</n-p>
  <n-space>
    <n-h4>System Tray Options</n-h4>
    <n-checkbox v-model:checked="useTrayIcon">Show Icon in System Tray</n-checkbox>
    <n-checkbox v-model:checked="minimizeToTray" :disabled="!useTrayIcon">Minimize to Tray</n-checkbox>
    <n-checkbox v-model:checked="keepRunningWhenClosed" :disabled="!useTrayIcon">Close to Tray</n-checkbox>
  </n-space>
  <n-space>
    <n-h4>Startup Options</n-h4>
    <n-checkbox v-model:checked="startMinimized" :disabled="!useTrayIcon || !minimizeToTray">Start Minimized</n-checkbox>
    <n-checkbox v-model:checked="runOnBoot" :disabled="!useTrayIcon || !startMinimized || !keepRunningWhenClosed">Start with Windows</n-checkbox>
  </n-space>
</template>

<script>
import { defineComponent } from "vue";
import { EVENT_RELOAD_TRAY, EVENT_ADD_STARTUP, EVENT_REMOVE_STARTUP } from "@/consts/custom-events";
import Store from "electron-store";

const store = new Store();

export default defineComponent({
  name: "SystemTray",
  data() {
    return {
      startMinimized: store.get("startMinimized", false),
      useTrayIcon: store.get("useTrayIcon", false),
      keepRunningWhenClosed: store.get("keepRunningWhenClosed", false),
      minimizeToTray: store.get("minimizeToTray", false),
      runOnBoot: store.get("runOnBoot", false),
    };
  },
  methods: {
    async reloadTray() {
      await window.ipcRenderer.invoke(EVENT_RELOAD_TRAY);
    }
  },
  watch: {
    startMinimized: function(val) {
      store.set("startMinimized", val);
    },
    useTrayIcon: async function(val) {
      store.set("useTrayIcon", val);
      await window.ipcRenderer.invoke(EVENT_RELOAD_TRAY);
    },
    keepRunningWhenClosed: async function(val) {
      store.set("keepRunningWhenClosed", val);
      await window.ipcRenderer.invoke(EVENT_RELOAD_TRAY);
    },
    minimizeToTray: async function(val) {
      store.set("minimizeToTray", val);
      await window.ipcRenderer.invoke(EVENT_RELOAD_TRAY);
    },
    runOnBoot: async function(val) {
      store.set("runOnBoot", val);
      if (val)
        store.set("autoInject", val);
      await window.ipcRenderer.invoke(val ? EVENT_ADD_STARTUP:EVENT_REMOVE_STARTUP);
    },
  },
});
</script>