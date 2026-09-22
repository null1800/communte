import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Public, Roles } from '../../common/auth/auth.decorators';
import { CollectionPointService } from './collection-point.service';

class CreateCollectionPointDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() address!: string;
  @IsOptional() @IsUUID() operatorUserId?: string;
  @IsOptional() @IsInt() @Min(1) capacityUnits?: number;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
}

@Controller('collection-points')
export class CollectionPointController {
  constructor(private readonly collectionPointService: CollectionPointService) {}

  @Post()
  @Roles('SUPPLIER', 'ADMIN')
  create(@Body() body: CreateCollectionPointDto) {
    return this.collectionPointService.create(body);
  }

  @Get()
  @Public()
  list() {
    return this.collectionPointService.list();
  }

  @Get(':id')
  @Public()
  detail(@Param('id') id: string) {
    return this.collectionPointService.detail(id);
  }
}
