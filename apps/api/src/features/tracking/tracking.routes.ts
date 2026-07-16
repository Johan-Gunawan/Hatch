import { Hono } from "hono";
import { trackHandler } from "./tracking.handler.js";

export const trackingRouter = new Hono().post("/event", trackHandler);
