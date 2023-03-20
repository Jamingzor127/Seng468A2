import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { createCommentDto } from './dtos/createComment.dto';
import { createPostDto } from './dtos/createPost.dto';
import { createUserDto } from './dtos/createUser.dto';
import { editCommentDto } from './dtos/editComment.dto';
import { editPostDto } from './dtos/editPost.dto';
import { GetUserReportDto } from './dtos/getUserReport.dto';
import { CommentEntity } from './entities/comment.entity';
import { PostEntity } from './entities/post.entity';
import { UserEntity } from './entities/user.entity';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('UserIds')
  getUserIds(): Promise<string[]> {
    return this.appService.getUserIds();
  }

  @Post('CreateUser')
  createUser(@Body() user: createUserDto): Promise<boolean> {
    return this.appService.createUser(user);
  }

  @Delete('User/:username')
  deleteUser(@Param('username') username: string): Promise<boolean> {
    return this.appService.deleteUser(username);
  }

  @Patch('AddFriend/:username/:friendUsername')
  addFriend(@Param('username') username: string, @Param('friendUsername') friendUsername: string): Promise<boolean> {
    return this.appService.addFriend(username, friendUsername);
  }

  @Patch('RemoveFriend/:username/:friendUsername')
  removeFriend(@Param('username') username: string, @Param('friendUsername') friendUsername: string): Promise<boolean> {
    return this.appService.removeFriend(username, friendUsername);
  }

  @Get('Friends/:username')
  getFriends(@Param('username') username: string): Promise<UserEntity[]> {
    return this.appService.getFriends(username);
  }

  @Get('CommentIds')
  getCommentIds(): Promise<string[]> {
    return this.appService.getCommentIds();
  }

  @Post('CreateComment')
  createComment(@Body() comment: createCommentDto): Promise<boolean> {
    return this.appService.addComment(comment.userName, comment.content, comment.postId);
  }

  @Delete('Comment/:username/:commentId')
  deleteComment(@Param('username') username: string, @Param('commentId') commentId: string): Promise<boolean> {
    return this.appService.removeComment(username, commentId);
  }

  @Patch('EditComment')
  editComment(@Body() comment: editCommentDto): Promise<boolean> {
    return this.appService.editComment(comment.userName, comment.commentId, comment.content);
  }

  @Patch('LikeComment/:username/:commentId')
  likeComment(@Param('username') username: string, @Param('commentId') commentId: string): Promise<boolean> {
    return this.appService.likeComment(username, commentId);
  }

  @Patch('UnlikeComment/:username/:commentId')
  unlikeComment(@Param('username') username: string, @Param('commentId') commentId: string): Promise<boolean> {
    return this.appService.unlikeComment(username, commentId);
  }

  @Get('LikedComments/:username')
  getLikedComments(@Param('username') username: string): Promise<CommentEntity[]> {
    return this.appService.getLikedComments(username);
  }

  @Get('CommentsForUser/:username')
  getCommentsForUser(@Param('username') username: string): Promise<CommentEntity[]> {
    return this.appService.getCommentsForUser(username);
  }

  @Get('CommentsForPost/:id')
  getCommentsForPost(@Param('id') id: string): Promise<CommentEntity[]> {
    return this.appService.getCommentsForPost(id);
  }

  @Get('CommentsForPostForUser/:username/:postId')
  getCommentsForPostForUser(@Param('username') username: string, @Param('postId') postId: string): Promise<CommentEntity[]> {
    return this.appService.getCommentsForPostForUser(username, postId);
  }

  @Get('Comment/:commentId')
  getComment(@Param('commentId') commentId: string): Promise<CommentEntity> {
    return this.appService.getComment(commentId);
  }

  @Get('PostIds')
  getPostIds(): Promise<string[]> {
    return this.appService.getPostIds();
  }

  @Post('CreatePost')
  createPost(@Body() post: createPostDto): Promise<boolean> {
    return this.appService.createPost(post.userName, post.title, post.content);
  }

  @Delete('Post/:postId')
  deletePost(@Param('postId') postId: string): Promise<boolean> {
    return this.appService.removePost(postId);
  }

  @Patch('EditPost')
  editPostContent(@Body() post: editPostDto): Promise<boolean> {
    if(post.title == null) {
      return this.appService.editPostContent(post.postId,  post.content);
    } else if (post.content == null) {
      return this.appService.editPostTitle(post.postId, post.title);
    } else {
      return this.appService.editPostTitleAndContent(post.postId, post.title, post.content);
    }
  }

  @Patch('LikePost/:username/:postId')
  likePost(@Param('username') username: string, @Param('postId') postId: string): Promise<boolean> {
    return this.appService.likePost(username, postId);
  }

  @Patch('UnlikePost/:username/:postId')
  unlikePost(@Param('username') username: string, @Param('postId') postId: string): Promise<boolean> {
    return this.appService.unlikePost(username, postId);
  }

  @Get('LikedPosts/:username')
  getLikedPosts(@Param('username') username: string): Promise<PostEntity[]> {
    return this.appService.getLikedPosts(username);
  }

  @Get('PostsForUser/:username')
  getPostsForUser(@Param('username') username: string): Promise<PostEntity[]> {
    return this.appService.getPosts(username);
  }

  @Get('Post/:postId')
  getPost(@Param('postId') postId: string): Promise<PostEntity> {
    return this.appService.getPost(postId);
  }

  @Get('UserReports/:username')
  getUserReports(@Param('username') username: string): Promise<GetUserReportDto> {
    return this.appService.getUserReports(username);
  }

}
