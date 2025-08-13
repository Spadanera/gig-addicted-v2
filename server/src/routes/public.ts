import router, { Router, Request, Response } from "express"
import userApi from "../api/user"
import multer from 'multer'
import { fileToBase64String} from '../utils/helper'

const upload = multer({ storage: multer.memoryStorage() })

const publicApiRouter: Router = router()

export default publicApiRouter