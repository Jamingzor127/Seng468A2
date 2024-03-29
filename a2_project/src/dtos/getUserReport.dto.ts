import { PostEntity } from "../entities/post.entity";
import { CommentEntity } from "../entities/comment.entity";
import { UserEntity } from "src/entities/user.entity";
import { ApiProperty } from "@nestjs/swagger";

export class GetUserReportDto {
    @ApiProperty()
    username: string;
    @ApiProperty()
    firstName: string;
    @ApiProperty()
    lastName: string;
    @ApiProperty()
    email: string;
    @ApiProperty()
    dateOfBirth: string;
    @ApiProperty()
    friends: UserEntity[];
    @ApiProperty()
    posts: PostEntity[];
    @ApiProperty()
    likedPosts: PostEntity[];
    @ApiProperty()
    comments: CommentEntity[];
    @ApiProperty()
    likedComments: CommentEntity[];
}