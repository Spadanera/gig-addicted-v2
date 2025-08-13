import db from "../db"
import sendEmail from "../utils/mail"
import { User } from "../../../models/src"
import { getCurrentDateTimeInItaly } from "../utils/helper"
import { v4 as uuidv4 } from 'uuid'
import { hashPassword, checkPassword } from "../utils/crypt"

class UserApi {
    constructor() {
    }

    async getAll(): Promise<User[]> {
        return await db.query(`
            SELECT id,username, email, status, avatar,
                (SELECT JSON_ARRAYAGG(name) 
                FROM roles
                INNER JOIN user_role on roles.id = user_role.role_id 
                WHERE user_id = users.id) as roles 
            FROM users
            WHERE IFNULL(status, '') != 'DELETED'`, [])
    }

    async getByEmailAndPassword(email: string, password: string): Promise<User> {
        const result = await db.queryOne<User>(`SELECT id, email, username, password, (select JSON_ARRAYAGG(name) FROM roles
            INNER JOIN user_role on roles.id = user_role.role_id WHERE user_id = users.id) as roles, avatar
            FROM users WHERE email = ? AND status = 'ACTIVE'`, [email])
        if (result.id && (await checkPassword(password, result.password || ''))) {
            delete result.password
            try {
                await db.executeInsert("UPDATE users SET last_login_date = ? WHERE id = ?", [getCurrentDateTimeInItaly(), result.id])
            } catch (error: any) {
                console.error("Error setting last_login_date", error.message)
            }
            return result
        }
        else {
            throw new Error("Credenziali invalide")
        }
    }

    async getUserInfo(email: string): Promise<User[]> {
        return await db.query<User>(`
            SELECT id, email, username, avatar, 
            (
                SELECT JSON_ARRAYAGG(JSON_OBJECT(
                                    'band_id', band_member.band_id,
                                    'role', CAST(band_member.role AS JSON)
                                ))  
                FROM band_member 
                WHERE users.id = band_member.user_id
            ) as bands
            FROM users WHERE email = ?`
        , [email])
    }

    async getByEmail(email: string): Promise<User> {
        return await db.queryOne<User>('SELECT id, email, username, avatar FROM users WHERE email = ?', [email])
    }

    async get(id: number): Promise<User[]> {
        return await db.query('SELECT * FROM users WHERE ID = ?', [id])
    }

    async getAvatar(id: number): Promise<string> {
        return (await db.queryOne<User>('SELECT avatar FROM users WHERE ID = ?', [id])).avatar || ''
    }

    async delete(id: number): Promise<void> {
        await db.executeTransaction([
            'DELETE FROM user_role WHERE user_id = ?',
            'UPDATE users SET status = "DELETED" WHERE id = ?'
        ], [
            [id],
            [id]
        ])
    }

    async update(user: User): Promise<number> {
        return await db.executeUpdate('UPDATE users SET status = ? WHERE id = ?', [user.status, user.id])
    }

    async updateRoles(user: User): Promise<number> {
        return await db.executeTransaction([
            "DELETE FROM user_role WHERE user_id = ?",
            `INSERT INTO user_role (user_id, role_id) SELECT ?, id FROM roles WHERE name in (${user.roles?.map((value: string) => `'${value}'`).join(',')})`
        ], [
            [user.id],
            [user.id]
        ])
    }
}

const userApi = new UserApi()
export default userApi