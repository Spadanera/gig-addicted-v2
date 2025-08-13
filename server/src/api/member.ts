import db from "../db"
import { Setlist, SetlistSong, Song, SetlistInput, BandMember } from "../../../models/src"
import { ResultSetHeader } from "mysql2"
import sendEmail from "../utils/mail"
import { v4 as uuidv4 } from 'uuid'

class Api {
    constructor() {
    }

    async getBandMember(band_id: number): Promise<BandMember[]> {
        return await db.query<BandMember>(`
            SELECT 
                band_member.id,
                users.username, 
                users.avatar,
                band_member.band_id,
                IFNULL(users.email, band_member.invitation) as email,
                CAST(band_member.role AS JSON) as role, 
                CAST(band_member.instrument AS JSON) as instrument
            FROM band_member
            LEFT JOIN users
            ON users.id = band_member.user_id
            WHERE band_id = ?
            `, [band_id])
    }

    async inviteBandMember(band_member: BandMember): Promise<number> {
        const inv = uuidv4()
        band_member.invitation = `${band_member.email}|${inv}`
        const result = await db.executeInsert(`
            INSERT INTO band_member
            (band_id, role, instrument, invitation)
            VALUES (?,?,?,?)
            `, [
                band_member.band_id, 
                JSON.stringify(band_member.role), 
                JSON.stringify(band_member.instrument), 
                band_member.invitation
            ])

        await sendEmail({
            to: band_member.email,
            subject: "Unisciti a Chi Comanda",
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
                                    Per accettare l'invito clicca sul pulsante qui sotto:
                                </p>
                                <a href="${process.env.BASE_URL}/invitation/${inv}" class="button">Accetta Invito</a>
                                <p>
                                    Questo link scadrà tra 24 ore, quindi assicurati di completare la registrazione entro tale data.
                                </p>
                                <p>
                                    A presto su Chi Comanda!
                                </p>
                                <img width="200px" src="http://localhost/src/assets/logo.png" alt="Chi Comanda"/>
                            </div>
                        </body>
                        </html>`
        })

        return result
    }

    async removeBandMember(member_id: number): Promise<number> {
        return await db.executeUpdate(`
            DELETE FROM band_member WHERE id = ?
            `, [member_id])
    }

    async editBandMember(band_member: BandMember): Promise<number> {
        return await db.executeUpdate(`
            UPDATE band_member SET role = ?, instrument = ? WHERE id = ?
            `, [band_member.role, band_member.instrument, band_member.id])
    }

    async acceptInvitation(user_id:number, email:string ,token: string): Promise<number> {
        return await db.executeUpdate(
            `UPDATE band_member SET user_id = ? WHERE invitation = ?`
            , [user_id, `${email}|${token}`])
    }
}

const memberApi = new Api()
export default memberApi