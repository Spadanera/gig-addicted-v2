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

const tab = ref('details')
const band = ref<Band>({} as Band)
const showSetlist = ref(false)

function setBand(b: Band) {
    band.value = b
}

function toogleShowSetlist() {
    showSetlist.value = !showSetlist.value
}
</script>

<template>
    <div>
        <v-toolbar density="compact">
            <RouterLink to="/mybands">
                <v-btn v-if="$vuetify.display.smAndUp" variant="plain" text="TORNA ALLA LISTA"></v-btn>
                <v-btn v-else variant="plain" icon="mdi-arrow-left"></v-btn>
            </RouterLink>

            <v-spacer></v-spacer>

            <v-img style="max-width: 30px; max-height: 30px; margin-left: 6px;" v-if="band.logo"
                :src="band.logo"></v-img>

            <v-toolbar-title style="flex: none; margin-right: 26px; font-size: medium; margin-left: 10px;"
                :text="band.name"></v-toolbar-title>
        </v-toolbar>

        <div style="display: flex; align-items: center;">
            <v-btn v-if="$vuetify.display.xs && tab === 'setlist'" @click="toogleShowSetlist" icon="mdi-menu" variant="plain"
                style="margin-right: 4px;"></v-btn>

            <v-tabs grow v-model="tab" color="secondary" style="flex: 1;">
                <v-tab value="details">Dettagli</v-tab>
                <v-tab value="setlist">Repertorio</v-tab>
                <v-tab value="event">Eventi</v-tab>
                <v-tab value="member">Membri</v-tab>
            </v-tabs>
        </div>

        <v-tabs-window v-model="tab" style="border-top: 0.5px solid #E4E4E4;">
            <v-tabs-window-item value="details">
                <BandDetails @band="setBand" :band_id="props.band_id"></BandDetails>
            </v-tabs-window-item>

            <v-tabs-window-item value="setlist">
                <BandSetlist @tooglesetlist="toogleShowSetlist" :show-setlist="showSetlist" :band_id="props.band_id">
                </BandSetlist>
            </v-tabs-window-item>

            <v-tabs-window-item value="event">
                <BandEvent :band_id="props.band_id"></BandEvent>
            </v-tabs-window-item>

            <v-tabs-window-item value="member">
                <BandMember :band_id="props.band_id"></BandMember>
            </v-tabs-window-item>
        </v-tabs-window>
    </div>
</template>
