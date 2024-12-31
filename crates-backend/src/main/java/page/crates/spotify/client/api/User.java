package page.crates.spotify.client.api;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

public class User implements Serializable {
    private static final long serialVersionUID = -4970921140340670926L;
    private String id;
    // only if `user-read-birthdate` scope.
    // form: yyyy-MM-dd
    @JsonProperty("birthdate")
    private String birthDate;
    // only if `user-read-private` scope
    private String country;
    @JsonProperty("display_name")
    private String displayName;
    private String email;
    @JsonProperty("external_urls")
    private Map<String, String> externalUrls;
    private Followers followers;
    private String href;
    private List<Image> images;
    private String product;
    // should be "user"
    private String type;
    private String uri;

    public String getBirthDate() {
        return birthDate;
    }

    public String getCountry() {
        return country;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getEmail() {
        return email;
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

    public String getProduct() {
        return product;
    }

    public String getType() {
        return type;
    }

    public String getUri() {
        return uri;
    }

    public void setBirthDate(String birthDate) {
        this.birthDate = birthDate;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public void setEmail(String email) {
        this.email = email;
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

    public void setProduct(String product) {
        this.product = product;
    }

    public void setType(String type) {
        this.type = type;
    }

    public void setUri(String uri) {
        this.uri = uri;
    }
}
