import { Injectable, OnModuleInit } from '@nestjs/common';
import {ObjectID} from 'mongodb';
import * as redis from 'redis';
import { createUserDto } from './dtos/createUser.dto';
import { UserEntity } from './entities/user.entity';
import { CommentEntity } from './entities/comment.entity';
import { PostEntity } from './entities/post.entity';
import { NotificationsEntity } from './entities/notifications.entity';
import { GetUserReportDto } from './dtos/getUserReport.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
require('dotenv').config();

@Injectable()
export class AppService implements OnModuleInit {
  constructor(@InjectModel('Users') private userModel: Model<UserEntity>,
              @InjectModel('Posts') private postModel: Model<PostEntity>,
              @InjectModel('Comments') private commentModel: Model<CommentEntity>,
              @InjectModel('Notifications') private notificationsModel: Model<NotificationsEntity>,) {

  }
  redisClient;

  async onModuleInit() {
    this.redisClient = redis.createClient({url: `redis://${process.env.REDIS_URL}:${process.env.REDIS_PORT}/0`});
    await this.redisClient.connect();
  }

  async getUserIds(): Promise<string[]> {
    const users = await this.userModel.find({}, {_id: true}).exec();
    return users.map((user) => user._id.toString());
  }

  async createUser(user: createUserDto): Promise<boolean> {
    const findUser = await this.userModel.findOne({where: {email: user.email, username: user.username}});
    if (findUser) {
      return false;
    }
    const newUser = await this.userModel.create(user);
    if (!newUser.friendList) newUser.friendList = [];
    newUser.creationDate = new Date();
    newUser.lastUpdateDate = new Date();
    await newUser.save();
    return true;
  }

  async deleteUser(userId: string) {
    const objectIdUser = new ObjectID(userId);
    await this.userModel.deleteOne({_id: objectIdUser});
    return true;
  }

  async addFriend(userName: string, friendName: string) {
    const findUser1 = await this.userModel.findOne({where: {userName: userName}});
    const findUser2 = await this.userModel.findOne({where: {userName: friendName}});
    if(!findUser1 || !findUser2) return false;
    findUser1.friendList.push(findUser2);
    findUser2.friendList.push(findUser1);
    await findUser1.save();
    await findUser2.save();
    return true;
  }

  async removeFriend(userName: string, friendName: string) {
    const findUser1 = await this.userModel.findOne({where: {userName: userName}}).populate('Users').exec();
    const findUser2 = await this.userModel.findOne({where: {userName: friendName}}).populate('Users').exec();
    if(!findUser1 || !findUser2) return false;
    findUser1.friendList = findUser1.friendList.filter((friend) => friend.username !== friendName);
    findUser2.friendList = findUser2.friendList.filter((friend) => friend.username !== userName);
    await findUser1.save();
    await findUser2.save();
    return true;
  }


  async getFriends(userName: string): Promise<UserEntity[]> {
    const user = await this.getUser(userName);
    if(!user) return [];
    const friends = [];
    for(const friend of user.friendList) {
      const friendUser = await this.getUser(friend.username);
      if(friendUser) friends.push(friendUser);
    }
    return friends;
  }

  async getUser(userName: string): Promise<UserEntity> {
    const findUserFromCache = await this.redisClient.get(userName);
    let user: UserEntity;
    if (findUserFromCache) {
      user = JSON.parse(findUserFromCache);
    } else {
      user = await this.userModel.findOne({where: {userName: userName}}).populate("Posts").populate("Comments").populate("Notifications").populate('Users').exec();
      if(!user) return null;
      await this.redisClient.set(userName, JSON.stringify(user),  {PX: parseInt(process.env.CACHE_TIME)});
    }
    return user;
  }

  async getCommentIds(): Promise<string[]> {
    const comments = await this.commentModel.find({}, {_id: true}).exec();
    return comments.map((comment) => comment._id.toString());
  }

  async addComment(userName: string, comment: string, postId: string) {
    const newComment = await this.commentModel.create({comment});
    newComment.user = await this.getUser(userName);
    newComment.post = await this.getPost(postId);
    newComment.creationDate = new Date();
    newComment.lastUpdateDate = new Date();
    newComment.usersLiked = [];
    newComment.numberOfLikes = 0;
    await newComment.save();
    return true;
  }

  async removeComment(userName: string, commentId: string) {
    const objectIdComment = new ObjectID(commentId);
    const findComment = await this.commentModel.findOne({where: {_id: objectIdComment}}).populate("User").exec();
    if(!findComment) return false;
    if(findComment.user.username !== userName) return false;
    await this.commentModel.deleteOne({_id: objectIdComment});
    return true;
  }

  async editComment(userName: string, commentId: string, comment: string) {
    const objectIdComment = new ObjectID(commentId);
    const findComment = await this.commentModel.findOne({where: {_id: objectIdComment}}).populate("User").exec();
    if(!findComment) return false;
    if(findComment.user.username !== userName) return false;
    findComment.comment = comment;
    findComment.lastUpdateDate = new Date();
    await this.commentModel.findOneAndUpdate({where: {_id: objectIdComment}}, findComment);
    return true;
  }

  async likeComment(userName: string, commentId: string) {
    const comment = await this.getComment(commentId);
    if(!comment) return false;
    if(comment.user.username === userName) return false;
    if(comment.usersLiked.filter(e => e.username === userName).length > 0) return false;
    const user = await this.getUser(userName);
    comment.usersLiked.push(user);
    comment.numberOfLikes++;
    const objectIdComment = new ObjectID(commentId);
    await this.commentModel.findOneAndUpdate({where: {_id: objectIdComment}}, comment);
    return true;
  }

  async unlikeComment(userName: string, commentId: string) {
    const comment = await this.getComment(commentId);
    if(!comment) return false;
    if(comment.user.username === userName) return false;
    if(!(comment.usersLiked.filter(e => e.username === userName).length > 0)) return false;
    comment.usersLiked = comment.usersLiked.filter((user) => user.username !== userName);
    comment.numberOfLikes--;
    const objectIdComment = new ObjectID(commentId);
    await this.commentModel.findOneAndUpdate({where: {_id: objectIdComment}}, comment);
    return true;
  }

  async getLikedComments(userId: string): Promise<CommentEntity[]> {
    const user = await this.getUser(userId);
    const commentsIds = await this.datasource.getMongoRepository(CommentEntity).find({where: {usersLiked: user._id}, select: {_id: true}});
    if(!commentsIds) return []
    const comments = []
    for(const id of commentsIds) {
      const comment = await this.getComment(id._id);
      if(comment != null) comments.push(comment)
    }
    return comments
  }
  async getCommentsForUser(userId: string): Promise<CommentEntity[]> {
    const commentsIds = await this.datasource.getMongoRepository(CommentEntity).find({where: {userId: userId}, select: {_id: true}});
    if(!commentsIds) return []
    const comments = []
    for(const id of commentsIds) {
      const comment = await this.getComment(id._id);
      if(comment != null) comments.push(comment)
    }
    return comments
  }

  async getCommentsForPost(postId: string): Promise<CommentEntity[]> {
    const commentsIds = await this.datasource.getMongoRepository(CommentEntity).find({where: {postId: postId}, select: {_id: true}});
    if(!commentsIds) return []
    const comments = []
    for(const id of commentsIds) {
      const comment = await this.getComment(id._id);
      if(comment != null) comments.push(comment)
    }
    return comments
  }

  async getCommentsForPostForUser(userId: string, postId: string): Promise<CommentEntity[]> {
    const commentsIds = await this.datasource.getMongoRepository(CommentEntity).find({where: {postId: postId, userId: userId}, select: {_id: true}});
    if(!commentsIds) return []
    const comments = []
    for(const id of commentsIds) {
      const comment = await this.getComment(id._id);
      if(comment != null) comments.push(comment)
    }
    return comments
  }

  async getComment(commentId: string): Promise<CommentEntity> {
    const findCommentFromCache = await this.redisClient.get(commentId);
    let comment: CommentEntity;
    if (findCommentFromCache) {
      comment = JSON.parse(findCommentFromCache);
    } else {
      const objectIdComment = new ObjectID(commentId);
      comment = await this.datasource.getMongoRepository(CommentEntity).findOne({where: {_id: objectIdComment}});
      if(!comment) return null;
      await this.redisClient.set(commentId, JSON.stringify(comment),  {PX: parseInt(process.env.CACHE_TIME)});
    }
    return comment;
  }

  async getPostIds(): Promise<string[]> {
    const posts = await this.datasource.getMongoRepository(PostEntity).find({select: {_id: true}});
    return posts.map((post) => post._id.toString());
  }

  async createPost(userId: string, title: string, content: string) {
    const newPost = this.datasource.getMongoRepository(PostEntity).create({userId, content, title});
    newPost.creationDate = new Date();
    newPost.lastUpdateDate = new Date();
    newPost.numberOfLikes = 0;
    newPost.usersLiked = [];
    await this.datasource.getMongoRepository(PostEntity).save(newPost);
    return true;
  }

  async removePost(postId: string) {
    const findPost = await this.datasource.getMongoRepository(PostEntity).findOne({where: {_id: postId}})
    if(!findPost) return false;
    await this.datasource.getMongoRepository(PostEntity).delete(postId)
  }

  async editPostContent(postId: string, content: string) {
    const objectIdPost = new ObjectID(postId);
    const findPost = await this.datasource.getMongoRepository(PostEntity).findOne({where: {_id: objectIdPost}})
    if(!findPost) return false;
    findPost.content = content;
    findPost.lastUpdateDate;
    await this.datasource.getMongoRepository(PostEntity).findOneAndUpdate({where: {_id: objectIdPost}},findPost);
    return true;
  }

  async editPostTitle(postId: string, title: string) {
    const objectIdPost = new ObjectID(postId);
    const findPost = await this.datasource.getMongoRepository(PostEntity).findOne({where: {_id: objectIdPost}})
    if(!findPost) return false;
    findPost.title = title;
    findPost.lastUpdateDate;
    await this.datasource.getMongoRepository(PostEntity).findOneAndUpdate({where: {_id: objectIdPost}}, findPost);
    return true;
  }
  
  async editPostTitleAndContent(postId: string, title: string, content: string) {
    const objectIdPost = new ObjectID(postId);
    const findPost = await this.datasource.getMongoRepository(PostEntity).findOne({where: {_id: objectIdPost}})
    if(!findPost) return false;
    findPost.content = content;
    findPost.title = title;
    findPost.lastUpdateDate;
    await this.datasource.getMongoRepository(PostEntity).findOneAndUpdate({where: {_id: objectIdPost}}, findPost);
    return true;
  }

  async likePost(userId: string, postId: string) {
    const findPost = await this.getPost(postId);
    if(!findPost) return false;
    if(findPost.userId === userId) return false;
    if(findPost.usersLiked.includes(userId)) return false;
    findPost.usersLiked.push(userId);
    findPost.numberOfLikes++;
    const objectIdPost = new ObjectID(postId);
    await this.datasource.getMongoRepository(PostEntity).findOneAndUpdate({where: {_id: objectIdPost}}, findPost);
    return true;
  }

  async unlikePost(userId: string, postId: string) {
    const findPost = await this.getPost(postId);
    if(!findPost) return false;
    if(findPost.userId === userId) return false;
    if(!findPost.usersLiked.includes(userId)) return false;
    findPost.usersLiked = findPost.usersLiked.filter((user) => user !== userId);
    findPost.numberOfLikes--;
    const objectIdPost = new ObjectID(postId);
    await this.datasource.getMongoRepository(PostEntity).findOneAndUpdate({where: {_id: objectIdPost}}, findPost);
    return true;
  }

  async getLikedPosts(userId: string): Promise<PostEntity[]> {
    const posts = await this.datasource.getMongoRepository(PostEntity).find({where: {usersLiked: userId}, select: {_id: true}});
    if(!posts) return [];
    const postsToReturn = [];
    for(const post of posts) {
      const postToReturn = await this.getPost(post._id);
      if(postToReturn != null) postsToReturn.push(postToReturn);
    }
    return postsToReturn;
  }

  async getPosts(userId: string): Promise<PostEntity[]> {
    const posts = await this.datasource.getMongoRepository(PostEntity).find({where: {userId: userId}, select: {_id: true}});
    if(!posts) return [];
    const postsToReturn = [];
    for(const post of posts) {
      const postToReturn = await this.getPost(post._id);
      if(postToReturn != null) postsToReturn.push(postToReturn);
    }
    return postsToReturn;
  }

  async getPost(postId: string): Promise<PostEntity> {
    const findPostFromCache = await this.redisClient.get(postId);
    let post: PostEntity;
    if (findPostFromCache) {
      post = JSON.parse(findPostFromCache);
    } else {
      const objectIdPost = new ObjectID(postId);
      post = await this.datasource.getMongoRepository(PostEntity).findOne({where: {_id: objectIdPost}});
      if(!post) return null;
      await this.redisClient.set(postId, JSON.stringify(post),  {PX: parseInt(process.env.CACHE_TIME)});
    }
    return post;
  }

  async createNotification(notification: string) {
    const newNotification = this.datasource.getMongoRepository(NotificationsEntity).create({notification});
    newNotification.creationDate = new Date();
    newNotification.lastUpdateDate = new Date();
    await this.datasource.getMongoRepository(NotificationsEntity).save(newNotification);
    return true;
  }

  async getNotifications(userId: string): Promise<NotificationsEntity[]> {
    const notifications = await this.datasource.getMongoRepository(NotificationsEntity).find({where: {userId: userId}, select: {_id: true}});
    if(!notifications) return [];
    const notificationsToReturn = [];
    for(const notification of notifications) {
      const notificationToReturn = await this.getNotification(notification._id);
      if(notificationToReturn != null) notificationsToReturn.push(notificationToReturn);
    }
    return notificationsToReturn;
  }

  async getNotification(notificationId: string): Promise<NotificationsEntity> {
    const findNotificationFromCache = await this.redisClient.get(notificationId);
    let notification: NotificationsEntity;
    if (findNotificationFromCache) {
      notification = JSON.parse(findNotificationFromCache);
    } else {
      const objectIdNotification = new ObjectID(notificationId);
      notification = await this.datasource.getMongoRepository(NotificationsEntity).findOne({where: {_id: objectIdNotification}});
      if(!notification) return null;
      await this.redisClient.set(notificationId, JSON.stringify(notification),  {PX: parseInt(process.env.CACHE_TIME)});
    }
    return notification;
  }

  async getUserReports(userId: string): Promise<GetUserReportDto> {
    const User = await this.getUser(userId);
    if(!User) return null;
    const posts = await this.getPosts(userId);
    const likedPosts = await this.getLikedPosts(userId);
    const comments = await this.getCommentsForUser(userId);
    const likedComments = await this.getLikedComments(userId);


    const userReport: GetUserReportDto = {
      username: User.username,
      firstName: User.firstName,
      lastName: User.lastName,
      email: User.email,
      dateOfBirth: User.dateOfBirth,
      posts: posts,
      likedPosts: likedPosts,
      comments: comments,
      likedComments: likedComments,
    }

    return userReport;

  }



}
