import { Field, InputType } from "type-graphql";

@InputType()
export class UserData {
  @Field()
  name!: string;

  @Field()
  email!: string;

  @Field(() => Date)
  birthday: Date;
}

//TODO: add support for images and emotes
@InputType()
export class MessageData {
  @Field()
  content!: string;
}
