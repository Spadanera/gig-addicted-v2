<script setup lang="ts">
import type { Roles } from '../../../../models/src'


defineProps(['member', 'canedit'])

const emit = defineEmits(['editmember', 'removemember'])

// Map role to chip colors
const roleColor = (role:Roles) => {
    switch (role.toLowerCase()) {
        case 'owner':
            return 'deep-purple'
        case 'editor':
            return 'blue'
        case 'viewer':
            return 'grey'
        default:
            return 'grey'
    }
}
</script>

<template>
    <v-card>
        <v-card-subtitle v-if="!member.username">
            In attesa accettazione invito
        </v-card-subtitle>
        <v-card-text>
            <v-row no-gutters :align="'center'">
                <v-col cols="auto" v-if="member.username">
                    <v-avatar size="64">
                        <v-img :src="member.avatar" alt="Avatar" />
                    </v-avatar>
                </v-col>
    
                <v-col>
                    <div class="text-h6">{{ member.username ? member.username : member.email.split("|")[0] }}</div>
                    <v-chip v-if="canedit" v-for="role in member.role" size="small" :color="roleColor(role)" text-color="white" class="mt-1">
                        {{ role }}
                    </v-chip>
                </v-col>
            </v-row>
    
            <v-divider class="my-3" v-if="member.instrument && member.instrument.length"></v-divider>
            <div class="d-flex flex-wrap gap-2">
                <v-chip v-for="(instrument, index) in member.instrument" :key="index" color="primary" variant="outlined"
                    size="small">
                    {{ instrument }}
                </v-chip>
            </div>
        </v-card-text>
        <v-card-actions v-if="canedit">
            <v-spacer></v-spacer>
            <v-btn variant="plain" @click="emit('editmember', member)">MODIFICA</v-btn>
            <v-btn v-if="member.role && !member.role.includes('owner')" color="danger" variant="plain" @click="emit('removemember', member)">ELIMINA</v-btn>
        </v-card-actions>
    </v-card>
</template>

<style scoped>
.gap-2 {
    gap: 8px;
}
</style>
