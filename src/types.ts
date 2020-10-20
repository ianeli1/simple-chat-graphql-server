import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";

export interface Context {
  em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
}
