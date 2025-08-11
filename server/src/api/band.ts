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

    async getMyBands(user_id: number) {
        return await db.query(`SELECT * FROM band WHERE id IN (SELECT band_id FROM band_member WHERE user_id = ?)`, [user_id])
    }

    async createBand(band: Band, user_id: number): Promise<number> {
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
                [user_id, bandId, , Roles.owner]
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

    async getBandRole(band_id: number, user_id:number): Promise<string> {
        return (await db.queryOne<BandMember>(`SELECT role FROM band_member WHERE band_id = ? AND user_id = ?`, [band_id, user_id])).role
    }

    async checkBandRole(band_id: number, user_id:number, values: string[]): Promise<boolean> {
        return values.includes(await this.getBandRole(band_id, user_id))
    }

    async hasOneBandRole(band_id: number, user_id:number): Promise<boolean> {
        return (await this.getBandRole(band_id, user_id)) !== undefined
    }

    async canEditBand(band_id: number, user_id:number) {
        return await this.checkBandRole(band_id, user_id, ['editor', 'owner', 'viewer'])
    }

    async getBandDetails(band_id: number, user_id: number): Promise<Band> {
        if (await this.hasOneBandRole(band_id, user_id)) {
            return await db.queryOne<Band>(`
                SELECT id, name, description, logo, biography
                FROM band
                WHERE id = ?`,
            [band_id])
        }
        throw new Error('Unauthorized')
    }

    async updateBandDetails(band: Band, user_id: number): Promise<number> {
        if (band.id && await this.canEditBand(band.id, user_id)) {
            return await db.executeUpdate(`
                UPDATE band SET name = ?, description = ?, biography = ?
                WHERE id = ?
                `, [band.name, band.description, band.biography, band.id])
        }
        throw new Error('Unauthorized')
    }

    async updateBandLogo(logo:string, band_id:number, user_id: number): Promise<number> {
        if (await this.canEditBand(band_id, user_id)) {
            return await db.executeUpdate(`
                UPDATE band SET logo = ? WHERE id = ?
                `, [logo, band_id])
        }
        throw new Error('Unauthorized')
    }
}

const bandApi = new Api()
export default bandApi