import router, { Router, Request, Response } from "express"
import bandApi from "../api/band"
import setlistApi from "../api/setlist"
import { canViewBand, canEditBandDetails, fileToBase64String, canEditBandSetlist, isBandOwner } from "../utils/helper"
import multer from 'multer'

const bandRouter: Router = router()

const upload = multer({ storage: multer.memoryStorage() })

bandRouter.get("/myband", async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any).id
        const result = await bandApi.getMyBands(userId)
        res.status(200).json(result)
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
})

bandRouter.post("/myband", async (req: Request, res: Response) => {
    try {
        const user = (req.user as any)
        const result = await bandApi.createBand(req.body, user.id)
        user.bands = user.bands || []
        user.bands.push({
            band_id: result,
            role: 'owner'
        })
        req.user = user
        res.status(200).json(result)
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
})

bandRouter.delete("/myband/:id", isBandOwner, async (req: Request, res: Response) => {
    try {
        const result = await bandApi.deleteBand(+req.params.id)
        res.status(200).json(result)
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
})

bandRouter.get("/myband/:id/details", canViewBand, async (req: Request, res: Response) => {
    try {
        const result = await bandApi.getBandDetails(+req.params.id)
        res.status(200).json(result)
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
})

bandRouter.put("/myband/:id/details", canEditBandDetails, async (req: Request, res: Response) => {
    try {
        const result = await bandApi.updateBandDetails(req.body)
        res.status(200).json(result)
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
})

bandRouter.put("/myband/:id/logo", canEditBandDetails, upload.single('logo'), async (req: Request, res: Response) => {
    try {
        let logo
        if (req.file) {
            logo = await fileToBase64String(req.file)
            const result = await bandApi.updateBandLogo(logo, +req.params.id)
            res.status(200).json(logo)
        }
        else {
            res.status(404).json('Missing image')
        }
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
})

bandRouter.get("/myband/:id/repertoire", canViewBand, async (req: Request, res: Response) => {
    try {
        const result = await setlistApi.getRepertoire(+req.params.id)
        res.status(200).json(result)
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
})

bandRouter.post("/myband/:id/song", canEditBandSetlist, async (req: Request, res: Response) => {
    try {
        const result = await setlistApi.insertSongIntoRepertoire(req.body)
        res.status(200).json(result)
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
})

bandRouter.put("/myband/:id/song", canEditBandSetlist, async (req: Request, res: Response) => {
    try {
        const result = await setlistApi.editSongInRepertorire(req.body)
        res.status(200).json(result)
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
})

bandRouter.get("/myband/:id/setlist", canViewBand, async (req: Request, res: Response) => {
    try {
        const result = await setlistApi.getSetlistTemplates(+req.params.id)
        res.status(200).json(result)
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
})

bandRouter.put("/myband/:id/setlist/:setlistid/song", canEditBandSetlist, async (req: Request, res: Response) => {
    try {
        const result = await setlistApi.saveSetlistSong(+req.params.setlistid, req.body)
        res.status(200).json(result)
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
})

bandRouter.post("/myband/:id/setlist", canEditBandSetlist, async (req: Request, res: Response) => {
    try {
        const result = await setlistApi.createSetlist(req.body)
        res.status(200).json(result)
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
})

bandRouter.delete("/myband/:id/setlist/:setlistid", canEditBandSetlist, async (req: Request, res: Response) => {
    try {
        const result = await setlistApi.deleteSetlist(+req.params.setlistid)
        res.status(200).json(result)
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
})

bandRouter.put("/myband/:id/setlist", canEditBandSetlist, async (req: Request, res: Response) => {
    try {
        const result = await setlistApi.editSetlist(req.body)
        res.status(200).json(result)
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
})


export default bandRouter