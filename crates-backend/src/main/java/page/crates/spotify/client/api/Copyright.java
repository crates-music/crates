package page.crates.spotify.client.api;

import java.io.Serializable;

public class Copyright implements Serializable {
    private static final long serialVersionUID = 8907904332457592693L;
    private String text;
    private String type;

    public String getText() {
        return text;
    }

    public String getType() {
        return type;
    }

    public void setText(String text) {
        this.text = text;
    }

    public void setType(String type) {
        this.type = type;
    }
}
