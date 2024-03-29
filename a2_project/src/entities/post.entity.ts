import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { CommentEntity } from './comment.entity';
import { UserEntity } from './user.entity';

export type PostDocument = HydratedDocument<PostEntity>;

@Schema()
export class PostEntity {
    
    @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'Users'})
    user: UserEntity

    @Prop()
    title: string;
    
    @Prop()
    content: string;

    @Prop()
    numberOfLikes: number;

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Users'}]})
    usersLiked: UserEntity[];
    
    @Prop()
    creationDate: Date;

    @Prop()
    lastUpdateDate: Date;
    }

export const PostSchema = SchemaFactory.createForClass(PostEntity);