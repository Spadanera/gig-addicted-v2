<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import Axios from '@/services/client'
import { type Setlist, type SetlistInput, type SetlistSong, type Song } from '../../../../models/src'
import { requiredRule, positiveIntegerRule, validUrlRule, formatSecondsToHoursMinutesSeconds, copy, updatePositions } from "@/services/utils"
import SongDataTable from './SongDataTable.vue'
import debounce from 'lodash.debounce';

const props = defineProps(['band_id'])

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
const search = ref('')
const selectedTrack = ref<number | null>(null)
const tracks = ref<Song[]>([])
const loading = ref(false)
const autocompleteRef = ref()
const sheet = ref<boolean>(false)
const debouncedFetch = debounce(onSearch, 400);
const orderEdited = ref<boolean>(false)

watch(search, (val) => {
  debouncedFetch(val);
});

const selectedSetlist = computed(() =>
    setlists.value.find(s => s.id === selectedSetlistId.value[0]) ?? null
)

const editing = computed(() =>
    (selectedSetlist.value.songs?.filter(s => s.id === undefined || s.removed).length || selectedSetlist.value.orderEdited) && selectedSetlist.value.id !== 0
)

const availableSong = computed(() => setlists.value[0].songs.filter(song1 => 
  !selectedSetlist.value.songs.some(song2 => song2.song_id === song1.id)
))

async function onSearch(val: string) {
    if (!val || val.length < 3) {
        tracks.value = []
        return
    }
    loading.value = true
    try {
        tracks.value = await axios.GetDeezerSongs(val)
    } catch (e) {
        tracks.value = []
    } finally {
        loading.value = false
    }
}

function onSelect(id: number | null) {
    if (id === null) {
        dialogSong.value = { band_id: props.band_id } as Song
        return
    }
    const track = tracks.value.find(t => t.id === id)
    if (track) {
        dialogSong.value.name = track.name
        dialogSong.value.artist = track.artist
        dialogSong.value.duration = track.duration
        dialogSong.value.album = track.album
        dialogSong.value.link = track.link
        dialogSong.value.deezer_id = track.id
        selectedTrack.value = null
        search.value = ''
        tracks.value = []
    }

    if (autocompleteRef.value) {
        autocompleteRef.value.blur()
    }
}

async function load() {
    await loadReperoire()
    await loadSetlist()

    selectedSetlistId.value[0] = setlists.value.length ? setlists.value[0].id : null
}

async function loadSetlist() {
    const templates = await axios.GetSetlistTemplates(props.band_id)
    setlists.value = [
        setlists.value[0],
        ...templates
    ]
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

function toggleSongFromSetlist(song: SetlistSong) {
    console.log(song)
    const setlist = setlists.value.find((s:Setlist) => s.id === song.setlist_id)
    const s = setlist.songs.find((s: SetlistSong) => s.id === song.id)
    s.removed = !s.removed
    setlist.songs = updatePositions(setlist.songs)
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
    search.value = ''
    selectedTrack.value = null
    tracks.value = []
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
        await loadSetlist()
        selectedSetlistId.value = [setlists.value[setlists.value.length - 1].id]
        setlistDialog.value = false
    }
}

async function deleteSetlist() {
    await axios.DeleteSetlist(selectedSetlist.value)
    selectedSetlistId.value = [0]
    await loadSetlist()
    confirmDeleteSetlist.value = false
}

function addSongToSetlist(songsToAdd: number[]) {
    const setlist: Setlist = setlists.value.find(s => s.id === selectedSetlist.value.id)
    if (setlist) {
        setlist.songs = setlist.songs || []
        setlist.songs.push(...(songsToAdd.map((s1: number, index: number) => {
            const result = copy(setlists.value[0].songs?.find(s2 => s2.id === s1))
            result.song_id = result.id
            result.id = undefined
            result.position = setlist.songs.length + index + 1
            return result
        })))
        sheet.value = false
    }
}

function updateSong(songs: SetlistSong[]) {
    const setlist = setlists.value.find((s:Setlist) => s.id === selectedSetlistId.value[0])
    setlist.songs = updatePositions(songs)
    setlist.orderEdited = true
}

async function saveSetlistSong() {
    const setlistInput: SetlistInput = {
        editSong: selectedSetlist.value.songs?.filter(s => !s.removed && s.id) || [],
        addedSong: selectedSetlist.value.songs?.filter(s => !s.removed && !s.id) || [],
        removedSong: selectedSetlist.value.songs?.filter(s => s.removed && s.id) || []
    } as SetlistInput

    await axios.SaveSetlistSong(setlistInput, props.band_id, selectedSetlist.value.id)
    await loadSetlist()
}

onMounted(() => {
    load().catch(console.error)
})

</script>

<template>
    <div>
        <v-row>
            <v-col cols="12" sm="3" style="padding-right: 0; position: relative;">
                <v-list lines="two" style="height: calc(100vh - 160px); padding-top: 0; padding-bottom: 0;"
                    v-model:selected="selectedSetlistId">
                    <v-list-item :key="setlists[0].id" :value="setlists[0].id">
                        <v-list-item-title>
                            {{ setlists[0].name }}
                        </v-list-item-title>
                        <v-list-item-subtitle>
                            Durata Totale: {{formatSecondsToHoursMinutesSeconds(setlists[0].songs.reduce((acc, s) => acc
                                +
                                s.duration, 0))}}
                        </v-list-item-subtitle>
                    </v-list-item>
                    <v-divider></v-divider>
                    <v-list-subheader>
                        SCALETTE
                        <v-btn style="margin-bottom: 4px;" small class="ml-auto" variant="text" icon="mdi-plus"
                            @click.stop="upsertSetlistDialog()"></v-btn>
                    </v-list-subheader>
                    <v-list-item v-for="setlist in setlists.slice(1)" :key="setlist.id" :value="setlist.id">
                        <v-list-item-title>
                            {{ setlist.name }}
                        </v-list-item-title>
                        <v-list-item-subtitle v-if="setlist.songs && setlist.songs.length">
                            Durata Totale: {{formatSecondsToHoursMinutesSeconds(setlist.songs.reduce((acc, s) => acc +
                                s.duration, 0))}}
                        </v-list-item-subtitle>
                        <template v-if="selectedSetlistId[0] === setlist.id" v-slot:append>
                            <v-btn @click.stop="confirmDeleteSetlist = true" icon="mdi-delete" variant="text"></v-btn>
                        </template>
                    </v-list-item>
                </v-list>
                <div class="floating-save bg-primary" v-if="editing">
                    <v-btn style="width: 50%; height: 100%;" text="SALVA SCALETTA" @click="saveSetlistSong"
                        variant="plain"></v-btn>
                    <v-btn style="width: 50%; height: 100%;" text="ANNULLA" @click="loadSetlist"
                        variant="plain"></v-btn>
                </div>
            </v-col>
            <v-divider vertical></v-divider>
            <v-col style="padding-left: 0;" cols="12" sm="9">
                <div v-if="selectedSetlist.songs && selectedSetlist.songs.length">
                    <SongDataTable :repertoire="selectedSetlist.id === 0" :add-mode="false" @updatesongs="updateSong"
                        :songs="selectedSetlist.songs" @editsong="upsertSongDialog" @togglesong="toggleSongFromSetlist">
                    </SongDataTable>
                </div>
                <div v-else style="width: 100%; text-align: center;">
                    <v-btn @click="sheet = true" style="margin-top: 20px;" text="Aggiungi Canzoni"></v-btn>
                </div>
            </v-col>
        </v-row>
        <v-dialog v-model="songDialog" max-width="600px">
            <v-card :title="dialogSong.id ? 'Aggiungi Canzone' : 'Modifica Canzone'">
                <v-card-text>
                    <v-autocomplete autocomplete="off" ref="autocompleteRef" v-model="selectedTrack"
                         v-model:search="search" :items="tracks" :loading="loading"
                        label="Cerca brano" item-title="name" item-value="id" hide-no-data hide-selected
                        @update:model-value="onSelect" clearable>
                        <template v-slot:item="{ props, item }">
                            <v-list-item v-bind="props">
                                <v-list-item-subtitle>
                                    {{ item.raw.artist }} — {{ item.raw.album }}
                                </v-list-item-subtitle>
                            </v-list-item>
                        </template>
                    </v-autocomplete>
                    <v-form @submit.prevent ref="songform">
                        <v-text-field v-model="dialogSong.name" label="Nome" :rules="[requiredRule]"></v-text-field>
                        <v-text-field v-model="dialogSong.artist" label="Artista"></v-text-field>
                        <v-text-field v-model="dialogSong.album" label="Album"></v-text-field>
                        <v-text-field v-model="dialogSong.duration" label="Durata" suffix="Secondi"
                            :rules="[positiveIntegerRule]"></v-text-field>
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
        <v-fab v-if="selectedSetlist?.id === 0" icon="mdi-plus" app style="position: fixed; right: 10px; bottom: 10px;"
            location="bottom right" @click="upsertSongDialog()"></v-fab>
            <v-fab v-if="selectedSetlist?.id !== 0" icon="mdi-plus" app style="position: fixed; right: 10px; bottom: 10px;"
            location="bottom right" @click="sheet = true"></v-fab>
        <v-bottom-sheet v-model="sheet">
            <SongDataTable :repertoire="false" @add="addSongToSetlist" @cancel="sheet = false"
                :songs="availableSong" add-mode>
            </SongDataTable>
        </v-bottom-sheet>
    </div>
</template>

<style scoped>
.floating-save {
    position: absolute;
    bottom: 12px;
    left: 0;
    width: 100%;
    height: 50px;
}
</style>