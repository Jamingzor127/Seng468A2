import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { UserEntity } from './user.entity';

export type NotificationsDocument = HydratedDocument<NotificationsEntity>;
@Schema()
export class NotificationsEntity {

    @Prop({type: mongoose.Schema.Types.ObjectId, ref: 'Users'})
    user: UserEntity

    @Prop()
    notification: string;

    @Prop()
    creationDate: Date;

    @Prop()
    lastUpdateDate: Date;
}

export const NotificationsSchema = SchemaFactory.createForClass(NotificationsEntity);