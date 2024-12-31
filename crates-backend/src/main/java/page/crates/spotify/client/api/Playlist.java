package page.crates.spotify.client.api;

import com.fasterxml.jackson.annotation.JsonProperty;
import page.crates.util.JsonToString;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

public class Playlist implements Serializable {
    private static final long serialVersionUID = 979624734360217223L;
    private String id;
    private String href;
    private boolean collaborative;
    private String description;
    @JsonProperty("external_urls")
    private Map<String, String> externalUrls;
    private Followers followers;
    private List<Image> images;
    private String name;
    private User owner;
    @JsonProperty("public")
    private Boolean isPublic;
    @JsonProperty("snapshot_id")
    private String snapshotId;
    private Page<PlaylistTrack> tracks;
    private String type;
    private String uri;

    public String getDescription() {
        return description;
    }

    public Map<String, String> getExternalUrls() {
        return externalUrls;
    }

    public Followers getFollowers() {
        return followers;
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

    public User getOwner() {
        return owner;
    }

    public Boolean getPublic() {
        return isPublic;
    }

    public String getSnapshotId() {
        return snapshotId;
    }

    public Page<PlaylistTrack> getTracks() {
        return tracks;
    }

    public String getType() {
        return type;
    }

    public String getUri() {
        return uri;
    }

    public boolean isCollaborative() {
        return collaborative;
    }

    public void setCollaborative(boolean collaborative) {
        this.collaborative = collaborative;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setExternalUrls(Map<String, String> externalUrls) {
        this.externalUrls = externalUrls;
    }

    public void setFollowers(Followers followers) {
        this.followers = followers;
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

    public void setOwner(User owner) {
        this.owner = owner;
    }

    public void setPublic(Boolean aPublic) {
        isPublic = aPublic;
    }

    public void setSnapshotId(String snapshotId) {
        this.snapshotId = snapshotId;
    }

    public void setTracks(Page<PlaylistTrack> tracks) {
        this.tracks = tracks;
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
