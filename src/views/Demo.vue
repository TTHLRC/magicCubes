<template>
  <div class="demo-container ">
    <NavBar />
    <div class="scene-container" ref="container"></div>
    <div class="tag mode-toolbar">
      <div @click="togglePhysics(true)">
        <i class="fas fa-play"></i>
      </div>
      <div @click="pause()">
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
const lastMouseX = ref(0)
const lastMouseY = ref(0)
// 存储铰接约束
let hingeConstraints = []

// 圆锥体交互相关
const isDraggingCone = ref(false)
const lastUpdateTime = ref(0)
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

// 判断圆锥体相对于立方体的位置
const getConePosition = (cone, cube) => {
  // 获取圆锥体的世界坐标位置
  const coneWorldPosition = new THREE.Vector3()
  cone.getWorldPosition(coneWorldPosition)

  // 获取立方体的世界坐标位置
  const cubeWorldPosition = new THREE.Vector3()
  cube.getWorldPosition(cubeWorldPosition)

  // 计算相对位置
  const relativePosition = new THREE.Vector3()
  relativePosition.subVectors(coneWorldPosition, cubeWorldPosition)

  // 计算各个方向的分量
  const x = relativePosition.x
  const y = relativePosition.y
  const z = relativePosition.z

  // 设置一个阈值，用于判断是否在某个方向上
  const threshold = 0.1

  // 判断位置
  if (Math.abs(x) > Math.abs(y) && Math.abs(x) > Math.abs(z)) {
    // 左右方向
    return x > threshold ? 'right' : 'left'
  } else if (Math.abs(y) > Math.abs(x) && Math.abs(y) > Math.abs(z)) {
    // 上下方向
    return y > threshold ? 'up' : 'down'
  } else if (Math.abs(z) > Math.abs(x) && Math.abs(z) > Math.abs(y)) {
    // 前后方向
    return z > threshold ? 'front' : 'back'
  } else {
    // 如果分量相近，根据圆锥体的旋转来判断
    const rotation = cone.rotation
    if (Math.abs(rotation.x) > Math.abs(rotation.y) && Math.abs(rotation.x) > Math.abs(rotation.z)) {
      return rotation.x > 0 ? 'front' : 'back'
    } else if (Math.abs(rotation.y) > Math.abs(rotation.x) && Math.abs(rotation.y) > Math.abs(rotation.z)) {
      return rotation.y > 0 ? 'up' : 'down'
    } else {
      return rotation.z > 0 ? 'right' : 'left'
    }
  }
}

// 处理鼠标按下事件
const handleMouseDown = (event) => {
  // 只检查左键点击
  if (event.button !== 0) return
  lastMouseX.value = event.clientX
  lastMouseY.value = event.clientY
  // 计算鼠标在归一化设备坐标中的位置
  const rect = container.value.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  // 更新射线
  raycaster.setFromCamera(mouse, sceneUtils.camera)

  // 检查是否点击到圆锥体
  const conesGroup = sceneUtils.cameraControls.cubeManager.getConeControlGroup()
  if (!conesGroup) {
    console.warn('No cone control group found')
    return
  }

  // 确保圆锥体组中的所有对象都是可交互的
  conesGroup.traverse((child) => {
    if (child.isMesh) {
      child.visible = true
    }
  })
  const coneIntersects = raycaster.intersectObjects(conesGroup.children, true)

  if (coneIntersects.length > 0) {
    const clickedCone = coneIntersects[0].object
    const selectedCube = sceneUtils.getSelectedCubes()[0]

    let conePosition, forceDirection
    if (selectedCube) {
      conePosition = getConePosition(clickedCone, selectedCube)
      console.log(conePosition);

      if (conePosition === 'right') {
        forceDirection = new THREE.Vector3(1, 0, 0) // 向右
      } else if (conePosition === 'left') {
        forceDirection = new THREE.Vector3(-1, 0, 0) // 向左
      } else if (conePosition === 'up') {
        forceDirection = new THREE.Vector3(0, 1, 0) // 向上
      } else if (conePosition === 'down') {
        forceDirection = new THREE.Vector3(0, -1, 0) // 向下
      } else if (conePosition === 'front') {
        forceDirection = new THREE.Vector3(0, 0, 1) // 向前
      } else if (conePosition === 'back') {
        forceDirection = new THREE.Vector3(0, 0, -1) // 向后
      }
    }
    // 处理其他物体
    physicsManager.world.bodies.forEach((body, index) => {
      // 检查该物体是否在约束中
      const isConstrained = hingeConstraints.some(constraint =>
        constraint.bodyA === body || constraint.bodyB === body
      )

      if (body.isFix && isConstrained) {
        body.sleep()
        body.type = CANNON.Body.STATIC
        body.velocity.set(0, 0, 0)
        body.angularVelocity.set(0, 0, 0)
        body.force.set(0, 0, 0)
        body.torque.set(0, 0, 0)
      }
      if (isConstrained && !body.isFix) {
        body.wakeUp()
        body.mass = 1
        body.updateMassProperties()
        body.type = CANNON.Body.DYNAMIC
      }
      if (!isConstrained) {
        body.sleep()
      }
      // 重置速度和角速度
      body.velocity.set(0, 0, 0)
      body.angularVelocity.set(0, 0, 0)
      body.force.set(0, 0, 0)
      body.torque.set(0, 0, 0)
    })

    // 设置重力方向
    if (forceDirection) {
      physicsManager.world.gravity.set(
        forceDirection.x,
        forceDirection.y,
        forceDirection.z
      )
    }
  }
}

// 处理鼠标移动事件
const handleMouseMove = (event) => {
  if (!isDraggingCone.value) return
  // 根据圆锥体的位置确定力的方向
}

// 处理鼠标释放事件
const handleMouseUp = () => {

  // 处理其他物体
  physicsManager.world.bodies.forEach((body, index) => {

    const isConstrained = hingeConstraints.some(constraint =>
      constraint.bodyA === body || constraint.bodyB === body
    )
    if (isConstrained) {
      body.sleep()
    }
  })
}

onMounted(() => {
  // 初始化场景
  sceneUtils = new SceneUtils(container.value)
  sceneUtils.initScene()

  // 隐藏网格和地板
  sceneUtils.setGridVisible(false)
  sceneUtils.setGroundVisible(false)

  // 设置为演示模式并禁用创建和删除功能
  if (sceneUtils.cameraControls) {
    sceneUtils.cameraControls.setMode(SceneMode.DEMO)
    sceneUtils.cameraControls.enabled = false
  }

  // 初始化物理世界
  physicsManager = new PhysicsManager()

  // 将场景中现有的立方体添加到物理世界
  const addCubesToPhysics = (object) => {
    const scene_stateIsFix = JSON.parse(localStorage.getItem('scene_state'))
    container.value.style.touchAction = 'none' // 防止移动端干扰
    container.value.focus() // 确保元素获取焦点

    // 检查是否是立方体
    if (object.type === 'Mesh' && object.geometry.type === "BoxGeometry") {
      object.userData.isCube = true
      if (scene_stateIsFix.cubes[0].isFix && scene_stateIsFix.cubes[0].uuid == object.uuid) {
        object.userData.isFix = true
      }
      try {
        const body = physicsManager.createCubeBody(object)
        // 如果是固定状态，设置物理体为静态
        if (object.userData.isFix) {
          body.isFix = true
          body.mass = 0
          body.updateMassProperties()
          body.type = CANNON.Body.STATIC
          // 确保速度和角速度都为零
          body.velocity.set(0, 0, 0)
          body.angularVelocity.set(0, 0, 0)
          body.force.set(0, 0, 0)
          body.torque.set(0, 0, 0)
          body.collisionResponse = true
          const boxShape = new CANNON.Box(new CANNON.Vec3(1, 1, 1)); // 定义碰撞体形状
          body.addShape(boxShape);
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

  // 修改动画循环
  const animate = () => {
    requestAnimationFrame(animate)

    // 无论物理是否激活，都更新物理世界
    if (isPhysicsActive.value) {
      // 更新物理世界
      physicsManager.update(1 / 60)

      // 同步所有立方体的物理状态
      cubeBodies.forEach((body, cube) => {
        if (body.mass > 0) { // 只同步动态物体
          physicsManager.syncPhysicsToGraphics(cube, body)
          // 如果这个立方体被选中，更新其圆锥体的位置
          if (sceneUtils.getSelectedCubes().includes(cube)) {
            sceneUtils.cameraControls.cubeManager.updateControlConesPosition(cube.position)
          }
        }
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
  window.removeEventListener('resize', () => sceneUtils.onWindowResize())
  container.value.removeEventListener('mousedown', handleMouseDown)
  container.value.removeEventListener('mousemove', handleMouseMove)
  container.value.removeEventListener('mouseup', handleMouseUp)
})

const calculateHingeConstraint = (cube1, cube2, hingeInfo) => {
  if (!cube1 || !cube2 || !hingeInfo || !hingeInfo.position) {
    console.error('Invalid parameters for hinge constraint calculation:', { cube1, cube2, hingeInfo })
    return null
  }

  // 计算支点位置（世界坐标转局部坐标）
  const pivotWorld = new THREE.Vector3(
    hingeInfo.position.x,
    hingeInfo.position.y,
    hingeInfo.position.z
  )

  const cube1Pos = new THREE.Vector3().copy(cube1.position)
  const cube2Pos = new THREE.Vector3().copy(cube2.position)

  const pivotLocal1 = pivotWorld.clone().sub(cube1Pos)
  const pivotLocal2 = pivotWorld.clone().sub(cube2Pos)

  // 根据铰链位置确定旋转轴
  let axis = new THREE.Vector3(0, 1, 0) // 默认使用Y轴
  if (hingeInfo.edge === 'back' || hingeInfo.edge === 'front') {
    axis = new THREE.Vector3(0, 1, 0) // 前后边缘使用Y轴
  } else if (hingeInfo.edge === 'left' || hingeInfo.edge === 'right') {
    axis = new THREE.Vector3(1, 0, 0) // 左右边缘使用X轴
  } else if (hingeInfo.edge === 'top' || hingeInfo.edge === 'bottom') {
    axis = new THREE.Vector3(0, 0, 1) // 上下边缘使用Z轴
  }

  // 将轴转换到局部坐标系
  const cube1Quaternion = new THREE.Quaternion()
  cube1.getWorldQuaternion(cube1Quaternion)
  const cube2Quaternion = new THREE.Quaternion()
  cube2.getWorldQuaternion(cube2Quaternion)

  const localAxis1 = axis.clone().applyQuaternion(cube1Quaternion)
  const localAxis2 = axis.clone().applyQuaternion(cube2Quaternion)

  return {
    pivotA: new CANNON.Vec3(pivotLocal1.x, pivotLocal1.y, pivotLocal1.z),
    pivotB: new CANNON.Vec3(pivotLocal2.x, pivotLocal2.y, pivotLocal2.z),
    axisA: new CANNON.Vec3(localAxis1.x, localAxis1.y, localAxis1.z),
    axisB: new CANNON.Vec3(localAxis2.x, localAxis2.y, localAxis2.z)
  }
}

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
            hingeConstraint.disableMotor()
            hingeConstraint.collideConnected = true // 启用约束体之间的碰撞检测

            // 设置约束限制
            hingeConstraint.enableLimit = false // 禁用旋转限制
            hingeConstraint.lowerLimit = -Math.PI * 2 // 允许360度旋转
            hingeConstraint.upperLimit = Math.PI * 2

            // 设置约束刚度
            hingeConstraint.stiffness = 0.1 // 降低约束刚度
            hingeConstraint.damping = 0.1 // 降低约束阻尼

            physicsManager.world.addConstraint(hingeConstraint)
            hingeConstraints.push(hingeConstraint)
          }
        }
      }
    })
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


// 切换物理模拟状态
const togglePhysics = (value) => {
  isPhysicsActive.value = value
  setHingeConstraint()
  // 获取场景状态

  physicsManager.world.bodies.forEach((body) => {
    // 检查该物体是否在约束中
    const isConstrained = hingeConstraints.some(constraint =>
      constraint.bodyA === body || constraint.bodyB === body
    )

    if (isConstrained) {
      // 如果有约束，设置为静态
      body.mass = 0
      body.updateMassProperties()
      body.type = CANNON.Body.STATIC
      body.velocity.set(0, 0, 0)
      body.angularVelocity.set(0, 0, 0)
      body.force.set(0, 0, 0)
      body.torque.set(0, 0, 0)
    } else {
      // 如果没有约束，设置为动态并唤醒
      body.wakeUp()
      body.mass = 1
      body.updateMassProperties()
      body.type = CANNON.Body.DYNAMIC
    }
  })
}
//暂停
const pause = () => {
  physicsManager.world.bodies.forEach((body) => {
    body.sleep()
  })
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