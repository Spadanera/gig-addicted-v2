<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Axios from '@/services/client'
import { UserStore } from '@/stores'
import { type Song } from '../../../../models/src'

const userStore = UserStore()
const axios: Axios = new Axios()
const repertoire = ref<Song[]>([])

const props = defineProps(['band_id'])

async function load() {
    repertoire.value = await axios.GetRepertoire(props.band_id)
}

onMounted(async () => {
    await load()
})

</script>

<template>
    <main>
        <v-container>
            <v-row justify="center">
                <v-col sm="8" cols="12" lg="3">
                    <v-card>
                        <v-card-text style="text-align: center;">
                            
                        </v-card-text>
                        <v-card-actions>
                            
                        </v-card-actions>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </main>
</template>
