import Options from "./Option.vue";
import { createApp } from "vue";
import '@assets/index.css';
// Action popup
// https://developer.chrome.com/docs/extensions/reference/action/

function render() {
  const target = document.getElementById("__root");

  createApp(Options).mount(target!);
}

document.addEventListener("DOMContentLoaded", render);
