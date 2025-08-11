import router, { Router, Request, Response } from "express"
import bandApi from "../api/band"
import { authorizationMiddleware, fileToBase64String, Roles } from "../utils/helper"
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

bandRouter.get("/myband/:id/details", async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any).id
        const result = await bandApi.getBandDetails(+req.params.id, userId)
        res.status(200).json(result)
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
})

bandRouter.post("/myband", async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any).id
        const result = await bandApi.createBand(req.body, userId)
        res.status(200).json(result)
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
})

bandRouter.put("/myband", async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any).id
        const result = await bandApi.updateBandDetails(req.body, userId)
        res.status(200).json(result)
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
})

bandRouter.put("/myband/:id/logo", upload.single('logo'), async (req: Request, res: Response) => {
    try {
        const userId = (req.user as any).id
        
        let logo
        if (req.file) {
            logo = await fileToBase64String(req.file)
            const result = await bandApi.updateBandLogo(logo, +req.params.id, userId)
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


export default bandRouter