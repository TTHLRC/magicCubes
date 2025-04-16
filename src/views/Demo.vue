<template>
  <div class="demo-container ">
    <NavBar />
    <div class="scene-container" ref="container"></div>
    <div class="tag mode-toolbar">
      <div @click="togglePhysics(true)">
        <i class="fas fa-play"></i>
      </div>
      <div @click="togglePhysics(false)">
        <i class="fas fa-pause"></i>
      </div>
      <div @click="reset">
        <i class="fas fa-undo"></i>
      </div>
    </div>
  </div>
</template>

<script setup>
import * as THREE from 'three'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { SceneUtils } from '../utils/sceneUtils'
import { SceneMode } from '../config/modeConfig'
import NavBar from '../components/NavBar.vue'
import { PhysicsManager } from '../utils/physicsManager'
import * as CANNON from 'cannon-es'
import { useOperationStore } from '../stores/operationStore'

const operationStore = useOperationStore()

// 显示普通信息
operationStore.setMessage('模拟模式：展示模拟过程', 'success')
const container = ref(null)
let sceneUtils = null
let physicsManager = null
let cubeBodies = new Map() // 存储立方体与其物理体的映射
const isPhysicsActive = ref(false)
const savedStates = new Map()
// 存储铰接约束
let hingeConstraints = []

// 圆锥体交互相关
const isDraggingCone = ref(false)
const lastUpdateTime = ref(0)
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
const LONG_PRESS_DELAY = 500 // 长按判定时间（毫秒）
let longPressTimer = null
let isLeftMouseDown = false
// 处理圆锥体长按
const handleMouseDown = (event) => {
  // 只响应左键点击 + Ctrl/Command 键
  if (event.button !== 0 || !(event.ctrlKey || event.metaKey)) return

  isLeftMouseDown = true

  // 计算鼠标位置
  const rect = container.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  // 启动长按计时器
  longPressTimer = setTimeout(() => {
    if (!isLeftMouseDown) return

    // 检查是否点击到圆锥体
    raycaster.setFromCamera(mouse, sceneUtils.camera)
    const cones = sceneUtils.cubeManager.coneControlArray
    const coneIntersects = raycaster.intersectObjects(cones)
    setHingeConstraint()
    if (coneIntersects.length > 0) {
      isDraggingCone.value = true
      lastUpdateTime.value = performance.now()
    }
  }, LONG_PRESS_DELAY)
}

// 处理圆锥体移动
const handleMouseMove = (event) => {
  if (!isDraggingCone.value) return

  // 计算鼠标在归一化设备坐标中的位置
  const rect = container.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  // 更新射线
  raycaster.setFromCamera(mouse, sceneUtils.camera)

  // 处理长按圆锥体的逻辑
  if (isDraggingCone.value && sceneUtils.cubeManager.selectedCubes.length > 0) {
    const currentTime = performance.now()
    const deltaTime = (currentTime - lastUpdateTime.value) / 1000
    lastUpdateTime.value = currentTime

    const selectedCube = sceneUtils.cubeManager.selectedCubes[0]
    const cones = sceneUtils.cubeManager.coneControlArray
    const coneIntersects = raycaster.intersectObjects(cones)

    if (coneIntersects.length > 0) {
      const clickedCone = coneIntersects[0].object

      // 计算从被选中的网格到控制圆锥体的方向向量
      const direction = clickedCone.position.clone().sub(selectedCube.position).normalize()
      const forceMagnitude = 1000  // 增加力的大小
      const f = direction.multiplyScalar(forceMagnitude)

      // 获取立方体的物理体
      const cubeBody = selectedCube.userData.physicsBody

      if (cubeBody) {
        // 重置速度和角速度
        cubeBody.velocity.set(0, 0, 0)
        cubeBody.angularVelocity.set(0, 0, 0)

        // 应用力到物理体
        const cannonForce = new CANNON.Vec3(f.x, f.y, f.z)
        cubeBody.applyForce(
          cannonForce,
          new CANNON.Vec3(0, 0, 0)
        )

        // 更新物理世界
        physicsManager.update(deltaTime)

        // 同步物理体到图形对象
        physicsManager.syncPhysicsToGraphics(selectedCube, cubeBody)
      }
    }
  }
}

const handleMouseUp = () => {
  isLeftMouseDown = false
  clearTimeout(longPressTimer)
  isDraggingCone.value = false
}

onMounted(() => {
  // 初始化场景
  sceneUtils = new SceneUtils(container.value)

  // 在初始化场景之前设置演示模式
  sceneUtils.setSceneMode(SceneMode.DEMO)
  // 初始化场景
  sceneUtils.initScene()

  // 初始化物理世界
  physicsManager = new PhysicsManager()

  // 将场景中现有的立方体添加到物理世界
  const addCubesToPhysics = (object) => {
    // 检查是否是立方体
    if (object.type === 'Mesh' && object.geometry.type === "BoxGeometry") {
      object.userData.isCube = true
      try {
        const body = physicsManager.createCubeBody(object)
        // 如果是固定状态，设置物理体为静态
        if (object.userData.isFix) {
          body.mass = 0
          body.updateMassProperties()
          body.type = CANNON.Body.STATIC
          // 确保速度和角速度都为零
          body.velocity.set(0, 0, 0)
          body.angularVelocity.set(0, 0, 0)
          body.force.set(0, 0, 0)
          body.torque.set(0, 0, 0)
        }
        cubeBodies.set(object, body)
      } catch (error) {
        console.error('Error creating physics body:', error)
      }
    }

    // 递归检查子对象
    if (object.children && object.children.length > 0) {
      object.children.forEach(child => {
        addCubesToPhysics(child)
      })
    }
  }

  // 从场景根节点开始遍历
  addCubesToPhysics(sceneUtils.scene)
  saveInitialStates()

  container.value.addEventListener('mousedown', handleMouseDown)
  container.value.addEventListener('mousemove', handleMouseMove)
  container.value.addEventListener('mouseup', handleMouseUp)
  container.value.addEventListener('mouseleave', handleMouseUp)

  // 修改动画循环
  const animate = () => {
    requestAnimationFrame(animate)

    if (isPhysicsActive.value) {
      physicsManager.update(1 / 60)

      // 更新铰接约束
      hingeConstraints.forEach(constraint => {
        // 可以在这里更新约束参数
        constraint.setMotorSpeed(0) // 保持静止
      })

      cubeBodies.forEach((body, cube) => {
        physicsManager.syncPhysicsToGraphics(cube, body)
      })
    }

    sceneUtils.renderer.render(sceneUtils.scene, sceneUtils.camera)
  }
  animate()

  // 添加窗口大小调整监听
  window.addEventListener('resize', () => sceneUtils.onWindowResize())
})

onBeforeUnmount(() => {
  if (sceneUtils) {
    sceneUtils.dispose()
  }
  // 移除圆锥体交互事件监听
  container.value.removeEventListener('mousedown', handleMouseDown)
  container.value.removeEventListener('mousemove', handleMouseMove)
  container.value.removeEventListener('mouseup', handleMouseUp)
  container.value.removeEventListener('mouseleave', handleMouseUp)
  window.removeEventListener('resize', () => sceneUtils.onWindowResize())
})
const calculateHingeConstraint = (cube1, cube2, hingeInfo) => {
  console.log(cube1, cube2, hingeInfo, hingeInfo.position);

  if (!cube1 || !cube2 || !hingeInfo || !hingeInfo.position) {
    console.error('Invalid parameters for hinge constraint calculation:', { cube1, cube2, hingeInfo })
    return null
  }

  // 1. 立方体连线方向
  const cubeToCubeVector = new THREE.Vector3(
    cube2.position.x - cube1.position.x,
    cube2.position.y - cube1.position.y,
    cube2.position.z - cube1.position.z
  )
  cubeToCubeVector.normalize()

  // 2. 计算轴方向
  const globalUp = new THREE.Vector3(0, 1, 0)
  let axis = new THREE.Vector3()
  axis.crossVectors(cubeToCubeVector, globalUp)
  axis.normalize()

  // 3. 避免叉乘结果为零向量
  if (axis.length() < 1e-6) {
    const globalRight = new THREE.Vector3(1, 0, 0)
    axis.crossVectors(cubeToCubeVector, globalRight)
    axis.normalize()
  }

  // 4. 支点（局部坐标）
  const pivotA = new CANNON.Vec3(
    hingeInfo.position.x - cube1.position.x,
    hingeInfo.position.y - cube1.position.y,
    hingeInfo.position.z - cube1.position.z
  )
  const pivotB = new CANNON.Vec3(
    hingeInfo.position.x - cube2.position.x,
    hingeInfo.position.y - cube2.position.y,
    hingeInfo.position.z - cube2.position.z
  )

  // 5. 创建约束
  return {
    pivotA,
    pivotB,
    axisA: new CANNON.Vec3(axis.x, axis.y, axis.z),
    axisB: new CANNON.Vec3(axis.x, axis.y, axis.z)
  }
}
const getCubeByUUID = (uuid) => {
  // 使用 for...of 替代 forEach 以支持提前返回
  for (const child of sceneUtils.scene.children) {
    if (child.userData.isCube && child.uuid === uuid) {
      return child; // 找到后立即返回
    }
  }
  return null; // 未找到时返回 null
};
//设置约束
const setHingeConstraint = () => {
  // 清除现有的约束
  hingeConstraints.forEach(constraint => {
    physicsManager.world.removeConstraint(constraint)
  })
  hingeConstraints = []

  // 只在物理激活时创建约束
  if (isPhysicsActive.value) {
    const sceneState = JSON.parse(localStorage.getItem('scene_state'))
    console.log(sceneState);

    if (!sceneState || !sceneState.hingePoints) {
      console.warn('No hinge points found in scene state')
      return
    }

    Object.entries(sceneState.hingePoints).forEach(([hingeUUID, hingeInfo]) => {
      const cube1 = getCubeByUUID(hingeInfo.cube1UUID)
      const cube2 = getCubeByUUID(hingeInfo.cube2UUID)
      console.log(hingeInfo);

      if (cube1 && cube2) {
        const body1 = cubeBodies.get(cube1)
        const body2 = cubeBodies.get(cube2)

        if (body1 && body2) {
          const constraint = calculateHingeConstraint(cube1, cube2, hingeInfo)
          if (constraint) {
            // 创建铰接约束
            const hingeConstraint = new CANNON.HingeConstraint(
              body1,
              body2,
              {
                pivotA: constraint.pivotA,
                pivotB: constraint.pivotB,
                axisA: constraint.axisA,
                axisB: constraint.axisB
              }
            )
            // 设置约束参数
            hingeConstraint.enableMotor()
            hingeConstraint.setMotorSpeed(0)
            hingeConstraint.setMotorMaxForce(1000)

            physicsManager.world.addConstraint(hingeConstraint)
            hingeConstraints.push(hingeConstraint)
          }
        }
      }
    })
  }
}
// 切换物理模拟状态
const togglePhysics = (value) => {
  physicsManager.world.bodies.forEach((body) => {
    body.wakeUp(); // 唤醒物体
  });
  isPhysicsActive.value = value
  setHingeConstraint()
}
// 重置场景
const reset = () => {

  try {
    physicsManager.world.bodies.forEach((body) => {
      const state = savedStates.get(body);
      if (state) {
        body.position.copy(state.position);
        body.quaternion.copy(state.quaternion);
        body.velocity.copy(state.velocity);
        body.angularVelocity.copy(state.angularVelocity);
        body.type = state.type
      }
      body.sleep()
    })


  } catch (error) {
    console.log(error, 3);
  }
}
const saveInitialStates = () => {
  physicsManager.world.bodies.forEach((body) => {
    if (!savedStates.has(body)) {
      savedStates.set(body, {
        position: body.position.clone(),
        quaternion: body.quaternion.clone(),
        velocity: body.velocity.clone(),
        angularVelocity: body.angularVelocity.clone(),
        type: body.type
      });
    }
    console.log(savedStates);

  });
}

</script>

<style scoped>
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