import { Field, InputType, ObjectType, registerEnumType } from "type-graphql";

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

@InputType()
export class EmoteData {
  @Field()
  name!: string;

  @Field()
  image!: string;
}

@ObjectType()
export class ProtoServer {
  @Field()
  id: number;

  @Field()
  name: string;

  @Field({ nullable: true })
  icon?: string;
}

@ObjectType()
export class EmoteObject {
  @Field()
  id: number;

  @Field()
  name!: string;

  @Field()
  image!: string;

  @Field(() => ProtoServer)
  owner: ProtoServer;
}

@ObjectType()
export class APIError {
  @Field(() => ErrorCode)
  code: ErrorCode;

  @Field()
  message: string;

  constructor(errorCode: ErrorCode, message?: string) {
    this.code = errorCode;
    this.message = `[${ErrorCode[errorCode]}]: ${message ?? "No info."}`;
  }
}

@ObjectType()
export class Confirmation {
  @Field()
  ok: Boolean;

  @Field({ nullable: true })
  error?: APIError;

  constructor(error: APIError);
  constructor(ok: Boolean);
  constructor(value: Boolean | APIError) {
    if (value instanceof APIError) {
      this.error = value;
      this.ok = false;
    } else {
      this.ok = value;
    }
  }
}

/**Returns the, very common, not logged in APIError */
export function notLoggedIn(message?: string) {
  return new APIError(ErrorCode.NOT_LOGGED_IN, message);
}

export enum ErrorCode {
  NOT_LOGGED_IN,
  USER_DOESNT_EXIST,
  SERVER_DOESNT_EXIST,
  EMOTE_DOESNT_EXIST,
  INVITE_DOESNT_EXIST,
  CHANNEL_DOESNT_EXIST,
  NOT_SERVER_ADMIN,
  NOT_SERVER_MEMBER,
  OTHER,
  UNKNOWN,
}

registerEnumType(ErrorCode, {
  name: "ErrorCode",
});
