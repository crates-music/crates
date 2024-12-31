package page.crates.spotify.client.api;

import com.fasterxml.jackson.annotation.JsonProperty;
import page.crates.util.JsonToString;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

public class Album implements Serializable {
    private String id;
    private String href;
    private String uri;
    @JsonProperty("album_type")
    private String albumType;
    private List<Artist> artists;
    private List<Copyright> copyrights;
    @JsonProperty("external_ids")
    private Map<String, String> externalIds;
    private List<String> genres;
    private List<Image> images;
    private String name;
    private int popularity;
    @JsonProperty("release_date")
    private String releaseDate;
    @JsonProperty("release_date_precision")
    private String releaseDatePrecision;
    private Page<Track> tracks;

    public String getAlbumType() {
        return albumType;
    }

    public List<Artist> getArtists() {
        return artists;
    }

    public List<Copyright> getCopyrights() {
        return copyrights;
    }

    public Map<String, String> getExternalIds() {
        return externalIds;
    }

    public List<String> getGenres() {
        return genres;
    }

    public String getHref() {
        return href;
    }

    public String getId() {
        return id;
    }

    public List<Image> getImages() {
        return images;
    }

    public String getName() {
        return name;
    }

    public int getPopularity() {
        return popularity;
    }

    public String getReleaseDate() {
        return releaseDate;
    }

    public String getReleaseDatePrecision() {
        return releaseDatePrecision;
    }

    public Page<Track> getTracks() {
        return tracks;
    }

    public String getUri() {
        return uri;
    }

    public void setAlbumType(String albumType) {
        this.albumType = albumType;
    }

    public void setArtists(List<Artist> artists) {
        this.artists = artists;
    }

    public void setCopyrights(List<Copyright> copyrights) {
        this.copyrights = copyrights;
    }

    public void setExternalIds(Map<String, String> externalIds) {
        this.externalIds = externalIds;
    }

    public void setGenres(List<String> genres) {
        this.genres = genres;
    }

    public void setHref(String href) {
        this.href = href;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setImages(List<Image> images) {
        this.images = images;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setPopularity(int popularity) {
        this.popularity = popularity;
    }

    public void setReleaseDate(String releaseDate) {
        this.releaseDate = releaseDate;
    }

    public void setReleaseDatePrecision(String releaseDatePrecision) {
        this.releaseDatePrecision = releaseDatePrecision;
    }

    public void setTracks(Page<Track> tracks) {
        this.tracks = tracks;
    }

    public void setUri(String uri) {
        this.uri = uri;
    }

    @Override
    public String toString() {
        return JsonToString.write(this);
    }
}
