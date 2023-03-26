import { ApiProperty } from "@nestjs/swagger";

export class createCommentDto {
    @ApiProperty()
    postId: string;
    @ApiProperty()
    userName: string;
    @ApiProperty()
    content: string;
}