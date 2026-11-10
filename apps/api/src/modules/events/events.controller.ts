import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { PublicEvent } from '@eventkita/shared';
import { EventsService } from './events.service';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar acara yang sudah dipublikasikan' })
  list(): Promise<PublicEvent[]> {
    return this.eventsService.listPublished();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Detail acara berdasarkan slug' })
  detail(@Param('slug') slug: string): Promise<PublicEvent> {
    return this.eventsService.getPublishedBySlug(slug);
  }
}
