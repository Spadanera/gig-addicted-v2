<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import Axios from '@/services/client'
import { UserStore } from '@/stores'
import { type Setlist, type SetlistSong, type Song } from '../../../../models/src'
import { requiredRule, positiveIntegerRule, validUrlRule, formatSecondsToMinutesSeconds, formatSecondsToHoursMinutesSeconds, copy } from "@/services/utils"

const props = defineProps(['band_id'])

const userStore = UserStore()
const axios: Axios = new Axios()
const setlists = ref<Setlist[]>([{
    id: 0,
    band_id: props.band_id,
    name: 'REPERTORIO',
    songs: [],
    duration: 0
} as Setlist])
const songDialog = ref<boolean>(false)
const dialogSong = ref<Song>()
const songform = ref(null)
const confirmRemoveSong = ref(null)
const setlistDialog = ref<boolean>(false)
const dialogSetlist = ref<Setlist>(null)
const setlistform = ref(null)
const confirmRemoveSetlist = ref(null)
const confirmDeleteSetlist = ref(false)
const selectedSetlistId = ref([0])

const songHeaders = ref([
    { title: 'Nome', value: 'name' },
    { title: 'Artista', value: 'artist' },
    { title: 'Durata', value: 'duration' },
    { title: 'Link', value: 'link' },
])

const selectedSetlist = computed(() =>
    setlists.value.find(s => s.id === selectedSetlistId.value[0]) ?? null
)

async function load() {
    await loadReperoire()

    const templates = await axios.GetSetlistTemplates(props.band_id)
    setlists.value = [
        setlists.value[0],
        ...templates
    ]

    selectedSetlistId.value[0] = setlists.value.length ? setlists.value[0].id : null
}

async function loadReperoire() {
    setlists.value[0].songs = await axios.GetRepertoire(props.band_id)

}

async function removeSong() {
    dialogSong.value.removed = true
    confirmRemoveSong.value = false
    await axios.EditSongInRepertorire(dialogSong.value)
    setlists.value[0].songs = await axios.GetRepertoire(props.band_id)
    songDialog.value = false
}

function upsertSongDialog(song?: Song) {
    if (song) {
        dialogSong.value = copy(song)
    }
    else {
        dialogSong.value = {
            band_id: props.band_id
        } as Song
    }
    songDialog.value = true
}

async function upsertSongToRepertoire() {
    const { valid } = await songform.value?.validate()
    if (valid) {
        if (dialogSong.value.id) {
            await axios.EditSongInRepertorire(dialogSong.value)
        }
        else {
            await axios.InsertSongIntoRepertoire(dialogSong.value)
        }
        setlists.value[0].songs = await axios.GetRepertoire(props.band_id)
        songDialog.value = false
    }
}

function upsertSetlistDialog(setlist?: Setlist) {
    if (setlist) {
        dialogSetlist.value = copy(setlist)
    }
    else {
        dialogSetlist.value = {
            band_id: props.band_id,
            template: true
        } as Setlist
    }
    setlistDialog.value = true
}

async function upsertSetlist() {
    const { valid } = await setlistform.value?.validate()
    if (valid) {
        if (dialogSetlist.value.id) {
            await axios.EditSetlist(dialogSetlist.value)
        }
        else {
            await axios.CreateSetlist(dialogSetlist.value)
        }
        const templates = await axios.GetSetlistTemplates(props.band_id)
        setlists.value = [
            setlists.value[0],
            ...templates
        ]
        setlistDialog.value = false
    }
}

async function deleteSetlist() {
    await axios.DeleteSetlist(dialogSetlist.value)
}

onMounted(() => {
    load().catch(console.error)
})

</script>

<template>
    <div>
        <v-row>
            <v-col cols="12" sm="3" style="padding-right: 0;">
                <v-list lines="two" style="height: calc(100vh - 176px); padding-top: 0;"
                    v-model:selected="selectedSetlistId">
                    <v-list-item :class="setlist.id === 0 ? 'first' : ''" v-for="setlist in setlists" :key="setlist.id"
                        :value="setlist.id">
                        <v-list-item-title>
                            {{ setlist.name }}
                        </v-list-item-title>
                        <v-list-item-subtitle v-if="setlist.songs && setlist.songs.length">
                            Durata Totale: {{formatSecondsToHoursMinutesSeconds(setlist.songs.reduce((acc, s) => acc +
                                s.duration, 0))}}
                        </v-list-item-subtitle>
                        <template v-slot:append v-if="setlist.id === 0">
                            <v-btn variant="flat" icon="mdi-plus" @click.stop="upsertSetlistDialog()"></v-btn>
                        </template>
                    </v-list-item>
                </v-list>
            </v-col>
            <v-divider vertical></v-divider>
            <v-col style="padding-left: 0; text-align: center;" cols="12" sm="9">
                <v-data-table v-if="selectedSetlist.songs" density="comfortable" fixed-header hide-default-footer
                    :items-per-page="selectedSetlist.songs.length" style="height: calc(100vh - 176px);"
                    :headers="songHeaders" :items="selectedSetlist.songs">
                    <template v-slot:item="{ item }">
                        <tr @click="upsertSongDialog(item)" style="cursor: pointer; text-align: left;">
                            <td>{{ item.name }}</td>
                            <td>{{ item.artist }}</td>
                            <td>{{ formatSecondsToMinutesSeconds(item.duration) }}</td>
                            <td>{{ item.link }}</td>
                        </tr>
                    </template>
                </v-data-table>
                <v-btn style="margin-top: 20px;" v-else text="Aggiungi Canzoni"></v-btn>
            </v-col>
        </v-row>
        <v-dialog v-model="songDialog" max-width="600px">
            <v-card :title="dialogSong.id ? 'Aggiungi Canzone' : 'Modifica Canzone'">
                <v-card-text>
                    <v-form @submit.prevent ref="songform">
                        <v-text-field v-model="dialogSong.name" label="Nome" :rules="[requiredRule]"></v-text-field>
                        <v-text-field v-model="dialogSong.artist" label="Artista"
                            :rules="[requiredRule]"></v-text-field>
                        <v-text-field v-model="dialogSong.duration" label="Durata" suffix="Secondi"
                            :rules="[requiredRule, positiveIntegerRule]"></v-text-field>
                        <v-text-field v-model="dialogSong.link" label="Link" :rules="[validUrlRule]"></v-text-field>
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <v-btn @click="upsertSongToRepertoire">SALVA</v-btn>
                    <v-btn v-if="dialogSong.id" @click="confirmRemoveSong = true" color="danger">RIMUOVI</v-btn>
                    <v-btn @click="songDialog = false">ANNULLA</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog v-model="setlistDialog" max-width="500px">
            <v-card :title="dialogSetlist.id ? 'Modifica Scaletta' : 'Crea Scaletta'">
                <v-card-text>
                    <v-form @submit.prevent ref="setlistform">
                        <v-text-field v-model="dialogSetlist.name" label="Nome" :rules="[requiredRule]"></v-text-field>
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <v-btn @click="upsertSetlist">SALVA</v-btn>
                    <v-btn v-if="dialogSetlist.id" @click="confirmRemoveSetlist = true" color="danger">RIMUOVI</v-btn>
                    <v-btn @click="setlistDialog = false">ANNULLA</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <Confirm v-model="confirmRemoveSong">
            <template v-slot:action>
                <v-btn text="Conferma" variant="plain" @click="removeSong"></v-btn>
            </template>
        </Confirm>
        <Confirm v-model="confirmDeleteSetlist">
            <template v-slot:action>
                <v-btn text="Conferma" variant="plain" @click="deleteSetlist"></v-btn>
            </template>
        </Confirm>
        <v-fab v-if="selectedSetlist.id === 0" icon="mdi-plus" app style="position: fixed; right: 10px; bottom: 10px;"
            location="bottom right" @click="upsertSongDialog()"></v-fab>
    </div>
</template>

<style scoped>
.v-list-item.first {
    border-bottom: 1px solid #a593935e;
}
</style>