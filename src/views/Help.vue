<template>
  <div>

    <div class="help-container" :class="{ 'disabled-mode': !isLoggedIn }">
      <div class="help-section">
        <h2>Quick Start</h2>
        <p>Welcome to Magic Cubes! This guide will help you quickly get started with our 3D editor of Voxels.</p>
        
        <div class="tutorial-step">
          <h4>Home Page</h4>
          <p>- Full Screen -- Click the first button at left sidebar of Home page</p>
          <p>- Split View -- Click the second button at left sidebar of Home page</p>
          <p>- export -- Click the third button at the left sidebar of Home page</p>
          <p>- import -- Click the fourth button at the left sidebar of Home page</p>
        </div>
        
        <div class="tutorial-step">
          <h4>Creation Mode</h4>
          <p>- Create Voxels -- Control + Click left mouse button</p>
          <p>- Remove Voxels -- Click right mouse button</p>
          <p>- Fix the Voxel created first -- Click the first button at the left sidebar in Creation mode</p>
          <p>- Adjust camera view -- W/S/A/D/Shift/Space and Click the left mouse button </p>
          <p>- Select Creation Layer -- Click up or down buttons</p>
        </div>
        
        <div class="tutorial-step">
          <h4>Hinge Mode</h4>
          <p>- Choose Voxels -- Control + Click left mouse button</p>
          <p>- Create Hinges -- Control + Click left mouse button</p>
          <p>- Comfirm hinges Creation -- Click the first button at the left sidebar in Hinge mode</p>
        </div>

        <div class="tutorial-step">
          <h4>Demo Mode</h4>
          <p>- Choose Voxels -- Control + Click left mouse button</p>
          <p>- Apply force -- Control + Click left mouse button of one of six cones</p>
          <p>- Stop Choosing -- Click the right mouse button </p>
          <p>- Start Simulation -- Click the first button at the left sidebar in Demo mode</p>
          <p>- Stop Simulation -- Click the second button at the left sidebar in Demo mode</p>
          <p>- Reset Simulation -- Click the third button at the left sidebar in Demo mode</p>
        </div>
      </div>

      <div class="help-section">
        <h2>Shortcut Guide</h2>
        <div class="shortcut-grid">
          <div class="shortcut-item" v-for="(shortcut, index) in shortcuts" :key="index">
            <span>{{ shortcut.action }}</span>
            <span class="shortcut-key">{{ shortcut.key }}</span>
          </div>
        </div>
      </div>

      <div class="help-section">
        <h2>Mode Description</h2>
        
        <h3>Creation Mode</h3>
        <p>In Creation Mode, you can freely add, delete, and edit blocks to build your desired 3D model. Main features include:</p>
        <ul>
          <li>Add Blocks: Control + Click left mouse button on the grid to place a block.</li>
          <li>Delete Blocks: Select the block you want to remove and click the right mouse button. </li>
          <li>Fix the First Block: Click the first button at the left sidebar in Creation mode. </li>
        </ul>

        <h3>Hinge Mode</h3>
        <p>Hinge Mode allows you to add hinges to your model, creating movable mechanical structures:</p>
        <ul>
          <li>Add Hinges: Add a Hinge to selected blocks (two blocks who are neighbours).</li>
        </ul>

        <h3>Demo Mode</h3>
        <p>In Presentation Mode, you can simulate the model's movement as it would behave in the real world. You can play, pause, and reset the simulation.</p>
        <ul>
          <li>Start Simulation: All voxels are affected by gravity and will move accordingly. However, the first voxel is fixed (with zero mass), ensuring that the entire structure can float. Therefore, it is important to remember to fix the initial voxel.</li>
          <li>Pause/Resume: Control the exsitence of gravity.</li>
          <li>Reset: Restore the model to its initial state</li>
        </ul>

        <h3>Split-View Mode</h3>
        <p>In Split-View Mode: our AI algorithm can automatically check whether your intended deformation is feasible. If it is, the AI will provide you with a solution to achieve it.</p>
        <ul>
          <li>Import Initial State: Import the model created in Creation Mode into the initial state by Clicking the third button at the left sidebar in Creation Mode</li>
          <li>Import Target State: Import the model created in Creation Mode into the target state by Clicking the fourth button at the left sidebar in Creation Mode</li>
          <li>Get the Solution from the AI: Obtain feasibility and solution by Clicking the button in the .</li>
        </ul>
      </div>

      <div class="help-section">
        <h2>FAQ</h2>
        
        <h3>Q: How do I save my creation?</h3>
        <p>A: Click the export button in the toolbar and your creation will export as a qsl file.</p>
        
        <h3>Q: How do I use the split view?</h3>
        <p>A: Click the split view button in the toolbar and you could use the tow buttons at Creation mode to import the initial state and target state. </p>
        
        <h3>Q: How do I check or get the path from the initial state to the target state?</h3>
        <p>A: Once the initial and target states are set, the system will automatically calculate the optimal motion path if it exists. And you could follow the path to add all the hinges and simulate at our web manually.</p>
      </div>

      <div class="tutorial-step">
        <h4>Kind Reminder</h4>
        <p>- If you run into any problems, feel free to reach out to the developer at: tth20021001@gmail.com </p>
      </div>
    </div>

    <div class="overlay" v-if="!isLoggedIn"></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const isLoggedIn = ref(false)

const shortcuts = [
  { action: 'Rotate View', key: 'Left Mouse Drag' },
  { action: 'Create Voxels', key: 'Ctrl + Left Mouse Drag' },
  { action: 'Delete Voxels', key: 'Right Mouse Grag' },
  { action: 'Choose Voxels', key: 'Ctrl + Left Mouse Drag' }
]

const showLoginDialog = () => {
  loginDialog.value.show()
}

const handleLoginSuccess = () => {
  isLoggedIn.value = true
}

const handleLogout = () => {
  isLoggedIn.value = false
}
</script>

<style scoped>
        body {
            background-color: var(--secondary-color);
            font-family: 'Poppins', 'Helvetica Neue', Arial, sans-serif;
        }
        
        .help-container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 2rem;
            background: rgba(26, 26, 26, 0.95);
            border-radius: 15px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            border: 1px solid;
            border-image: linear-gradient(45deg, var(--gradient-start), var(--gradient-end)) 1;
        }
        
        .help-section {
            margin-bottom: 3rem;
        }
        
        .help-section h2 {
            color: var(--primary-color);
            margin-bottom: 1.5rem;
            font-size: 2rem;
            font-weight: 600;
            border-bottom: 2px solid;
            border-image: linear-gradient(to right, var(--gradient-start), var(--gradient-end)) 1;
            padding-bottom: 0.5rem;
        }
        
        .help-section h3 {
            color: var(--primary-color);
            margin: 1.5rem 0 1rem;
            font-size: 1.5rem;
            font-weight: 500;
        }
        
        .help-section p {
            color: #fff;
            line-height: 1.6;
            margin-bottom: 1rem;
        }
        
        .shortcut-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin: 1rem 0;
        }
        
        .shortcut-item {
            background: linear-gradient(145deg, #1e1e1e, #0a0a0a);
            padding: 1rem;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.3),
                      -5px -5px 10px rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 215, 0, 0.1);
            transition: all 0.3s ease;
            color: #fff;
        }
        
        .shortcut-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(255, 215, 0, 0.2);
        }
        
        .shortcut-key {
            background: rgba(255, 215, 0, 0.1);
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-family: 'Poppins', monospace;
            font-weight: 500;
            color: var(--primary-color);
            border: 1px solid var(--primary-color);
        }
        
        .tutorial-step {
            background: linear-gradient(145deg, #1e1e1e, #0a0a0a);
            padding: 1.5rem;
            border-radius: 10px;
            margin-bottom: 1rem;
            box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.3),
                      -5px -5px 10px rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 215, 0, 0.1);
            transition: all 0.3s ease;
        }
        
        .tutorial-step:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(255, 215, 0, 0.2);
        }
        
        .tutorial-step h4 {
            color: var(--primary-color);
            margin-bottom: 0.5rem;
            font-weight: 500;
            font-size: 1.2rem;
        }
        
        .tutorial-step p {
            color: #fff;
            margin-bottom: 0.5rem;
            padding-left: 1rem;
        }
        
        .help-section ul {
            color: #fff;
            list-style-position: inside;
            padding-left: 1rem;
        }
        
        .help-section li {
            margin-bottom: 0.5rem;
            position: relative;
            padding-left: 1.5rem;
        }
        
        .help-section li::before {
            content: '•';
            color: var(--primary-color);
            position: absolute;
            left: 0;
        }

        /* 添加用户菜单样式 */
        .user-menu {
            position: relative;
            display: inline-block;
        }

        .user-menu-content {
            display: none;
            position: absolute;
            right: 0;
            top: 100%;
            background: rgba(0, 0, 0, 0.95);
            min-width: 160px;
            box-shadow: 0 8px 16px rgba(0,0,0,0.2);
            border-radius: 8px;
            padding: 8px 0;
            z-index: 1000;
        }

        .user-menu.active .user-menu-content {
            display: block;
        }

        .user-menu-content a {
            color: #FFD700;
            padding: 12px 16px;
            text-decoration: none;
            display: block;
            transition: background-color 0.3s;
        }

        .user-menu-content a:hover {
            background-color: rgba(255, 215, 0, 0.1);
        }

        .overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 999;
            display: none;
        }

        .overlay::after {
            content: '请先登录';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #FFD700;
            font-size: 24px;
            font-weight: bold;
        }

        .disabled-mode {
            overflow: hidden;
        }

        .disabled-mode .help-container {
            pointer-events: none;
            filter: blur(5px);
        }
    </style>