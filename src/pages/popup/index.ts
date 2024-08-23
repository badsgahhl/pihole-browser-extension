import '@pages/popup/index.css';
import '@assets/styles/tailwind.css';
import Popup from './Popup.vue';
import { createApp } from "vue";

function init() {
  const root = document.getElementById('__root');

  createApp(Popup).mount(root!);
}

init();
