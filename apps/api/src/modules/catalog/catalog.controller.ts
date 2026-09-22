import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from '../../common/auth/auth.decorators';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('products')
  @Public()
  listProducts(@Query('category') category?: string) {
    return this.catalogService.listProducts(category);
  }

  @Get('products/:id')
  @Public()
  getProduct(@Param('id') id: string) {
    return this.catalogService.getProduct(id);
  }

  @Get('transformations')
  @Public()
  listTransformationSpecs(@Query('outputProductId') outputProductId?: string) {
    return this.catalogService.listTransformationSpecs(outputProductId);
  }
}
