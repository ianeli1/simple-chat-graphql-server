import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Resolver } from "type-graphql";
import { User } from "../entities/User";
import { Context } from "../types";

@ObjectType()
export class Relation{
    @Field(() => User)
    owner!: User

    @Field(() => User)
    slave!: User

    constructor(owner: User, slave: User){
        this.owner = owner
        this.slave = slave
    }
}

@InputType()
@Resolver()
export class RelationResolver{
    

    @Mutation(() => Boolean, {nullable: true, })
    async sendRequest(@Arg("userId") userId: string, @Ctx() {em, req}: Context){
        if(!req.session.uid){
            return null
        }
        const me = em.getReference(User, req.session.uid)
        const target = await em.findOne(User, {id: userId}, {populate: true})
        if(me && target){
            target.friendRequests.add(me)
            await em.persistAndFlush(target)
            return true
        }else{
            return null
        }
    }

    @Mutation(() => Boolean, {nullable: true})
    async acceptRequest(@Arg("userId") userId: string, @Ctx() {em, req}: Context){
        if(!req.session.uid){
            return null
        }

        const me = await em.findOne(User, {id: req.session.uid})
        const target = em.getReference(User, userId)
        if(me?.friendRequests.contains(target)){
            me.friendRequests.remove(target)
            me.friends.add(target)
            target.friends.add(me)
            em.persist(me)
            em.persist(target)
            await em.flush()
            return true
        }else{
            return null
        }
    }

    @Mutation(() => Boolean, {nullable: false})
    async declineRequest(@Arg("userId") userId: string, @Ctx() {em, req}: Context){
        if(!req.session.uid){
            return null
        }

        const me = await em.findOne(User, {id: req.session.uid})
        const target = em.getReference(User, userId)
        if(me?.friendRequests.contains(target)){
            me.friendRequests.remove(target)
            await em.persistAndFlush(me)
            return true
        }else{
            return null
        }
    }

    @Mutation(() => Boolean, {nullable: true})
    async removeFriend(@Arg("userId") userId: string, @Ctx() {em, req}: Context){
        if(!req.session.uid){
            return null
        }
        const me = await em.findOne(User, {id: req.session.uid})
        const target = em.getReference(User, userId)
        if(me?.friends.contains(target)){
            target.friends.remove(me)
            me.friends.remove(target)
            em.persist(target)
            em.persist(me)
            await em.flush()
            return true
        }else{
            return null
        }
    }
}