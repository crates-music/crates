package page.crates.spotify.client.api;

import java.io.Serializable;

public class Image implements Serializable {
    private static final long serialVersionUID = 1L;
    private Integer height;
    private String url;
    private Integer width;

    public Integer getHeight() {
        return height;
    }

    public String getUrl() {
        return url;
    }

    public Integer getWidth() {
        return width;
    }

    public void setHeight(Integer height) {
        this.height = height;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public void setWidth(Integer width) {
        this.width = width;
    }
}
