import { Injectable, OnModuleInit } from '@nestjs/common';
import {ObjectId} from 'mongodb';
import * as redis from 'redis';
import { createUserDto } from './dtos/createUser.dto';
import { UserDocument, UserEntity } from './entities/user.entity';
import { CommentDocument, CommentEntity } from './entities/comment.entity';
import { PostDocument, PostEntity } from './entities/post.entity';
import { NotificationsDocument, NotificationsEntity } from './entities/notifications.entity';
import { GetUserReportDto } from './dtos/getUserReport.dto';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
require('dotenv').config();

@Injectable()
export class AppService implements OnModuleInit {
  constructor(@InjectModel('Users') private userModel: Model<UserDocument>,
              @InjectModel('Posts') private postModel: Model<PostDocument>,
              @InjectModel('Comments') private commentModel: Model<CommentDocument>,
              @InjectModel('Notifications') private notificationsModel: Model<NotificationsDocument>,) {

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
    const findUser = await this.userModel.findOne({email: user.email, username: user.username}).exec();
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

  async deleteUser(userName: string) {
    await this.userModel.deleteOne({username: userName}).exec();
    return true;
  }

  async addFriend(userName: string, friendName: string) {
    const findUser1 = await this.userModel.findOne({username: userName}).populate('friendList').exec();
    const findUser2 = await this.userModel.findOne({username: friendName}).populate('friendList').exec();
    if(!findUser1 || !findUser2) return false;
    findUser1.friendList.push(findUser2);
    findUser2.friendList.push(findUser1);

    await findUser1.save();
    await findUser2.save();
    return true;
  }

  async removeFriend(userName: string, friendName: string) {
    const findUser1 = await this.userModel.findOne({username: userName}).populate('friendList').exec();
    const findUser2 = await this.userModel.findOne({username: friendName}).populate('friendList').exec();
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
      user = await this.userModel.findOne({username: userName}).populate("friendList").exec();
      if(!user) return null;
      await this.redisClient.set(userName, JSON.stringify(user),  {PX: parseInt(process.env.CACHE_TIME)});
    }
    return user;
  }

  async getCommentIds(): Promise<string[]> {
    const comments = await this.commentModel.find().exec();
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
    const ObjectIdComment = new ObjectId(commentId);
    const findComment = await this.commentModel.findOne({_id: ObjectIdComment}).populate("user").exec();
    if(!findComment) return false;
    if(findComment.user.username !== userName) return false;
    await this.commentModel.deleteOne({_id: ObjectIdComment});
    return true;
  }

  async editComment(userName: string, commentId: string, comment: string) {
    const ObjectIdComment = new ObjectId(commentId);
    const findComment = await this.commentModel.findOne({_id: ObjectIdComment}).populate("user").exec();
    if(!findComment) return false;
    if(findComment.user.username !== userName) return false;
    findComment.comment = comment;
    findComment.lastUpdateDate = new Date();
    await this.commentModel.findOneAndUpdate({_id: ObjectIdComment}, {$set: findComment}).exec();
    return true;
  }

  async likeComment(userName: string, commentId: string) {
    const ObjectIdComment = new ObjectId(commentId);
    const comment = await this.commentModel.findOne({_id: ObjectIdComment}).populate("user").populate("usersLiked").exec();
    if(!comment) return false;
    if(comment.user.username === userName) return false;
    if(comment.usersLiked.filter(e => e.username === userName).length > 0) return false;
    const user = await this.getUser(userName);
    comment.usersLiked.push(user);
    comment.numberOfLikes++;
    await this.commentModel.findOneAndUpdate({_id: ObjectIdComment}, {$set: comment}).exec();
    return true;
  }

  async unlikeComment(userName: string, commentId: string) {
    const ObjectIdComment = new ObjectId(commentId);
    const comment = await this.commentModel.findOne({_id: ObjectIdComment}).populate("user").populate("usersLiked").exec();
    if(!comment) return false;
    if(comment.user.username === userName) return false;
    if(!(comment.usersLiked.filter(e => e.username === userName).length > 0)) return false;
    comment.usersLiked = comment.usersLiked.filter((user) => user.username !== userName);
    comment.numberOfLikes--;
    await this.commentModel.findOneAndUpdate({_id: ObjectIdComment}, {$set: comment}).exec();
    return true;
  }

  async getLikedComments(userName: string): Promise<CommentEntity[]> {
    const user = await this.getUser(userName);
    const commentsIds = await this.commentModel.find({usersLiked: user}).populate("user").populate("post").populate("usersLiked").exec();
    if(!commentsIds) return []
    const comments = []
    for(const id of commentsIds) {
      const comment = await this.getComment(id._id.toString());
      if(comment != null) comments.push(comment)
    }
    return comments
  }
  async getCommentsForUser(userName: string): Promise<CommentEntity[]> {
    const user = await this.getUser(userName);
    const commentsIds = await this.commentModel.find({user: user}).populate("user").populate("post").populate("usersLiked").exec();
    if(!commentsIds) return []
    const comments = []
    for(const id of commentsIds) {
      const comment = await this.getComment(id._id.toString());
      if(comment != null) comments.push(comment)
    }
    return comments
  }

  async getCommentsForPost(postId: string): Promise<CommentEntity[]> {
    const post = await this.getPost(postId);
    const commentsIds = await this.commentModel.find({post: post}).populate("user").populate("post").populate("usersLiked").exec();
    if(!commentsIds) return []
    const comments = []
    for(const id of commentsIds) {
      const comment = await this.getComment(id._id.toString());
      if(comment != null) comments.push(comment)
    }
    return comments
  }

  async getCommentsForPostForUser(userName: string, postId: string): Promise<CommentEntity[]> {
    const user = await this.getUser(userName);
    const post = await this.getPost(postId);
    const commentsIds = await this.commentModel.find({user: user, post: post}).exec();
    if(!commentsIds) return []
    const comments = []
    for(const id of commentsIds) {
      const comment = await this.getComment(id._id.toString());
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
      const ObjectIdComment = new ObjectId(commentId);
      comment = await this.commentModel.findOne({_id: ObjectIdComment}).populate("user").populate("post").populate("usersLiked").exec();
      if(!comment) return null;
      await this.redisClient.set(commentId, JSON.stringify(comment),  {PX: parseInt(process.env.CACHE_TIME)});
    }
    return comment;
  }

  async getPostIds(): Promise<string[]> {
    const posts = await this.postModel.find().exec();
    return posts.map((post) => post._id.toString());
  }

  async createPost(userName: string, title: string, content: string) {
    const user = await this.getUser(userName);
    const newPost = await this.postModel.create({user, content, title});
    newPost.creationDate = new Date();
    newPost.lastUpdateDate = new Date();
    newPost.numberOfLikes = 0;
    newPost.usersLiked = [];
    await newPost.save();
    return true;
  }

  async removePost(postId: string) {
    const ObjectIdPost = new ObjectId(postId);
    const findPost = await this.postModel.findOne({_id: ObjectIdPost}).exec()
    if(!findPost) return false;
    await this.postModel.deleteOne({_id: ObjectIdPost});
  }

  async editPostContent(postId: string, content: string) {
    const ObjectIdPost = new ObjectId(postId);
    const findPost = await this.postModel.findOne({_id: ObjectIdPost}).exec()
    if(!findPost) return false;
    findPost.content = content;
    findPost.lastUpdateDate;
    await this.postModel.findOneAndUpdate({_id: ObjectIdPost},{$set: findPost}).exec();
    return true;
  }

  async editPostTitle(postId: string, title: string) {
    const ObjectIdPost = new ObjectId(postId);
    const findPost = await this.postModel.findOne({_id: ObjectIdPost}).exec()
    if(!findPost) return false;
    findPost.title = title;
    findPost.lastUpdateDate;
    await this.postModel.findOneAndUpdate({_id: ObjectIdPost}, {$set: findPost}).exec();
    return true;
  }
  
  async editPostTitleAndContent(postId: string, title: string, content: string) {
    const ObjectIdPost = new ObjectId(postId);
    const findPost = await this.postModel.findOne({_id: ObjectIdPost}).exec()
    if(!findPost) return false;
    findPost.content = content;
    findPost.title = title;
    findPost.lastUpdateDate;
    await this.postModel.findOneAndUpdate({_id: ObjectIdPost}, {$set: findPost}).exec();
    return true;
  }

  async likePost(userName: string, postId: string) {
    const ObjectIdPost = new ObjectId(postId);
    const findPost = await this.postModel.findOne({_id: ObjectIdPost}).populate("user").populate('usersLiked').exec();
    if(!findPost) return false;
    if(findPost.user.username === userName) return false;
    if(findPost.usersLiked.filter(e => e.username === userName).length > 0) return false;
    const user = await this.getUser(userName);
    findPost.usersLiked.push(user);
    findPost.numberOfLikes++;
    await this.postModel.findOneAndUpdate({_id: ObjectIdPost}, {$set: findPost}).exec();
    return true;
  }

  async unlikePost(userName: string, postId: string) {
    const ObjectIdPost = new ObjectId(postId);
    const findPost = await this.postModel.findOne({_id: ObjectIdPost}).populate("user").populate('usersLiked').exec();
    if(!findPost) return false;
    if(findPost.user.username === userName) return false;
    if(!(findPost.usersLiked.filter(e => e.username === userName).length > 0)) return false;
    findPost.usersLiked = findPost.usersLiked.filter((user) => user.username !== userName);
    findPost.numberOfLikes--;
    await this.postModel.findOneAndUpdate({_id: ObjectIdPost}, findPost).exec();
    return true;
  }

  async getLikedPosts(userName: string): Promise<PostEntity[]> {
    const user = await this.getUser(userName);
    const posts = await this.postModel.find({usersLiked: user}).exec();
    if(!posts) return [];
    const postsToReturn = [];
    for(const post of posts) {
      const postToReturn = await this.getPost(post._id.toString());
      if(postToReturn != null) postsToReturn.push(postToReturn);
    }
    return postsToReturn;
  }

  async getPosts(userName: string): Promise<PostEntity[]> {
    const user = await this.getUser(userName);
    const posts = await this.postModel.find({user: user}).exec();
    if(!posts) return [];
    const postsToReturn = [];
    for(const post of posts) {
      const postToReturn = await this.getPost(post._id.toString());
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
      const ObjectIdPost = new ObjectId(postId);
      post = await this.postModel.findOne({_id: ObjectIdPost}).populate("user").populate('usersLiked').exec();
      if(!post) return null;
      await this.redisClient.set(postId, JSON.stringify(post),  {PX: parseInt(process.env.CACHE_TIME)});
    }
    return post;
  }

  async createNotification(notification: string, userName: string) {
    const user = await this.getUser(userName);
    const newNotification = await this.postModel.create({notification, user});
    newNotification.creationDate = new Date();
    newNotification.lastUpdateDate = new Date();
    await newNotification.save();
    return true;
  }

  async getNotifications(userName: string): Promise<NotificationsEntity[]> {
    const user = await this.getUser(userName);
    const notifications = await this.notificationsModel.find({user: user}).exec();
    if(!notifications) return [];
    const notificationsToReturn = [];
    for(const notification of notifications) {
      const notificationToReturn = await this.getNotification(notification._id.toString());
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
      const ObjectIdNotification = new ObjectId(notificationId);
      notification = await this.notificationsModel.findOne({_id: ObjectIdNotification}).populate("user").exec();
      if(!notification) return null;
      await this.redisClient.set(notificationId, JSON.stringify(notification),  {PX: parseInt(process.env.CACHE_TIME)});
    }
    return notification;
  }

  async getUserReports(userName: string): Promise<GetUserReportDto> {
    const User = await this.getUser(userName);
    if(!User) return null;
    const posts = await this.getPosts(userName);
    const likedPosts = await this.getLikedPosts(userName);
    const comments = await this.getCommentsForUser(userName);
    const likedComments = await this.getLikedComments(userName);


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
