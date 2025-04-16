<script>
import HaderNavBar from '@/components/HaderNavBar.vue'
import OperationInfo from '@/components/operation-info.vue'
export default {
  name: 'App',
  components: {
    HaderNavBar,
    OperationInfo
  },
  methods: {
    toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    }
  }
}
</script>

<template>
  <HaderNavBar />
  <div class="tag">
    <div @click="toggleFullscreen">
      <i class="fas fa-expand-arrows-alt"></i>
    </div>
  </div>
  <OperationInfo />
  <router-view />
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.tag {
  position: fixed;
  top: 70px;
  width: 50px;
  height: calc(100vh - 70px);
  background: #000;
  left: 0px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding: 40px 0;
}

.tag div {
  width: 30px;
  height: 30px;
  line-height: 30px;
  background: #000;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;

}

.tag div:hover {
  i {
    color: #000;
  }

  background:#ddc23a
}

i {
  color: #ffdd31;
}
</style>
