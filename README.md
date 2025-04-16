# create

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```



  // 保存场景状态
  async saveSceneState(state = {}) {
    const sceneState = {
      cubes: this.cubeManager.getAllCubes().map(cube => ({
        position: {
          x: cube.position.x,
          y: cube.position.y,
          z: cube.position.z
        },
        uuid: cube.uuid
      })),
      selectedCubes: (state.selectedCubes || []).map(cube => ({
        position: {
          x: cube.position.x,
          y: cube.position.y,
          z: cube.position.z
        },
        uuid: cube.uuid
      })),
      hingePoints: (state.selectedHinges || []).map(hinge => ({
        position: {
          x: hinge.position.x,
          y: hinge.position.y,
          z: hinge.position.z
        },
        uuid: hinge.uuid,
        status: hinge.userData?.status || false,
        connectedCubes: (hinge.userData?.connectedCubes || []).map(cube => cube.uuid)
      }))
    }
    const response = await fetch('/api/saveCubeData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(sceneState)
    })
    console.log(response);
  }

  // 加载场景状态
  async loadSceneState(importedState = null) {
    let sceneState = null

    // 如果有导入的状态，使用导入的状态
    if (importedState) {
      sceneState = importedState
    } else {
      // 否则从本地存储加载
      const response = await fetch('/api/getCubeData', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      const savedState = data

      if (!savedState) return null
      sceneState = savedState
    }


    // 恢复立方体
    if (sceneState.cubes && Array.isArray(sceneState.cubes)) {
      sceneState.cubes.forEach(cubeData => {
        const position = new THREE.Vector3(
          cubeData.position.x,
          cubeData.position.y,
          cubeData.position.z
        )
        const cube = this.cubeManager.createCube(position)
        cube.uuid = cubeData.uuid // 确保UUID一致
      })
    }

    // 恢复选中的立方体
    const selectedCubes = []
    if (sceneState.selectedCubes && Array.isArray(sceneState.selectedCubes)) {
      sceneState.selectedCubes.forEach(cubeData => {
        const cube = this.cubeManager.getCubeByUUID(cubeData.uuid)
        if (cube) {
          selectedCubes.push(cube)
        }
      })
    }

    // 恢复铰接点
    if (selectedCubes.length === 2) {
      const cameraControls = this.cubeManager.cameraControls
      if (cameraControls) {
        // 设置选中的立方体
        cameraControls.selectedCubes = selectedCubes
        // 创建铰链点
        cameraControls.createHingePoints()

        // 恢复铰接点状态
        if (sceneState.hingePoints && Array.isArray(sceneState.hingePoints)) {
          sceneState.hingePoints.forEach(hingeData => {
            const hinge = cameraControls.hingePoints.find(point =>
              point.position.distanceTo(new THREE.Vector3(
                hingeData.position.x,
                hingeData.position.y,
                hingeData.position.z
              )) < 0.1
            )
            if (hinge) {
              hinge.userData.status = hingeData.status
              hinge.material = hingeData.status ? selectedMaterial_Hinge : preMaterial_Hinge
              if (hingeData.status) {
                cameraControls.selectedHingePoints.push(hinge)
              }
            }
          })
        }
      }
    }

    return sceneState
  }



