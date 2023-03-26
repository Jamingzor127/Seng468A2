import { ApiProperty } from "@nestjs/swagger";

export class editPostDto {
    @ApiProperty()
    postId: string;
    @ApiProperty()
    title: string;
    @ApiProperty()
    content: string;
}