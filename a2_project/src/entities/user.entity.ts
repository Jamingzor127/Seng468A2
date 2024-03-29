import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { CommentEntity } from './comment.entity';
import { NotificationsEntity } from './notifications.entity';
import { PostEntity } from './post.entity';

export type UserDocument = HydratedDocument<UserEntity>;

@Schema()
export class UserEntity {
    
    @Prop()
    username: string;

    @Prop()
    firstName: string;

    @Prop()
    lastName: string;
    
    @Prop()
    password: string;
    
    @Prop()
    email: string;

    @Prop()
    dateOfBirth: string;

    @Prop({type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Users'}]})
    friendList: UserEntity[];

    @Prop()
    creationDate: Date;

    @Prop()
    lastUpdateDate: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserEntity);
