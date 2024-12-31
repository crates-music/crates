package page.crates.spotify.client.api;


import com.fasterxml.jackson.annotation.JsonProperty;
import page.crates.util.JsonToString;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

public class Track implements Serializable {
    private static final long serialVersionUID = -5285063255439740602L;
    private Album album;
    private List<Artist> artists;
    @JsonProperty("disc_number")
    private int discNumber;
    @JsonProperty("duration_ms")
    private int durationMs;
    private Boolean explicit;
    @JsonProperty("external_urls")
    private Map<String, String> externalUrls;
    private String href;
    private String id;
    private String name;
    @JsonProperty("preview_url")
    private String previewUrl;
    @JsonProperty("track_number")
    private int trackNumber;
    private String type;
    private String uri;

    public Album getAlbum() {
        return album;
    }

    public List<Artist> getArtists() {
        return artists;
    }

    public int getDiscNumber() {
        return discNumber;
    }

    public int getDurationMs() {
        return durationMs;
    }

    public Boolean getExplicit() {
        return explicit;
    }

    public Map<String, String> getExternalUrls() {
        return externalUrls;
    }

    public String getHref() {
        return href;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getPreviewUrl() {
        return previewUrl;
    }

    public int getTrackNumber() {
        return trackNumber;
    }

    public String getType() {
        return type;
    }

    public String getUri() {
        return uri;
    }

    public void setAlbum(Album album) {
        this.album = album;
    }

    public void setArtists(List<Artist> artists) {
        this.artists = artists;
    }

    public void setDiscNumber(int discNumber) {
        this.discNumber = discNumber;
    }

    public void setDurationMs(int durationMs) {
        this.durationMs = durationMs;
    }

    public void setExplicit(Boolean explicit) {
        this.explicit = explicit;
    }

    public void setExternalUrls(Map<String, String> externalUrls) {
        this.externalUrls = externalUrls;
    }

    public void setHref(String href) {
        this.href = href;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setPreviewUrl(String previewUrl) {
        this.previewUrl = previewUrl;
    }

    public void setTrackNumber(int trackNumber) {
        this.trackNumber = trackNumber;
    }

    public void setType(String type) {
        this.type = type;
    }

    public void setUri(String uri) {
        this.uri = uri;
    }

    @Override
    public String toString() {
        return JsonToString.write(this);
    }
}
