<template>
  <div class="hinge-container">
    <NavBar />
    <div class="scene-container" ref="container"></div>
    <div class="tag mode-toolbar">
      <div @click="sum">
        <i class="fas fa-play"></i>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { SceneUtils } from '../utils/sceneUtils'
import { SceneStateManager } from '../utils/sceneStateManager'
import NavBar from '../components/NavBar.vue'
import { SceneMode } from '../config/modeConfig'
import { useOperationStore } from '../stores/operationStore'

const operationStore = useOperationStore()

// 显示普通信息
operationStore.setMessage('铰接模式：铰接立方体', 'success')
const container = ref(null)
let sceneUtils = null
let sceneStateManager = null

onMounted(() => {
  // 初始化场景
  sceneUtils = new SceneUtils(container.value)
  sceneUtils.initScene()

  // 隐藏网格和地板
  sceneUtils.setGridVisible(false)
  sceneUtils.setGroundVisible(false)

  // 设置为铰接模式并禁用创建和删除功能
  if (sceneUtils.cameraControls) {
    sceneUtils.cameraControls.setMode(SceneMode.HINGE)
    sceneUtils.cameraControls.enabled = false
  }

  // 初始化场景状态管理器
  sceneStateManager = new SceneStateManager(sceneUtils.getCubeManager())

  // 加载保存的场景
  const hinges = sceneStateManager.loadSceneState()
  console.log('Loaded hinges:', hinges)

  // 添加窗口大小调整监听
  window.addEventListener('resize', () => sceneUtils.onWindowResize())
})
const sum = () => {
  sceneUtils.cameraControls.saveHingeState()
}
onBeforeUnmount(() => {
  if (sceneUtils) {
    sceneUtils.dispose()
  }
  window.removeEventListener('resize', () => sceneUtils.onWindowResize())
})
</script>

<style scoped>
.hinge-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.scene-container {
  width: 100%;
  height: 100%;
}

.hinge-controls {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(51, 51, 51, 0.8);
  padding: 20px;
  border-radius: 10px;
  backdrop-filter: blur(5px);
  color: white;
  z-index: 1000;
}

.control-panel {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.control-panel h3 {
  margin: 0;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.control-btn {
  padding: 8px 16px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-btn:hover {
  background: #357abd;
}

.control-btn:active {
  transform: scale(0.98);
}

.create-container {
  width: 100%;
  height: 100vh;
  position: relative;
}

.tag {
  position: fixed;
  left: 40px;
  top: 150px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tag div {
  width: 30px;
  height: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tag div:hover {
  background: #ddc23a;
  border-radius: 8px;
}

.mode-tool-btn.active {
  background-color: #4CAF50;
  color: white;
}

.mode-toolbar {
  position: absolute;
  left: 70px;
  top: 50%;
  width: 60px;
  height: auto;
  transform: translateY(-50%);
  background: linear-gradient(145deg, rgba(70, 70, 70, 0.9), rgba(40, 40, 40, 0.9));
  padding: 15px;
  border-radius: 15px;
  backdrop-filter: blur(5px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 10;
}
</style>