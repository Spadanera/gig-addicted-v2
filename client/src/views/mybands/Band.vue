<script setup lang="ts">
import { ref } from 'vue'
import Axios from '@/services/client'
import { UserStore } from '@/stores'
import BandDetails from '@/components/band/BandDetails.vue'
import BandEvent from '@/components/band/BandEvent.vue'
import BandMember from '@/components/band/BandMember.vue'
import BandSetlist from '@/components/band/BandSetlist.vue'
import { type Band } from '../../../../models/src'

const userStore = UserStore()
const axios: Axios = new Axios()

const props = defineProps(['band_id'])

const tab = ref(null)
const band = ref<Band>({} as Band)

function setBand(b: Band) {
    band.value = b
}

</script>

<template>
    <main>
        <v-toolbar>
            <v-img style="max-width: 50px; max-height: 50px; margin-left: 6px;" v-if="band.logo" :src="band.logo"></v-img>
            <v-toolbar-title :text="band.name"></v-toolbar-title>
            <RouterLink to="/mybands">
                <v-btn icon="mdi-close" variant="plain"></v-btn>
            </RouterLink>
        </v-toolbar>
        <v-tabs grow v-model="tab">
            <v-tab value="details">Dettagli</v-tab>
            <v-tab value="setlist">Repertorio</v-tab>
            <v-tab value="event">Eventi</v-tab>
            <v-tab value="member">Membri</v-tab>
        </v-tabs>
        <v-tabs-window v-model="tab">
            <v-tabs-window-item value="details">
                <BandDetails @band="setBand" :band_id="props.band_id"></BandDetails>
            </v-tabs-window-item>
            <v-tabs-window-item value="setlist">
                <BandSetlist :band_id="props.band_id"></BandSetlist>
            </v-tabs-window-item>
            <v-tabs-window-item value="event">
                <BandEvent :band_id="props.band_id"></BandEvent>
            </v-tabs-window-item>
            <v-tabs-window-item value="member">
                <BandMember :band_id="props.band_id"></BandMember>
            </v-tabs-window-item>
        </v-tabs-window>
    </main>
</template>
