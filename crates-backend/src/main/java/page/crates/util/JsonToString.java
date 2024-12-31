package page.crates.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * ToString helper that serializes objects into JSON.
 * This is only for use on models/dtos that are serializable.
 */
public class JsonToString {
    private static final ObjectMapper objectMapper;
    private static final Logger LOG = LoggerFactory.getLogger(JsonToString.class);

    static {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    private JsonToString() {
        throw new IllegalStateException("This is a static utility class.");
    }

    public static String write(final Object object) {
        try {
            return objectMapper.writeValueAsString(object);
        } catch (JsonProcessingException e) {
            LOG.error("{}: {}", e.getClass().getName(), e.getMessage(), e);
            return "";
        }
    }
}
