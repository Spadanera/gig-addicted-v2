import router, { Router, Request, Response } from "express"
import bandApi from "../api/band"
import { authorizationMiddleware, Roles } from "../utils/helper"

const bandRouter: Router = router()

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
        const userId = (req.user as any).id
        const result = await bandApi.createBand(req.body, userId)
        res.status(200).json(result)
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
})


export default bandRouter