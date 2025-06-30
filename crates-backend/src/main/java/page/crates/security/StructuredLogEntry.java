package page.crates.security;

import java.util.HashMap;
import java.util.Map;

public class StructuredLogEntry {
    private final Map<String, Object> fields = new HashMap<>();

    public StructuredLogEntry with(String key, Object value) {
        if (value != null) {
            fields.put(key, value);
        }
        return this;
    }

    public StructuredLogEntry withUserId(Long userId) {
        return with("userId", userId);
    }

    public StructuredLogEntry withCrateId(Long crateId) {
        return with("crateId", crateId);
    }

    public StructuredLogEntry withAlbumId(String albumId) {
        return with("albumId", albumId);
    }

    public StructuredLogEntry withAction(String action) {
        return with("action", action);
    }

    public StructuredLogEntry withError(String error) {
        return with("error", error);
    }

    public StructuredLogEntry withDuration(long durationMs) {
        return with("durationMs", durationMs);
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        fields.forEach((key, value) -> {
            if (sb.length() > 0) {
                sb.append(", ");
            }
            sb.append(key).append("=").append(value);
        });
        return sb.toString();
    }

    public Map<String, Object> getFields() {
        return new HashMap<>(fields);
    }
}