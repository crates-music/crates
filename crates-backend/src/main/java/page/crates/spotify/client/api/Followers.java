package page.crates.spotify.client.api;

import java.io.Serializable;

public class Followers implements Serializable {
    private static final long serialVersionUID = 1L;
    private String href;
    private long total;

    public String getHref() {
        return href;
    }

    public long getTotal() {
        return total;
    }

    public void setHref(String href) {
        this.href = href;
    }

    public void setTotal(long total) {
        this.total = total;
    }
}
