package page.crates.spotify.client.api;


import com.fasterxml.jackson.annotation.JsonProperty;
import page.crates.util.JsonToString;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

public class Artist implements Serializable {
    private static final long serialVersionUID = 8556822733194033604L;
    @JsonProperty("external_urls")
    private Map<String, String> externalUrls;
    private List<Image> images;
    private List<String> genres;
    private Followers followers;
    private String href;
    private String id;
    private String name;
    private int popularity;
    private String type;
    private String uri;

    public Map<String, String> getExternalUrls() {
        return externalUrls;
    }

    public Followers getFollowers() {
        return followers;
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

    public String getType() {
        return type;
    }

    public String getUri() {
        return uri;
    }

    public void setExternalUrls(Map<String, String> externalUrls) {
        this.externalUrls = externalUrls;
    }

    public void setFollowers(Followers followers) {
        this.followers = followers;
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
