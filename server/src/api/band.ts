import db from "../db"
import { Band, BandMember } from "../../../models/src"
import { ResultSetHeader } from "mysql2"
import { Roles } from "../utils/helper"


class Api {
    constructor() {
    }

    async getAll() {
        return await db.query(`SELECT * FROM band`)
    }

    async getMyBands(user_id: string) {
        return await db.query(`SELECT * FROM band WHERE id IN (SELECT band_id FROM band_member WHERE user_id = ?)`, [user_id])
    }

    async createBand(band: Band, userId: number): Promise<number> {
        const connection = await db.getConnection()
        let bandId

        try {
            await connection.beginTransaction();

            const [bandResult] = await connection.execute<ResultSetHeader>(
                'INSERT INTO band (name) VALUES (?)',
                [band.name]
            )

            bandId = bandResult.insertId;

            await connection.execute(
                'INSERT INTO band_member (user_id, band_id, role) VALUES (?, ?, ?)',
                [userId, bandId, , Roles.owner]
            );

            await connection.commit();

        } catch (error) {
            await connection.rollback();
            console.error('Transaction failed. Rolled back.', error);
            throw error
        } finally {
            connection.release();
        }
        return bandId
    }
}

const bandApi = new Api()
export default bandApi