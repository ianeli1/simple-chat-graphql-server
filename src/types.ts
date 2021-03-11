import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { Request, Response } from "express";
import { Session } from "express-session";
import admin from "firebase-admin";

interface SessionKeys {
  uid?: string;
}

export interface Context {
  em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
  req: Request & { session: Session & SessionKeys };
  res: Response;
  auth: ReturnType<typeof admin.auth>;
  clientAuth: firebase.auth.Auth;
}

export interface pgCredentials {
  user: string;
  password: string;
  host: string;
  port: number;
}
