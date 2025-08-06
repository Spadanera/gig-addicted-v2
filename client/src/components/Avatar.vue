<script setup lang="ts">
import { onMounted } from 'vue';
import type { User } from '../../../models/src'
import Axios from '@/services/client'
const axios = new Axios()

const props = defineProps<{
    user: User,
    size?: string,
    alt?: boolean,
    start?: boolean
}>()

onMounted(async () => {
    
})
</script>

<template>
    <v-avatar :color="user.avatar ? 'default' : 'red'" :size="size" :start="start" v-if="user.username">
        <v-img :alt="user.username" :src="user.avatar"></v-img>
        <!-- <span v-else-if="user.username && alt">{{ user.username[0] }}</span> -->
    </v-avatar>
</template>