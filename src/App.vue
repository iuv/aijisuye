<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useSkinStore } from '@/stores/skin'

const skinStore = useSkinStore()

onMounted(() => {
  skinStore.loadSavedSkin()
})
</script>
