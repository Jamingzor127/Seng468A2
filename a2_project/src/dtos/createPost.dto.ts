import { ApiProperty } from "@nestjs/swagger";

export class createPostDto {
    @ApiProperty()
    userName: string;
    @ApiProperty()
    title: string;
    @ApiProperty()
    content: string;
}