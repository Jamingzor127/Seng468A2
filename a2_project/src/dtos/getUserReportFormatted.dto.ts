import { ApiProperty } from "@nestjs/swagger";

export class GetUserReportFormattedDto {
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
    friendsCount: number;
    @ApiProperty()
    friendsUserNames: string[];
    @ApiProperty()
    postsCount: number;
    @ApiProperty()
    likedPostsCount: number;
    @ApiProperty()
    commentsCount:number;
    @ApiProperty()
    likedCommentsCount: number;
}