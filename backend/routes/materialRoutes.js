import { Router } from "express";
import { getMaterial, health, listByNames, listMaterials, listNames } from "../controllers/materialController.js";

const router = Router();
router.get("/health", health);
router.get("/materials", listMaterials);
router.get("/materials/names", listNames);
router.get("/materials/by-names", listByNames);
router.get("/materials/:name", getMaterial);
export default router;
