from typing import List, Optional

from pydantic import BaseModel, Field

from domain.entities.song import Song


class SongDTO(BaseModel):
    """DTO de canción compartido entre búsqueda y biblioteca."""

    id: str
    title: str
    uploader: str
    duration: int = Field(ge=0)
    duration_formatted: str = ""
    url: str
    thumbnail: Optional[str] = None
    genre: Optional[str] = None

    @classmethod
    def from_entity(cls, song: Song) -> "SongDTO":
        return cls(
            id=song.id,
            title=song.title,
            uploader=song.uploader,
            duration=song.duration,
            duration_formatted=song.duration_formatted,
            url=song.url,
            thumbnail=song.thumbnail,
            genre=song.genre,
        )

    def to_entity(self) -> Song:
        return Song(
            id=self.id,
            title=self.title,
            uploader=self.uploader,
            duration=self.duration,
            url=self.url,
            thumbnail=self.thumbnail,
            genre=self.genre,
        )


class SearchResponse(BaseModel):
    results: List[SongDTO]
    total: int
    query: str
    cached: bool = False
