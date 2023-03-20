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

  @Delete('User/:id')
  deleteUser(@Param('id') id: string): Promise<boolean> {
    return this.appService.deleteUser(id);
  }

  @Patch('AddFriend/:id/:friendId')
  addFriend(@Param('id') id: string, @Param('friendId') friendId: string): Promise<boolean> {
    return this.appService.addFriend(id, friendId);
  }

  @Patch('RemoveFriend/:id/:friendId')
  removeFriend(@Param('id') id: string, @Param('friendId') friendId: string): Promise<boolean> {
    return this.appService.removeFriend(id, friendId);
  }

  @Get('Friends/:id')
  getFriends(@Param('id') id: string): Promise<UserEntity[]> {
    return this.appService.getFriends(id);
  }

  @Get('CommentIds')
  getCommentIds(): Promise<string[]> {
    return this.appService.getCommentIds();
  }

  @Post('CreateComment')
  createComment(@Body() comment: createCommentDto): Promise<boolean> {
    return this.appService.addComment(comment.userId, comment.content, comment.postId);
  }

  @Delete('Comment/:id/:commentId')
  deleteComment(@Param('id') id: string, @Param('commentId') commentId: string): Promise<boolean> {
    return this.appService.removeComment(id, commentId);
  }

  @Patch('EditComment')
  editComment(@Body() comment: editCommentDto): Promise<boolean> {
    return this.appService.editComment(comment.userId, comment.commentId, comment.content);
  }

  @Patch('LikeComment/:id/:commentId')
  likeComment(@Param('id') id: string, @Param('commentId') commentId: string): Promise<boolean> {
    return this.appService.likeComment(id, commentId);
  }

  @Patch('UnlikeComment/:id/:commentId')
  unlikeComment(@Param('id') id: string, @Param('commentId') commentId: string): Promise<boolean> {
    return this.appService.unlikeComment(id, commentId);
  }

  @Get('LikedComments/:id')
  getLikedComments(@Param('id') id: string): Promise<CommentEntity[]> {
    return this.appService.getLikedComments(id);
  }

  @Get('CommentsForUser/:id')
  getCommentsForUser(@Param('id') id: string): Promise<CommentEntity[]> {
    return this.appService.getCommentsForUser(id);
  }

  @Get('CommentsForPost/:id')
  getCommentsForPost(@Param('id') id: string): Promise<CommentEntity[]> {
    return this.appService.getCommentsForPost(id);
  }

  @Get('CommentsForPostForUser/:id/:postId')
  getCommentsForPostForUser(@Param('id') id: string, @Param('postId') postId: string): Promise<CommentEntity[]> {
    return this.appService.getCommentsForPostForUser(id, postId);
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
    return this.appService.createPost(post.userId, post.title, post.content);
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

  @Patch('LikePost/:id/:postId')
  likePost(@Param('id') id: string, @Param('postId') postId: string): Promise<boolean> {
    return this.appService.likePost(id, postId);
  }

  @Patch('UnlikePost/:id/:postId')
  unlikePost(@Param('id') id: string, @Param('postId') postId: string): Promise<boolean> {
    return this.appService.unlikePost(id, postId);
  }

  @Get('LikedPosts/:id')
  getLikedPosts(@Param('id') id: string): Promise<PostEntity[]> {
    return this.appService.getLikedPosts(id);
  }

  @Get('PostsForUser/:id')
  getPostsForUser(@Param('id') id: string): Promise<PostEntity[]> {
    return this.appService.getPosts(id);
  }

  @Get('Post/:postId')
  getPost(@Param('postId') postId: string): Promise<PostEntity> {
    return this.appService.getPost(postId);
  }

  @Get('UserReports/:id')
  getUserReports(@Param('id') id: string): Promise<GetUserReportDto> {
    return this.appService.getUserReports(id);
  }

}
