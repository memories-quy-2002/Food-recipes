import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiInternalServerErrorResponse } from '../../common/swagger/api-internal-server-error-response.decorator';
import { ApiErrorResponseDto, MessageResponseDto, NoteResponseDto } from '../../common/swagger/response.schemas';
import { AuthUser } from '../auth/types/auth-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NotesService, NotesServicePort } from './notes.service';

@ApiTags('Recipe notes')
@ApiBearerAuth()
@ApiInternalServerErrorResponse()
@UseGuards(JwtAuthGuard)
@Controller({ path: 'users/me/recipes', version: '1' })
export class NotesController {
  constructor(@Inject(NotesService) private readonly service: NotesServicePort) {}

  @Get(':recipeId/note')
  @ApiOperation({ summary: 'Get the authenticated user private recipe note' })
  @ApiOkResponse({ type: NoteResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  get(@CurrentUser() user: AuthUser, @Param('recipeId', ParseIntPipe) recipeId: number) {
    return this.service.get(user.id, recipeId);
  }

  @Patch(':recipeId/note')
  @ApiOperation({ summary: 'Create or update the authenticated user private recipe note' })
  @ApiOkResponse({ type: NoteResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  update(@CurrentUser() user: AuthUser, @Param('recipeId', ParseIntPipe) recipeId: number, @Body() dto: UpdateNoteDto) {
    return this.service.upsert(user.id, recipeId, dto);
  }

  @Delete(':recipeId/note')
  @ApiOperation({ summary: 'Delete the authenticated user private recipe note' })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  remove(@CurrentUser() user: AuthUser, @Param('recipeId', ParseIntPipe) recipeId: number) {
    return this.service.remove(user.id, recipeId);
  }
}
