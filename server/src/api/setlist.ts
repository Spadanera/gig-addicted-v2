import db from "../db"
import { Setlist, SetlistSong, Song, SetlistInput } from "../../../models/src"
import { ResultSetHeader } from "mysql2"

class Api {
    constructor() {
    }

    async getRepertoire(band_id: number): Promise<Song[]> {
        return await db.query<Song>(`SELECT * FROM song WHERE band_id = ? AND removed != TRUE`, [band_id])
    }

    async insertSongIntoRepertoire(song: Song): Promise<number> {
        return await db.executeInsert(`
            INSERT INTO song
            (name, band_id, artist, duration, link)
            VALUES
            (?,?,?,?,?)`,
            [song.name, song.band_id, song.artist, song.duration, song.link]
        )
    }

    async removeSongFromRepertorire(song: Song): Promise<number> {
        return await db.executeUpdate('UPDATE song SET removed = TRUE WHERE id = ? AND band_id = ?', [song.id, song.band_id])
    }

    async getSetlistTemplates(band_id: number): Promise<Setlist[]> {
        return await db.query<Setlist>(`
            SELECT id, name,
            (
                SELECT JSON_ARRAYAGG(JSON_OBJECT(
                                    'name', song.name,
                                    'artist', song.artist,
                                    'duration', song.duration,
                                    'link', song.link
                                ))  
                FROM song
                INNER JOIN setlist_song ON song.id = setlist_song.song_id 
                WHERE setlist_song.setlist_id = setlist.id AND removed != TRUE
            ) as songs
            FROM setlist
            WHERE setlist.band_id = ? AND template = 1
            `,
            [band_id])
    }

    // async insertSongIntoSetlist(song: Song, setlist_id: number): Promise<number> {
    //     const connection = await db.getConnection()
    //     let result_id: number

    //     try {
    //         await connection.beginTransaction();

    //         const [result] = await connection.execute<ResultSetHeader>(
    //             `INSERT INTO song
    //             (name, band_id, artist, duration, link)
    //             VALUES
    //             (?,?,?,?,?)`,
    //             [song.name, song.band_id, song.artist, song.duration, song.link]
    //         )

    //         result_id = result.insertId;

    //         await connection.execute(
    //             'INSERT INTO setlist_song (setlist_id, song_id) VALUES (?, ?)',
    //             [setlist_id, result_id]
    //         );

    //         await connection.commit();

    //     } catch (error) {
    //         await connection.rollback();
    //         console.error('Transaction failed. Rolled back.', error);
    //         throw error
    //     } finally {
    //         connection.release();
    //     }
    //     return result_id
    // }

    // async addSongToSetlist(setlist_id: number, song_id: number): Promise<number> {
    //     return await db.executeInsert('INSERT INTO setlist_song (setlist_id, song_id) VALUES (?,?)', [setlist_id, song_id])
    // }

    // async removeSongFromSetlist(setlist_id: number, song_id: number): Promise<number> {
    //     return await db.executeUpdate('DELETE FROM setlist_song WHERE setlist_id = ? AND song_id = ?', [setlist_id, song_id])
    // }

    async saveSetlistSong(input: SetlistInput): Promise<number> {
        return await db.executeTransaction(
            [
                ...input.editSong.map((s: SetlistSong) => 'UPDATE setlist_song SET position = ? WHERE song_id = ? AND setlist_id = ?'),
                ...input.addedSong.map((s: SetlistSong) => 'INSERT INTO setlist_song (setlist_id, song_id, position) VALUES (?, ?, ?)'),
                ...input.removedSong.map((s: SetlistSong) => 'DELETE FROM setlist_song WHERE setlist_id = ? AND song_id = ?')
            ],
            [
                ...input.editSong.map((s: SetlistSong) => [
                    s.position,
                    s.song_id,
                    s.setlist_id
                ]),
                ...input.addedSong.map((s: SetlistSong) => [
                    s.setlist_id,
                    s.song_id,
                    s.position,
                ]),
                ...input.removedSong.map((s: SetlistSong) => [
                    s.setlist_id,
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
                (name, band_id, template)
                VALUES
                (?,?,?)`,
                [setlist.name, setlist.band_id, setlist.template,]
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