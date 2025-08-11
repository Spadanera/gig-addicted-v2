import router, { Router } from "express"
import publicApiRouter from "./public"
import bandRouter from "./band-router"

const apiRouter: Router = router()

apiRouter.use("/band", bandRouter)
apiRouter.use("/public", publicApiRouter)

export default apiRouter

