package page.crates.spotify.client.api;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;

public class PlaylistTrack implements Serializable {
    private static final long serialVersionUID = 2644729630833435220L;
    @JsonProperty("added_at")
    private String addedAt;
    @JsonProperty("added_by")
    private User addedBy;
    @JsonProperty("is_local")
    private Boolean local;
    @JsonProperty("primary_color")
    private String primaryColor;
    private Track track;

    public String getAddedAt() {
        return addedAt;
    }

    public User getAddedBy() {
        return addedBy;
    }

    public Boolean getLocal() {
        return local;
    }

    public String getPrimaryColor() {
        return primaryColor;
    }

    public Track getTrack() {
        return track;
    }

    public void setAddedAt(String addedAt) {
        this.addedAt = addedAt;
    }

    public void setAddedBy(User addedBy) {
        this.addedBy = addedBy;
    }

    public void setLocal(Boolean local) {
        this.local = local;
    }

    public void setPrimaryColor(String primaryColor) {
        this.primaryColor = primaryColor;
    }

    public void setTrack(Track track) {
        this.track = track;
    }
}
