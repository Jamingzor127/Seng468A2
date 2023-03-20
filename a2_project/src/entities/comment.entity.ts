import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { PostEntity } from './post.entity';
import { UserEntity } from './user.entity';

export type CommentDocument = HydratedDocument<CommentEntity>;
@Schema()
export class CommentEntity {
    
    @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'Users'})
    user: UserEntity;

    @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'Posts'})
    post: PostEntity;
    
    @Prop()
    comment: string;

    @Prop()
    numberOfLikes: number;

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Users'}]})
    usersLiked: UserEntity[];
    
    @Prop()
    creationDate: Date;

    @Prop()
    lastUpdateDate: Date;
    }

export const CommentSchema = SchemaFactory.createForClass(CommentEntity);