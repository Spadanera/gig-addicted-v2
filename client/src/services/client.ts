import axios, { type AxiosResponse, type AxiosRequestConfig, type RawAxiosRequestHeaders, type AxiosInstance, type AxiosProgressEvent } from 'axios'
import { type Repository, type User, type Event, type Invitation, type Band, type Song, type Setlist, type SetlistInput, type SetlistSong } from "../../../models/src"
import router from '@/router'
import { UserStore, SnackbarStore, ProgressStore } from '@/stores'
import type { StoreDefinition } from 'pinia'

export default class Axios {
    client: AxiosInstance
    config: AxiosRequestConfig = {
        headers: {
            'Content-Type': 'application/json'
        } as RawAxiosRequestHeaders
    }
    userStoreDef: StoreDefinition
    snackbarStoreDef: StoreDefinition
    progressStoreDef: StoreDefinition

    constructor() {
        this.client = axios.create({
            baseURL: '/api',
        })

        this.client.interceptors.request.use((request) => {
            const progressStore = this.progressStoreDef()
            if (request.url !== "/checkauthentication") {
                progressStore.activeRequestCount++
                progressStore.loading = true;
            }
            return request
        }, error => {
            const progressStore = this.progressStoreDef()
            progressStore.activeRequestCount--
            setInterval(() => {
                if (progressStore.activeRequestCount === 0) {
                    progressStore.loading = false;
                }
            }, 200)
            return Promise.reject(error)
        })

        this.client.interceptors.response.use((response) => {
            const progressStore = this.progressStoreDef()
            if (response.config.url !== "/checkauthentication") {
                progressStore.activeRequestCount--
                setInterval(() => {
                    if (progressStore.activeRequestCount === 0) {
                        progressStore.loading = false;
                    }
                }, 200)
            }
            return response
        }, error => {
            const progressStore = this.progressStoreDef()
            progressStore.loading = false;
            if (error.response) {
                progressStore.activeRequestCount--
                setInterval(() => {
                    if (progressStore.activeRequestCount === 0) {
                        progressStore.loading = false;
                    }
                }, 200)
                if (error.response.status === 401) {
                    const userStore = this.userStoreDef()
                    userStore.logout()
                    router.push('/')
                } else {
                    const snackbar = SnackbarStore()
                    snackbar.show("Si è verificare un errore", 3000, 'top', 'error')
                }
            }
            return Promise.reject(error)
        })

        this.userStoreDef = UserStore
        this.snackbarStoreDef = SnackbarStore
        this.progressStoreDef = ProgressStore
    }

    private async get<T extends Repository>(path: string): Promise<T[]> {
        const response: AxiosResponse<T[]> = await this.client.get<T[]>(path, this.config)
        return response.data
    }

    private async getSingle<T extends Repository>(path: string): Promise<T> {
        const response: AxiosResponse<T> = await this.client.get<T>(path, this.config)
        return response.data
    }

    private async post<T extends Repository>(path: string, body: T): Promise<number> {
        const response: AxiosResponse<number> = await this.client.post(path, body, this.config)
        return response.data
    }

    private async put<T extends Repository>(path: string, body: T): Promise<number> {
        const response: AxiosResponse<number> = await this.client.put(path, body, this.config)
        return response.data
    }

    private async delete(path: string): Promise<number> {
        const response: AxiosResponse<number> = await this.client.delete(path, this.config)
        return response.data
    }

    async AskReset(email: string) {
        await this.client.post("/public/askreset", {
            email
        })
        this.snackbarStoreDef().show("Richiesta effettuata. Riceverai una mail con le istruzioni per reinpostare la tua password")
        router.push("/")
    }

    async Reset(invitation: Invitation) {
        await this.client.post("/public/reset", invitation)
        this.snackbarStoreDef().show("Password reimpostata con successo", 3000, 'top', 'success')
        router.push("/")
    }

    async GetUsers(): Promise<User[]> {
        return await this.get("/users")
    }

    async GetProfile(id: number): Promise<User> {
        return await this.getSingle<User>(`/profile/${id}`)
    }

    async EditProfileAvatar(formData: FormData, id: number): Promise<string> {
        const response: AxiosResponse<string> = await this.client.put(`/profile/avatar/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        return response.data
    }

    async EditProfileUsername(user: User): Promise<number> {
        return await this.put("/profile/username", user)
    }

    async UpdateUser(user: User): Promise<number> {
        return await this.put("/users", user)
    }

    async UpdateUserRoles(user: User): Promise<number> {
        return await this.put("/users/roles", user)
    }

    async DeleteUser(user_id: number): Promise<number> {
        return await this.delete(`/users/${user_id}`)
    }

    async InviteUser(user: User): Promise<number> {
        return await this.post("/users/invite", user)
    }

    async AcceptInvitation(formData: FormData) {
        await this.client.post("/public/invitation/accept", formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })

        this.snackbarStoreDef().show("Invito accettato con successo", 3000, 'top', 'success')
        router.push("/login")
    }

    async Login(email: string, password: string): Promise<void> {
        const user = (await this.client.post<User>("/login", {
            email: email,
            password: password
        })).data
        this.userStoreDef().login(user)
    }

    async Logout() {
        await this.client.post('/logout')
        this.userStoreDef().logout()
        router.push("/")
        this.snackbarStoreDef().show("Logout effettuato con successo")
    }

    async CheckAuthentication(): Promise<User> {
        return (await this.client.get<User>('/checkauthentication')).data
    }

    // My Band Method
    async GetMyBand(): Promise<Band[]> {
        return await this.get<Band>("/band/myband")
    }

    async CreateBand(band: Band): Promise<number> {
        const result = await this.post<Band>("/band/myband", band)
        await this.CheckAuthentication()
        return result
    }

    async DeleteBand(band_id: number): Promise<number> {
        return await this.delete(`/band/myband/${band_id}`)
    }

    async GetBandDetails(band_id: number): Promise<Band> {
        return await this.getSingle<Band>(`/band/myband/${band_id}/details`)
    }

    async UpdateBandDetails(band: Band): Promise<number> {
        return await this.put<Band>(`/band/myband/${band.id}/details`, band)
    }

    async UpdateBandLogo(formData: FormData, band_id: number): Promise<string> {
        const response: AxiosResponse<string> = await this.client.put(`/band/myband/${band_id}/logo`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        return response.data
    }

    // Setlist Method
    async GetRepertoire(band_id: number) {
        return await this.get<SetlistSong>(`/band/myband/${band_id}/repertoire`)
    }

    async InsertSongIntoRepertoire(song: Song) {
        return await this.post(`/band/myband/${song.band_id}/song`, song)
    }

    async EditSongInRepertorire(song: Song) {
        return await this.put(`/band/myband/${song.band_id}/song`, song)
    }

    async GetSetlistTemplates(band_id: number) {
        return await this.get<Setlist>(`/band/myband/${band_id}/setlist`)
    }

    async SaveSetlistSong(input: SetlistInput, band_id: number, setlist_id: number) {
        return await this.put(`/band/myband/${band_id}/setlist/${setlist_id}/song`, input)
    }

    async CreateSetlist(setlist: Setlist) {
        return await this.post(`/band/myband/${setlist.band_id}/setlist`, setlist)
    }

    async DeleteSetlist(setlist: Setlist) {
        return await this.delete(`/band/myband/${setlist.band_id}/setlist/${setlist.id}`)
    }

    async EditSetlist(setlist: Setlist) {
        return await this.put(`/band/myband/${setlist.band_id}/setlist/${setlist.id}`, setlist)
    }

    async GetDeezerSongs(val: string): Promise<Song[]> {
        return await this.get<Song>(`/search-track?q=${encodeURIComponent(val)}`)
    }
}

