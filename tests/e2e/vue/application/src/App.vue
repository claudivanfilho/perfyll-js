<script setup>
import { logError, init, mark } from "../../../../../index";
import { onMounted, ref } from "vue";

const msg = ref("");

const API_URL = import.meta.env.VITE_APP_PERFYLL_CUSTOM_API_URL;

init({
  publicKey: import.meta.env.VITE_APP_PERFYLL_PUBLIC_KEY,
  customHttpUrl: API_URL,
});

onMounted(() => {
  mark("testVue3Front").send();
  msg.value = "App Loaded Successfully";
});

function fetcher(path) {
  return fetch(path);
}

const fetchApiTest2 = () =>
  fetcher(API_URL + "/test-error").catch(async (err) => {
    logError(err, { framework: "Vue3", mode: "frontend" });
    msg.value = "LogError working fine";
  });
</script>

<template>
  <main>
    <div className="p-4 flex justify-center flex-col items-center">
      <div data-testid="status-msg" className="w-full text-center" v-if="msg">
        {{ msg }}
      </div>
      <button
        data-testid="test-error"
        className="bg-blue-500 p-3 mx-2 w-36 mt-4 text-white"
        @click="fetchApiTest2"
      >
        Test Log Error
      </button>
    </div>
  </main>
</template>
