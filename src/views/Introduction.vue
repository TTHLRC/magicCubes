<template>
    <div>
      <div class="intro-container" :class="{ 'disabled-mode': !isLoggedIn }">
        <div class="intro-section">
          <h2>About Magic Cubes</h2>
          <p>Magic Cubes is an innovative 3D voxel editor and physics simulation platform that allows users to easily create, edit, and simulate the motion of 3D models. Whether you're a designer, engineer, or just a 3D modeling enthusiast, we provide intuitive and powerful tools for your creative needs.</p>
        </div>
    
        <div class="intro-section">
          <h2>Key Features</h2>
          <div class="feature-grid">
            <div class="feature-card" v-for="(feature, index) in features" :key="index">
              <i :class="feature.icon"></i>
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.description }}</p>
            </div>
          </div>
        </div>
    
        <div class="intro-section">
          <h2>Technical Highlights</h2>
          <p>Magic Cubes is built with the latest web technologies, including:</p>
          <ul>
            <li v-for="(tech, index) in technicalHighlights" :key="index">{{ tech }}</li>
          </ul>
        </div>
      </div>
  
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const isLoggedIn = ref(false)
  
  const features = [
    {
      icon: 'fas fa-cube',
      title: 'Voxel Editing',
      description: 'An intuitive voxel editing system supporting basic operations like adding, deleting, and copying blocks, making 3D modeling simple and easy to understand.'
    },
    {
      icon: 'fas fa-cogs',
      title: 'Physics Simulation',
      description: 'Motion simulation based on a real physics engine, accurately calculating and displaying the physical behavior of your models.'
    },
    {
      icon: 'fas fa-link',
      title: 'Joint System',
      description: 'A powerful joint system for building complex mechanical structures and motion patterns.'
    },
    {
      icon: 'fas fa-file-export',
      title: 'Export Functionality',
      description: 'Supports exporting to multiple 3D file formats for use in other software or further editing.'
    }
  ]
  
  const technicalHighlights = [
    'Three.js for high-performance 3D rendering',
    'Cannon.js for accurate physics simulation',
    'Modern user interface design',
    'Responsive layout that supports all devices'
  ]
  </script>
  
  <style scoped>
        body {
            background-color: var(--secondary-color);
            font-family: 'Poppins', 'Helvetica Neue', Arial, sans-serif;
        }
        
        .intro-container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 2rem;
            background: rgba(26, 26, 26, 0.95);
            border-radius: 15px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            border: 1px solid;
            border-image: linear-gradient(45deg, var(--gradient-start), var(--gradient-end)) 1;
        }
        
        .intro-section {
            margin-bottom: 3rem;
        }
        
        .intro-section h2 {
            color: var(--primary-color);
            margin-bottom: 1.5rem;
            font-size: 2rem;
            font-weight: 600;
            border-bottom: 2px solid;
            border-image: linear-gradient(to right, var(--gradient-start), var(--gradient-end)) 1;
            padding-bottom: 0.5rem;
        }
        
        .intro-section p {
            color: #fff;
            line-height: 1.6;
            margin-bottom: 1rem;
        }
        
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }
        
        .feature-card {
            background: linear-gradient(145deg, #1e1e1e, #0a0a0a);
            padding: 1.5rem;
            border-radius: 10px;
            box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.3),
                      -5px -5px 10px rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 215, 0, 0.1);
            transition: all 0.3s ease;
        }
        
        .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(255, 215, 0, 0.2);
        }
        
        .feature-card i {
            font-size: 2rem;
            color: var(--primary-color);
            margin-bottom: 1rem;
        }
        
        .feature-card h3 {
            color: var(--primary-color);
            margin-bottom: 1rem;
            font-weight: 500;
        }
        
        .feature-card p {
            color: #fff;
        }
        
        .intro-section ul {
            color: #fff;
            list-style-position: inside;
            padding-left: 1rem;
        }
        
        .intro-section li {
            margin-bottom: 0.5rem;
            position: relative;
            padding-left: 1.5rem;
        }
        
        .intro-section li::before {
            content: '•';
            color: var(--primary-color);
            position: absolute;
            left: 0;
        }
        
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

        .disabled-mode .intro-container {
            pointer-events: none;
            filter: blur(5px);
        }
    </style>