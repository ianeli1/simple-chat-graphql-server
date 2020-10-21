import { Arg, Ctx, InputType, Query, Resolver } from "type-graphql";
import { Context } from "../types";

@InputType()
@Resolver()
export class MiscResolver {
  @Query(() => String, { nullable: true })
  async debugGetToken(
    @Arg("email") email: string,
    @Arg("password") password: string,
    @Ctx() { clientAuth }: Context
  ): Promise<string | null> {
    const credential = await clientAuth.signInWithEmailAndPassword(
      email,
      password
    );
    if (credential.user) {
      return await credential.user.getIdToken(true);
    } else {
      return null;
    }
  }
}
