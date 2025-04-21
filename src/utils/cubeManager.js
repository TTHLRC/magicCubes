import * as THREE from 'three'
import { cubeConfig } from '../config/cubeConfig'
import { normalMaterial_Cone, selectedMaterial_Hinge } from '../config/materials'
import * as CANNON from 'cannon-es'
import { SceneStateManager } from './sceneStateManager'
import { PhysicsManager } from './physicsManager'
export class CubeManager {
  constructor(scene) {
    this.scene = scene
    this.cubes = new Map() // 使用Map存储立方体，key为位置字符串
    this.cubeBodies = new Map() // 存储立方体的物理体
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.coneControlGroup = new THREE.Group()
    this.coneControlArray = []
    this.fixedCubes = new Set()  // 存储固定的方块UUID
    this.scene.add(this.coneControlGroup)
    this.sceneStateManager = new SceneStateManager(this)  // 传入当前实例
    this.physicsManager = new PhysicsManager()
  }

  createCube(position) {
    const geometry = new THREE.BoxGeometry(cubeConfig.size, cubeConfig.size, cubeConfig.size)
    const material = new THREE.MeshStandardMaterial({
      color: cubeConfig.material.color,
      transparent: cubeConfig.material.transparent,
      opacity: cubeConfig.material.opacity,
      metalness: 0,
      roughness: 1,
      emissive: cubeConfig.material.color,
      emissiveIntensity: 0.2
    })
    const cube = new THREE.Mesh(geometry, material)
    cube.position.copy(position)
    cube.castShadow = true
    cube.receiveShadow = true
    cube.userData.isCube = true
    cube.userData.isFix = false  // 初始化时设置为未固定状态

    // 将立方体添加到场景
    this.scene.add(cube)

    // 存储立方体
    const key = `${position.x},${position.y},${position.z}`
    this.cubes.set(key, cube)

    // 创建物理体
    const physicsManager = this.physicsManager
    if (physicsManager) {
      const body = physicsManager.createCubeBody(cube)
      this.cubeBodies.set(cube.uuid, body)
      // 将物理体引用存储到立方体的 userData 中
      cube.userData.physicsBody = body
    } else {
      console.warn('Physics manager not found')
    }

    return cube
  }

  removeCube(cube) {
    if (cube) {
      // 从场景中移除
      this.scene.remove(cube)

      // 从Map中移除
      const key = `${cube.position.x},${cube.position.y},${cube.position.z}`
      this.cubes.delete(key)

      // 移除物理体
      const body = this.cubeBodies.get(cube.uuid)
      if (body) {
        const physicsManager = this.physicsManager
        if (physicsManager) {
          physicsManager.removeBody(body)
        }
        this.cubeBodies.delete(cube.uuid)
      }

      // 释放资源
      cube.geometry.dispose()
      cube.material.dispose()
    }
  }

  getCubeAtPosition(position) {
    const key = `${position.x},${position.y},${position.z}`
    return this.cubes.get(key)
  }

  // 检查位置是否已有立方体
  hasCubeAtPosition(position) {
    const key = `${position.x},${position.y},${position.z}`
    return this.cubes.has(key)
  }

  // 获取所有立方体
  getAllCubes() {
    return Array.from(this.cubes.values())
  }

  // 清理所有立方体
  clearAllCubes() {
    this.cubes.forEach(cube => {
      this.scene.remove(cube)
      cube.geometry.dispose()
      cube.material.dispose()
    })
    this.cubes.clear()
    this.cubeBodies.clear()
    this.clearControlCones()
  }

  getCubeByUUID(uuid) {
    for (const cube of this.cubes.values()) {
      if (cube.uuid === uuid) {
        return cube
      }
    }
    return null
  }

  createControlCones(center) {
    // 清除现有的控制圆锥体
    this.clearControlCones()

    // 创建圆锥体几何体
    const coneGeometry = new THREE.ConeGeometry(0.5, 1.0, 32)

    // 创建6个方向的圆锥体，位置在立方体外侧
    const cubeSize = cubeConfig.size  // 获取立方体大小
    const directions = [
      { position: [0, cubeSize / 2 + 1.0, 0], rotation: [0, 0, 0] },    // 上
      { position: [0, -cubeSize / 2 - 1.0, 0], rotation: [Math.PI, 0, 0] }, // 下
      { position: [-cubeSize / 2 - 1.0, 0, 0], rotation: [0, 0, Math.PI / 2] }, // 左
      { position: [cubeSize / 2 + 1.0, 0, 0], rotation: [0, 0, -Math.PI / 2] }, // 右
      { position: [0, 0, cubeSize / 2 + 1.0], rotation: [Math.PI / 2, 0, 0] }, // 前
      { position: [0, 0, -cubeSize / 2 - 1.0], rotation: [-Math.PI / 2, 0, 0] }  // 后
    ]

    directions.forEach(dir => {
      const cone = new THREE.Mesh(coneGeometry, normalMaterial_Cone)
      // 将圆锥体添加到控制组中
      this.coneControlGroup.add(cone)
      this.coneControlArray.push(cone)

      // 设置圆锥体的初始位置和旋转
      cone.position.set(
        dir.position[0],
        dir.position[1],
        dir.position[2]
      )
      cone.rotation.set(dir.rotation[0], dir.rotation[1], dir.rotation[2])
      cone.renderOrder = -1
      cone.userData.isControlCone = true
      cone.userData.relativePosition = new THREE.Vector3(...dir.position)
      cone.userData.relativeRotation = new THREE.Euler(...dir.rotation)
    })

    // 更新圆锥体组的位置到立方体中心
    this.coneControlGroup.position.copy(center)
  }

  clearControlCones() {
    this.coneControlArray.forEach(cone => {
      this.coneControlGroup.remove(cone)
      cone.geometry.dispose()
    })
    this.coneControlArray = []
  }
  getConeControlGroup() {
    return this.coneControlGroup
  }
  getConeControlArray() {
    return this.coneControlArray
  }

  updateControlCones(center) {
    if (this.coneControlArray.length > 0) {
      const directions = [
        [0, 1, 0], [0, -1, 0], [-1, 0, 0],
        [1, 0, 0], [0, 0, 1], [0, 0, -1]
      ]

      this.coneControlArray.forEach((cone, index) => {
        cone.position.set(
          center.x + directions[index][0],
          center.y + directions[index][1],
          center.z + directions[index][2]
        )
      })
    }
  }

  // 修改选中立方体的方法
  selectCube(cube) {
    if (cube) {
      // 创建控制圆锥体
      this.createControlCones(cube.position)
    }
  }

  // 修改取消选中立方体的方法
  deselectCube(cube) {
    if (cube) {
      // 清除控制圆锥体
      this.clearControlCones()
    }
  }

  // 设置方块为固定状态
  setFixed(cube, isFixed = true) {
    let isP = 0

    if (isFixed) {
      // 添加视觉提示（例如改变颜色）
      const fixedMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,  // 红色表示固定状态
        metalness: 0.5,
        roughness: 0.5,
        emissive: 0x808080,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8
      })
      this.sceneStateManager.scene.children.forEach(itme => {
        if (itme.uuid === cube.uuid) {
          this.fixedCubes.add(itme.uuid)
          itme.material = fixedMaterial
          itme.userData.isFix = true
        }
      })

    } else {
      this.fixedCubes.delete(cube.uuid)
      // 恢复物理体的属性
      if (cube.userData.physicsBody) {
        cube.userData.physicsBody.mass = 1  // 恢复原始质量
        cube.userData.physicsBody.updateMassProperties()
        cube.userData.physicsBody.type = CANNON.Body.DYNAMIC
      }
      // 恢复原始材质
      if (this.originalMaterials && this.originalMaterials.has(cube.uuid)) {
        cube.material = this.originalMaterials.get(cube.uuid);
        this.originalMaterials.delete(cube.uuid);
      } else {
        // 如果没有保存原始材质，创建新的材质
        const originalMaterial = new THREE.MeshStandardMaterial({
          color: 0x20B2AA,
          transparent: true,
          opacity: 0.8
        });
        cube.material = originalMaterial;
      }

      // 设置 isFix 字段为 false
      cube.userData.isFix = false
    }

    // 保存场景状态
    this.sceneStateManager.saveSceneState()
  }

  // 检查方块是否被固定
  isFixed(cube) {
    return this.fixedCubes.has(cube.uuid)
  }

  getCubeBody(cube) {
    const body = this.cubeBodies.get(cube.uuid)
    return body
  }

  // 添加更新圆锥体位置的方法
  updateControlConesPosition(cubePosition) {
    if (this.coneControlGroup) {
      this.coneControlGroup.position.copy(cubePosition)
    }
  }
} 