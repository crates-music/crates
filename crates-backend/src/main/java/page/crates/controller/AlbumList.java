package page.crates.controller;

import page.crates.controller.api.Album;
import page.crates.util.JsonToString;

import java.util.List;

public record AlbumList(List<Album> albums) {
    @Override
    public String toString() {
        return JsonToString.write(this);
    }
}
