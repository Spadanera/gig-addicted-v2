import db from "../db"
import sendEmail from "../utils/mail"
import { User } from "../../../models/src"
import { type Invitation } from '../../../models/src/index'
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
                                    'role', band_member.role
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

    async inviteUser(user: User): Promise<void> {
        if (user && user.email && !(await this.checkUserExists(user.email))) {
            const invitation = {
                email: user.email,
                creation_date: getCurrentDateTimeInItaly(),
                token: uuidv4()
            } as Invitation

            const result = await db.executeInsert("INSERT INTO users (email, token, creation_date) VALUES (?,?,?)", [invitation.email, invitation.token, invitation.creation_date])

            await db.executeInsert(`INSERT INTO user_role (user_id, role_id) SELECT ?, id FROM roles WHERE name in (${user.roles?.map((value: string) => `'${value}'`).join(',')})`, [result])

            await sendEmail({
                to: user.email,
                subject: "Unisciti a Gig Addicted",
                HTMLPart: `<!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="utf-8">
                            <style>
                                body {
                                    font-family: sans-serif;
                                    line-height: 1.5;
                                }
                                .container {
                                    max-width: 600px;
                                    margin: 0 auto;
                                    padding: 20px;
                                }
                                h1 {
                                    color: #333;
                                }
                                .button {
                                    display: inline-block;
                                    padding: 10px 20px;
                                    background-color: red;
                                    color: #fff;
                                    text-decoration: none;
                                    border-radius: 5px;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <h1>Sei stato invitato ad unirti a Gig Addicted!</h1>
                                <p>
                                    Ciao,
                                </p>
                                <p>
                                    Sei stato invitato ad unirti a Gig Addicted.
                                </p>
                                <p>
                                    Per accettare l'invito e impostare la tua password, clicca sul pulsante qui sotto:
                                </p>
                                <a href="${process.env.BASE_URL}/invitation/${invitation.token}" class="button">Reimposta Password</a>
                                <p>
                                    Questo link scadrà tra 24 ore, quindi assicurati di completare la registrazione entro tale data.
                                </p>
                                <p>
                                    A presto su Gig Addicted!
                                </p>
                                <img width="200px" src="https://chicomanda.com/assets/chicomanda-XznG4Dz3.png" alt="Gig Addicted"/>
                            </div>
                        </body>
                        </html>`
            })
        } else {
            throw new Error("Missing Parameters")
        }
    }

    async checkUserExists(email: string): Promise<boolean> {
        const users: User[] = await db.query("SELECT id FROM users WHERE email = ? AND status != 'DELETED'", [email])
        if (users.length) {
            return true
        }
        return false
    }

    async acceptInvitation(invitation: Invitation): Promise<number> {
        if (invitation.password) {
            const _invitation: Invitation = await db.queryOne("SELECT * FROM users WHERE token = ?", [invitation.token])
            if (_invitation.id && _invitation.email) {
                return await db.executeUpdate("UPDATE users SET username = ?, password = ?, status = ?, avatar = ? WHERE id = ?",
                    [invitation.username, await hashPassword(invitation.password), 'ACTIVE', invitation.avatar, _invitation.id])
            }
            else {
                throw new Error("Missing invitation")
            }
        }
        throw new Error("Missing password")
    }

    async askResetPassword(invitation: Invitation): Promise<void> {
        if (invitation.email && (await this.checkUserExists(invitation.email || ''))) {
            const id = uuidv4()
            await db.executeInsert("INSERT INTO reset (email, token, creation_date) VALUES (?,?,?)", [
                invitation.email, id, getCurrentDateTimeInItaly()
            ])

            await sendEmail({
                to: invitation.email,
                subject: "Reimposta la password su Gig Addicted",
                HTMLPart: `<!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="utf-8">
                            <style>
                                body {
                                    font-family: sans-serif;
                                    line-height: 1.5;
                                }
                                .container {
                                    max-width: 600px;
                                    margin: 0 auto;
                                    padding: 20px;
                                }
                                h1 {
                                    color: #333;
                                }
                                .button {
                                    display: inline-block;
                                    padding: 10px 20px;
                                    background-color: red;
                                    color: #fff;
                                    text-decoration: none;
                                    border-radius: 5px;
                                }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <h1>Reimposta password su Gig Addicted.</h1>
                                <p>
                                    Ciao,
                                </p>
                                <p>
                                    Hai fatto richiesta per reimpostare la password su Gig Addicted.
                                </p>
                                <p>
                                    Per reimpostare la password segui il seguente link:
                                </p>
                                <a href="${process.env.BASE_URL}/reset/${id}" class="button">Reimposta Password</a>
                                <p>
                                    Questo link scadrà tra 24 ore, quindi assicurati di completare la registrazione entro tale data.
                                </p>
                                <p>
                                    A presto su Gig Addicted!
                                </p>
                                <img width="200px" src="https://chicomanda.com/assets/chicomanda-XznG4Dz3.png" alt="Gig Addicted"/>
                            </div>
                        </body>
                        </html>`
            })
        }
        else {
            throw new Error("Missing Parameters")
        }
    }

    async resetPassword(invitation: Invitation): Promise<number> {
        var _reset: Invitation = await db.queryOne("SELECT id, email FROM reset WHERE token = ?", [invitation.token])
        var _user: User = await db.queryOne("SELECT id FROM users WHERE email = ?", [_reset.email])
        if (_reset.id && _user.id) {
            return await db.executeTransaction([
                "UPDATE users SET password = ? WHERE id = ?",
                "DELETE FROM reset WHERE id = ?",
            ], [
                [await hashPassword(invitation.password), _user.id],
                [_reset.id]
            ])
        }
        else {
            throw new Error("Reset non presente")
        }
    }

}

const userApi = new UserApi()
export default userApi