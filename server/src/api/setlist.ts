import db from "../db"
import { Setlist, SetlistSong, Song, SetlistInput } from "../../../models/src"
import { ResultSetHeader } from "mysql2"

class Api {
    constructor() {
    }

    async getRepertoire(band_id: number): Promise<Song[]> {
        return await db.query<Song>(`SELECT * FROM song WHERE band_id = ? AND IFNULL(removed, FALSE) != TRUE`, [band_id])
    }

    async insertSongIntoRepertoire(song: Song): Promise<number> {
        return await db.executeInsert(`
            INSERT INTO song
            (name, band_id, artist, album, duration, link, deezer_id)
            VALUES
            (?,?,?,?,?,?,?)`,
            [song.name, song.band_id, song.artist, song.album, song.duration, song.link, song.deezer_id]
        )
    }

    async editSongInRepertorire(song: Song): Promise<number> {
        return await db.executeUpdate(
            `UPDATE song SET name = ?, artist = ?, album = ?, duration = ?, link = ?, deezer_id = ?, removed = ? WHERE id = ? AND band_id = ?`,
            [song.name, song.artist, song.album, song.duration, song.link, song.deezer_id, song.removed, song.id, song.band_id])
    }

    async getSetlistTemplates(band_id: number): Promise<Setlist[]> {
        return await db.query<Setlist>(`
            SELECT id, name, band_id,
            (
                SELECT JSON_ARRAYAGG(JSON_OBJECT(
                                    'id', setlist_song.id,
                                    'name', song.name,
                                    'song_id', setlist_song.song_id,
                                    'deezer_id', song.deezer_id,
                                    'position', setlist_song.position,
                                    'artist', song.artist,
                                    'album', song.album,
                                    'duration', song.duration,
                                    'link', song.link
                                ))  
                FROM song
                INNER JOIN setlist_song ON song.id = setlist_song.song_id 
                WHERE setlist_song.setlist_id = setlist.id AND IFNULL(removed, FALSE) != TRUE
            ) as songs
            FROM setlist
            WHERE setlist.band_id = ? AND template = 1
            `,
            [band_id])
    }

    async saveSetlistSong(setlist_id: number, input: SetlistInput): Promise<number> {
        const duration: number = input.addedSong.reduce((acc, s) => acc + s.duration, 0)
            + input.editSong.reduce((acc, s) => acc + s.duration, 0)
        return await db.executeTransaction(
            [
                'UPDATE setlist SET duration = ? WHERE id = ?',
                ...input.editSong.map((s: SetlistSong) => 'UPDATE setlist_song SET position = ? WHERE song_id = ? AND setlist_id = ?'),
                ...input.addedSong.map((s: SetlistSong) => 'INSERT INTO setlist_song (setlist_id, song_id, position) VALUES (?, ?, ?)'),
                ...input.removedSong.map((s: SetlistSong) => 'DELETE FROM setlist_song WHERE setlist_id = ? AND song_id = ?')
            ],
            [
                [duration, setlist_id],
                ...input.editSong.map((s: SetlistSong) => [
                    s.position,
                    s.song_id,
                    setlist_id
                ]),
                ...input.addedSong.map((s: SetlistSong) => [
                    setlist_id,
                    s.song_id,
                    s.position,
                ]),
                ...input.removedSong.map((s: SetlistSong) => [
                    setlist_id,
                    s.song_id,
                ])
            ]
        )
    }

    async createSetlist(setlist: Setlist): Promise<number> {
        const connection = await db.getConnection()
        let result_id: number

        try {
            await connection.beginTransaction();

            const [result] = await connection.execute<ResultSetHeader>(
                `INSERT INTO setlist
                (name, band_id, template, duration)
                VALUES
                (?,?,?,?)`,
                [setlist.name, setlist.band_id, setlist.template, setlist.songs ? setlist.songs.reduce((acc: number, s: SetlistSong) => acc + s.duration, 0) : 0]
            )

            result_id = result.insertId;

            if (setlist.songs && setlist.songs.length) {
                setlist.songs.forEach(async (setlistSong: SetlistSong) => {
                    await connection.execute(
                        'INSERT INTO setlist_song (setlist_id, song_id, position) VALUES (?, ?, ?)',
                        [result_id, setlistSong.song_id, setlistSong.position]
                    );
                })
            }

            await connection.commit();

        } catch (error) {
            await connection.rollback();
            console.error('Transaction failed. Rolled back.', error);
            throw error
        } finally {
            connection.release();
        }
        return result_id
    }

    async deleteSetlist(setlist_id: number): Promise<number> {
        return await db.executeTransaction(
            [
                "DELETE FROM setlist_song WHERE setlist_id = ?",
                "DELETE FROM setlist WHERE id = ?",
            ],
            [
                [setlist_id],
                [setlist_id],
            ])
    }

    async editSetlist(setlist: Setlist): Promise<number> {
        return await db.executeUpdate('UPDATE setlist SET name = ?', [setlist.name])
    }
}

const setlistApi = new Api()
export default setlistApi