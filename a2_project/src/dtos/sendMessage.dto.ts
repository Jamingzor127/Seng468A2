import { ApiProperty } from "@nestjs/swagger";

export class sendMessageDto {
    @ApiProperty()
    userNameSender: string;
    @ApiProperty()
    userNameReceiver: string;
    @ApiProperty()
    message: string;
}