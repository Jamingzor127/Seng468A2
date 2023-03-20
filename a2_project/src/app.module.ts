import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommentEntity, CommentSchema } from './entities/comment.entity';
import { NotificationsEntity, NotificationsSchema } from './entities/notifications.entity';
import { PostEntity, PostSchema } from './entities/post.entity';
import { UserEntity, UserSchema } from './entities/user.entity';
require('dotenv').config();

@Module({
  imports: [MongooseModule.forRoot(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URL}:${process.env.MONGO_PORT}/A2?authSource=admin`),
            MongooseModule.forFeature([{name: 'Posts', schema: PostSchema}, {name: 'Users', schema: UserSchema}, {name: 'Comments', schema: CommentSchema}, {name: 'Notifications', schema: NotificationsSchema}])],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
