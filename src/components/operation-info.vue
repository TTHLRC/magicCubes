<template>
    <div class="operation-info">
        <div class="info-content" :class="type">
            <i class="fas fa-info-circle"></i>
            <span id="operation-message">{{ message }}</span>
        </div>
    </div>
</template>

<script setup>
import { useOperationStore } from '../stores/operationStore'
import { storeToRefs } from 'pinia'

const operationStore = useOperationStore()
const { message, type } = storeToRefs(operationStore)
</script>

<style scoped>
/* 操作信息提示框样式 */
.operation-info {
    position: absolute;
    bottom: 30px;
    right: 30px;
    z-index: 100;
}

.info-content {
    background: linear-gradient(145deg, rgba(40, 40, 40, 0.85), rgba(20, 20, 20, 0.95));
    padding: 12px 30px;
    border-radius: 12px;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.95);
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: all 0.3s ease;
    min-width: 300px;
    letter-spacing: 0.3px;
    font-weight: 500;
}

.info-content i {
    font-size: 1.1rem;
    background: linear-gradient(to right, var(--gradient-start), var(--gradient-end));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
}

.info-content.success {
    border: 1px solid rgba(76, 175, 80, 0.3);
    border-left: 4px solid #4CAF50;
    background: linear-gradient(145deg, rgba(40, 40, 40, 0.85), rgba(20, 40, 20, 0.95));
}

.info-content.error {
    border: 1px solid rgba(244, 67, 54, 0.3);
    border-left: 4px solid #f44336;
    background: linear-gradient(145deg, rgba(40, 40, 40, 0.85), rgba(40, 20, 20, 0.95));
}

.info-content.warning {
    border: 1px solid rgba(255, 152, 0, 0.3);
    border-left: 4px solid #ff9800;
    background: linear-gradient(145deg, rgba(40, 40, 40, 0.85), rgba(40, 30, 20, 0.95));
}

/* 添加文本动画效果 */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

#operation-message {
    animation: fadeIn 0.3s ease-out;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
