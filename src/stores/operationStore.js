import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useOperationStore = defineStore('operation', () => {
    const message = ref('欢迎来到3D模型器')
    const type = ref('info') // 'info' | 'success' | 'error' | 'warning'

    function setMessage(newMessage, messageType = 'info') {
        message.value = newMessage
        type.value = messageType
    }

    return {
        message,
        type,
        setMessage
    }
}) 