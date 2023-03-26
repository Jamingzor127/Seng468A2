import { ApiProperty } from "@nestjs/swagger";

export class editCommentDto {
    @ApiProperty()
    userName: string;
    @ApiProperty()
    commentId: string;
    @ApiProperty()
    content: string;
}