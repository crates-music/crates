package page.crates.controller.api.mapper;

import jakarta.annotation.Resource;
import org.mapstruct.Mapper;
import page.crates.controller.api.Album;
import page.crates.entity.LibraryAlbum;

@Mapper(componentModel = "spring",
        uses = AlbumMapper.class)
public class LibraryAlbumMapper {
    @Resource
    private AlbumMapper albumMapper;

    public Album map(LibraryAlbum libraryAlbum) {
        final Album album = albumMapper.map(libraryAlbum.getAlbum());
        album.setAddedAt(libraryAlbum.getAddedAt());
        return album;
    }
}
