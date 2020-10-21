import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";
import { Request, Response } from "express";
import { admin } from "firebase-admin/lib/auth";

interface SessionKeys {
  uid?: string;
}

export interface Context {
  em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
  req: Request & { session: Express.Session & SessionKeys };
  res: Response;
  auth: admin.auth.Auth;
  clientAuth: firebase.auth.Auth;
}
