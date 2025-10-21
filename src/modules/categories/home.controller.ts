import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HomeService } from './services/home.service';
import { User } from '../auth/decorators/user.decorator';

@ApiTags('Home')
@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  @ApiOperation({
    summary: 'Get home page data',
    description:
      'Returns featured categories and 3 arrays of facilities (from specific categories).',
  })
  @ApiResponse({ status: 200, description: 'Home page data loaded successfully' })
  async getHomeData( @User() user) {
    return this.homeService.getHomeData(user);
  }
}
