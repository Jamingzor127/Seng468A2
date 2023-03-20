import { PostEntity } from "../entities/post.entity";
import { CommentEntity } from "../entities/comment.entity";

export class GetUserReportDto {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: string;
    posts: PostEntity[];
    likedPosts: PostEntity[];
    comments: CommentEntity[];
    likedComments: CommentEntity[];
}