import { ApiProperty } from "@nestjs/swagger";

export class createUserDto {
    @ApiProperty()
    username: string;
    @ApiProperty()
    firstName: string;
    @ApiProperty()
    lastName: string;
    @ApiProperty()
    password: string;
    @ApiProperty()
    email: string;
    @ApiProperty()
    dateOfBirth: string;
}