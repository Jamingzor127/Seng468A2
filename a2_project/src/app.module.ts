import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommentEntity } from './entities/comment.entity';
import { NotificationsEntity } from './entities/notifications.entity';
import { PostEntity } from './entities/post.entity';
import { UserEntity } from './entities/user.entity';

@Module({
  imports: [MongooseModule.forRoot(`mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSOWRD}@${process.env.MONGO_URL}:${process.env.MONGO_PORT}/A2?authSource=admin`),
            MongooseModule.forFeature([{name: 'Posts', schema: PostEntity}, {name: 'Users', schema: UserEntity}, {name: 'Comments', schema: CommentEntity}, {name: 'Notifications', schema: NotificationsEntity}])],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
