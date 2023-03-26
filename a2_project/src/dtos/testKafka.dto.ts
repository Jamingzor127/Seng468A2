import { ApiProperty } from "@nestjs/swagger";

export class testKafkaDto {
    @ApiProperty()
    message: string;
}