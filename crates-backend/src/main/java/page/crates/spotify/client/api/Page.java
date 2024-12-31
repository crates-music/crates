package page.crates.spotify.client.api;

import page.crates.util.JsonToString;

import java.io.Serializable;
import java.util.List;

public class Page<T extends Serializable> implements Serializable {
    private static final long serialVersionUID = -2361272290089163351L;
    private String href;
    private List<T> items;
    private int limit;
    private int offset;
    private String next;
    private String previous;
    private int total;

    public String getHref() {
        return href;
    }

    public List<T> getItems() {
        return items;
    }

    public int getLimit() {
        return limit;
    }

    public String getNext() {
        return next;
    }

    public int getOffset() {
        return offset;
    }

    public String getPrevious() {
        return previous;
    }

    public int getTotal() {
        return total;
    }

    public void setHref(String href) {
        this.href = href;
    }

    public void setItems(List<T> items) {
        this.items = items;
    }

    public void setLimit(int limit) {
        this.limit = limit;
    }

    public void setNext(String next) {
        this.next = next;
    }

    public void setOffset(int offset) {
        this.offset = offset;
    }

    public void setPrevious(String previous) {
        this.previous = previous;
    }

    public void setTotal(int total) {
        this.total = total;
    }

    @Override
    public String toString() {
        return JsonToString.write(this);
    }
}
