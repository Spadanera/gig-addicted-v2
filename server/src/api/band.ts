import db from "../db"
import { Band, Roles } from "../../../models/src"
import { ResultSetHeader } from "mysql2"


class Api {
    constructor() {
    }

    async getAll(): Promise<Band[]> {
        return await db.query(`SELECT * FROM band`)
    }

    async getMyBands(user_id: number): Promise<Band[]> {
        return await db.query<Band>(`SELECT * FROM band WHERE id IN (SELECT band_id FROM band_member WHERE user_id = ?)`, [user_id])
    }

    async createBand(band: Band, user_id: number): Promise<number> {
        const connection = await db.getConnection()
        let result_id

        try {
            await connection.beginTransaction();

            const [result] = await connection.execute<ResultSetHeader>(
                'INSERT INTO band (name) VALUES (?)',
                [band.name]
            )

            result_id = result.insertId;
            await connection.execute(
                'INSERT INTO band_member (user_id, band_id, role) VALUES (?, ?, ?)',
                [user_id, result_id, Roles.owner]
            );

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

    async getBandDetails(band_id: number): Promise<Band> {
        return await db.queryOne<Band>(`
            SELECT id, name, description, logo, biography
            FROM band
            WHERE id = ?`,
        [band_id])
    }

    async updateBandDetails(band: Band): Promise<number> {
        if (!band.id) {
            throw new Error('Missing band id')
        }
        return await db.executeUpdate(`
            UPDATE band SET name = ?, description = ?, biography = ?
            WHERE id = ?
            `, [band.name, band.description, band.biography, band.id])
    }

    async updateBandLogo(logo:string, band_id:number): Promise<number> {
        return await db.executeUpdate(`
            UPDATE band SET logo = ? WHERE id = ?
            `, [logo, band_id])
    }
}

const bandApi = new Api()
export default bandApi