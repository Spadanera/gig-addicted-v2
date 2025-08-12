import sharp from 'sharp'
import { Roles, User } from "../../../models/src"
import { Request, Response } from "express"

export const canViewBand = (req: Request, res: Response, next: any) => {
    if (getBandRole(req) !== Roles.unauthorized) {
        next()
    } else {
        res.status(401).json('Unauthorized')
    }
}

export const canEditBandDetails = (req: Request, res: Response, next: any) => {
    if ([Roles.owner, Roles.editor_detail].includes(getBandRole(req))) {
        next()
    } else {
        res.status(401).json('Unauthorized')
    }
}

export const canEditBandSetlist = (req: Request, res: Response, next: any) => {
    if ([Roles.owner, Roles.editor_setlist].includes(getBandRole(req))) {
        next()
    } else {
        res.status(401).json('Unauthorized')
    }
}

export const canEditBandEvents = (req: Request, res: Response, next: any) => {
    if ([Roles.owner, Roles.editor_event].includes(getBandRole(req))) {
        next()
    } else {
        res.status(401).json('Unauthorized')
    }
}

export const canEditBandMember = (req: Request, res: Response, next: any) => {
    if ([Roles.owner, Roles.editor_member].includes(getBandRole(req))) {
        next()
    } else {
        res.status(401).json('Unauthorized')
    }
}

function getBandRole(req: Request): Roles {
    return (req.user as User).bands?.find(b => b.band_id === +req.params.id)?.role || Roles.unauthorized;
}

export function getCurrentDateTimeInItaly(): string {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Europe/Rome',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(now);

    const year = parts.find(part => part.type === 'year')?.value;
    const month = parts.find(part => part.type === 'month')?.value;
    const day = parts.find(part => part.type === 'day')?.value;

    let hour = parts.find(part => part.type === 'hour')?.value;
    const minute = parts.find(part => part.type === 'minute')?.value;
    const second = parts.find(part => part.type === 'second')?.value;

    if (hour === '24') {
        hour = '00'
    }

    const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) (0\d|1\d|2[0-3]):[0-5]\d:[0-5]\d$/;
    const result = `${year}-${month}-${day} ${hour}:${minute}:${second}`

    if (dateRegex.test(result)) {
        return result
    }
    else {
        return '2024-01-01 00:00:00'
    }
}

export async function fileToBase64String(file: Express.Multer.File): Promise<string> {
    const avatarBuffer = file.buffer
    const optimizedAvatar = await sharp(avatarBuffer)
        .resize({ width: 200, height: 200 })
        .toBuffer()
    return `data:${file.mimetype};base64,${optimizedAvatar.toString('base64')}`
}