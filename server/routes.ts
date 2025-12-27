import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import path from "path";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Serve the 'website' directory as static files on the root path
  // This allows accessing the PhishGuard Hub directly
  app.use(express.static(path.join(process.cwd(), "website")));

  // API routes can go here if needed, but per requirements, this is a static project.
  
  return httpServer;
}
